# server/app/utils/aidesigner_helpers.py
from __future__ import annotations

import os
import re
from typing import Dict, Iterable, List, Optional, Tuple

# === PolyTao + RDKit deps ===
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, rdMolDescriptors, rdBase

# Quiet RDKit parse spam
rdBase.DisableLog("rdApp.error")

# -----------------------------------------------------------------------------
# Model cache
# -----------------------------------------------------------------------------
MODEL_NAME: str = os.getenv("POLYTAO_MODEL", "hkqiu/PolyTAO-BigSMILES_Version")

_tokenizer: Optional[AutoTokenizer] = None
_model: Optional[AutoModelForSeq2SeqLM] = None
_device: Optional[str] = None
_bad_words_ids: Optional[List[List[int]]] = None  # ban literal special tokens

def get_model() -> Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, str, Optional[List[List[int]]]]:
    """
    Lazy-load and cache the tokenizer/model/device and a bad_words_ids list
    to discourage literal special tokens in generation.
    """
    global _tokenizer, _model, _device, _bad_words_ids
    if _tokenizer is None or _model is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME).to(_device).eval()

        # Build bad_words_ids to reduce junk like <pad>, <s>, </s> appearing literally
        _bad_words_ids = []
        for tok in ["<pad>", "<s>", "</s>"]:
            if tok in _tokenizer.get_vocab():
                _bad_words_ids.append([_tokenizer.convert_tokens_to_ids(tok)])
        if _tokenizer.pad_token_id is not None:
            _bad_words_ids.append([_tokenizer.pad_token_id])
        # NOTE: keep eos allowed so generation can stop naturally.
    return _tokenizer, _model, _device or "cpu", (_bad_words_ids or None)


# -----------------------------------------------------------------------------
# Prompt building
# -----------------------------------------------------------------------------
TARGET_PROPERTIES: Dict[str, str] = {
    "deltaE_kJmol": "ΔE (kJ/mol)",
    "Mw": "Mw (g/mol)",
    "LogP": "LogP",
    "TPSA": "TPSA (Å²)",
    "NumRings": "NumRings",
    "NumRotatableBonds": "NumRotatableBonds",
}

def build_prompt(template: Optional[str],
                 targets: Iterable[object] | None,
                 options: Dict | None) -> str:
    """
    Compose a plain-English conditional prompt from targets + optional template.
    Works with either Pydantic objects exposing `.kind`/`.value` or plain dicts.
    """
    kv: Dict[str, object] = {}
    for t in (targets or []):
        if hasattr(t, "kind") and hasattr(t, "value"):
            k, v = t.kind, t.value
        elif isinstance(t, dict):
            k, v = t.get("kind"), t.get("value")
        else:
            continue
        if k is not None:
            kv[str(k)] = v

    parts: List[str] = []
    if "Mw" in kv: parts.append(f"Mw={kv['Mw']}")
    if "LogP" in kv: parts.append(f"logP={kv['LogP']}")
    if "TPSA" in kv: parts.append(f"TPSA={kv['TPSA']}")
    if "NumRings" in kv: parts.append(f"{kv['NumRings']} ring structures")
    if "NumRotatableBonds" in kv: parts.append(f"{kv['NumRotatableBonds']} rotatable bonds")

    target_clause = ", ".join(parts) if parts else "reasonable properties"
    base = f"Generate a polymer with {target_clause}."
    if template:
        base += f" Template hint: {template}"
    base += " Return a valid SMILES only, no explanation."
    return base


# -----------------------------------------------------------------------------
# Generation
# -----------------------------------------------------------------------------
@torch.inference_mode()
def sample_texts(prompt: str,
                 n: int = 8,
                 max_new_tokens: int = 128,
                 temperature: float = 0.9,
                 top_p: float = 0.95,
                 top_k: int = 0,
                 repetition_penalty: float = 1.05) -> List[str]:
    tokenizer, model, device, bad_words_ids = get_model()
    enc = tokenizer(prompt, return_tensors="pt")
    input_ids = enc["input_ids"].to(device)
    attention_mask = enc.get("attention_mask", None)
    if attention_mask is not None:
        attention_mask = attention_mask.to(device)

    out = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        do_sample=True,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        max_new_tokens=max_new_tokens,
        num_return_sequences=n,
        repetition_penalty=repetition_penalty,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id,
        bad_words_ids=bad_words_ids,  # reduce literal special tokens in output
    )
    return [tokenizer.decode(o, skip_special_tokens=True).strip() for o in out]


# -----------------------------------------------------------------------------
# SMILES extraction (robust)
# -----------------------------------------------------------------------------
_ELEMENT_TOKENS = {"H", "B", "C", "N", "O", "F", "P", "S", "Cl", "Br", "I"}
_FEATURE_REGEXES = [
    re.compile(r"[=#]"),    # multiple bonds
    re.compile(r"[()]"),    # branches
    re.compile(r"\d"),      # ring indices
    re.compile(r"[a-z]"),   # aromatics
]
_ALLOWED_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789[]()=#%+-@\\/.*:$|")

def _basic_clean(text: str) -> str:
    t = re.sub(r"<[^>]+>", " ", text.replace("\n", " "))
    t = re.sub(r"\s+", " ", t).strip(" <>“”\"'")
    return t

def _split_candidates(text: str) -> list[str]:
    raw = re.split(r"[,\s;<>]+", text)
    toks = [tok.strip(" <>“”\"'`()[]{}") for tok in raw if tok.strip()]
    return [t for t in toks if t not in _ELEMENT_TOKENS]

def _score_smiles(smi: str) -> float:
    m = Chem.MolFromSmiles(smi)
    if not m:
        return -1e9
    heavy = m.GetNumHeavyAtoms()
    length_bonus = min(len(smi), 200) * 0.1
    feature_bonus = sum(1.0 for rgx in _FEATURE_REGEXES if rgx.search(smi))
    return heavy * 10.0 + length_bonus + feature_bonus

def _greedy_rescue(token: str, min_len: int = 5):
    tok = token
    if sum(ch not in _ALLOWED_CHARS for ch in tok) > 2:
        tok = "".join(ch for ch in tok if ch in _ALLOWED_CHARS)
    tok = tok.strip()
    if len(tok) < min_len:
        return None

    if Chem.MolFromSmiles(tok):
        return tok

    r = tok
    while len(r) >= min_len:
        if Chem.MolFromSmiles(r):
            return r
        r = r[:-1]

    l = tok
    while len(l) >= min_len:
        if Chem.MolFromSmiles(l):
            return l
        l = l[1:]

    return None

def clean_text_to_smiles(text: str,
                         min_heavy_atoms: int = 4,
                         min_len: int = 5) -> Optional[str]:
    """
    Robust extractor: collect direct parses and rescued substrings, score them,
    and return the best candidate (canonicalized).
    """
    t = _basic_clean(text)

    m_whole = Chem.MolFromSmiles(t)
    if m_whole and m_whole.GetNumHeavyAtoms() >= min_heavy_atoms and len(t) >= min_len:
        return Chem.MolToSmiles(m_whole, canonical=True)

    valid: list[str] = []
    for tok in _split_candidates(t):
        if len(tok) < min_len:
            continue

        m = Chem.MolFromSmiles(tok)
        if m and m.GetNumHeavyAtoms() >= min_heavy_atoms:
            valid.append(tok)
            continue

        rescued = _greedy_rescue(tok, min_len=min_len)
        if rescued:
            m2 = Chem.MolFromSmiles(rescued)
            if m2 and m2.GetNumHeavyAtoms() >= min_heavy_atoms:
                valid.append(rescued)

    if not valid:
        return None

    best = max(valid, key=_score_smiles)
    return Chem.MolToSmiles(Chem.MolFromSmiles(best), canonical=True)


def canonize_smiles(smiles: str) -> Optional[str]:
    m = Chem.MolFromSmiles(smiles)
    if m is None:
        return None
    try:
        Chem.SanitizeMol(m)
    except Exception:
        try:
            Chem.Kekulize(m, clearAromaticFlags=True)
        except Exception:
            pass
    return Chem.MolToSmiles(m, canonical=True)


def compute_properties(smiles: str) -> Optional[Dict[str, float | int | str]]:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    props: Dict[str, float | int | str] = {
        "MW": Descriptors.MolWt(mol),
        "LogP": Crippen.MolLogP(mol),
        "TPSA": rdMolDescriptors.CalcTPSA(mol),
        "NumRings": Chem.rdMolDescriptors.CalcNumRings(mol),
        "NumRotatableBonds": Descriptors.NumRotatableBonds(mol),
    }
    try:
        from rdkit.Chem import inchi as rdInchi  # optional
        props["InchiKey"] = rdInchi.MolToInchiKey(mol)
    except Exception:
        props["InchiKey"] = None
    return props


# -----------------------------------------------------------------------------
# Summaries for UI from COMPUTED candidate properties
# -----------------------------------------------------------------------------
PROPERTY_KEYS = ["MW", "LogP", "TPSA", "NumRings", "NumRotatableBonds"]

def summarize_candidate_properties(candidates: Iterable[Dict[str, object]]) -> List[Dict[str, float]]:
    """
    Aggregate REAL computed properties from candidates into UI-friendly summary:
    returns a list of {kind, sum, doubled}. Ignores missing values.
    """
    sums: Dict[str, float] = {k: 0.0 for k in PROPERTY_KEYS}
    counts: Dict[str, int] = {k: 0 for k in PROPERTY_KEYS}

    for c in candidates or []:
        props = c.get("properties") if isinstance(c, dict) else None
        if not isinstance(props, dict):
            continue
        for k in PROPERTY_KEYS:
            v = props.get(k)
            if isinstance(v, (int, float)):
                sums[k] += float(v)
                counts[k] += 1

    summaries: List[Dict[str, float]] = []
    for k in PROPERTY_KEYS:
        if counts[k] > 0:
            total = sums[k]
            summaries.append({"kind": k, "sum": total, "doubled": 2.0 * total})
    return summaries
