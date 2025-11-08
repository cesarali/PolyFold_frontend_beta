import { useEffect, useRef } from "react";
import { useCopilot } from "../../state/copilotStore";

type Props = { collapsed?: boolean };
type Msg = { role: "user"|"assistant"; content: string };

export default function Copilot({ collapsed }: Props) {
  const messages = useCopilot(s => s.messages);
  const append = useCopilot(s => s.append);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const greeterStartedRef = useRef(false);

  function send() {
    const t = inputRef.current?.value?.trim(); if (!t) return;
    append({ role: "user", content: t });
    inputRef.current!.value = "";
    const es = new EventSource(`/api/chat/stream?text=${encodeURIComponent(t)}`);
    es.onmessage = (ev) => append({ role:"assistant", content: ev.data });
    es.onerror = () => es.close();
  }

  // Start greeter stream only once per mount (preserved on collapse)
  useEffect(() => {
    if (greeterStartedRef.current) return;
    greeterStartedRef.current = true;
    const es = new EventSource(`/api/chat/stream?role=greeter`);
    es.onmessage = (ev) => append({ role:"assistant", content: ev.data });
    es.onerror = () => es.close();
    return () => es.close();
  }, [append]);

  // Auto-scroll to bottom when new messages arrive (only if not collapsed)
  useEffect(() => {
    if (collapsed) return;
    if (scrollRef.current) scrollRef.current.style.minHeight = "0";
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, collapsed]);

  return (
    <div style={{height:"100%", display:"grid", gridTemplateRows:"1fr auto"}}>
      {/* Scrollable messages */}
      <div
        ref={scrollRef}
        style={{ overflowY: "auto", padding: "10px", minHeight: 0 }}
      >
        {messages.map((m: Msg, i: number) => (
          <div key={i} style={{margin:"6px 0"}}>
            <span style={{color: m.role==="user" ? "var(--accent)" : "var(--text)", fontWeight:600}}>
              {m.role==="user" ? "You" : "Agent"}:
            </span>{" "}
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{display:"flex", gap:"8px", padding:"8px", borderTop:"1px solid var(--border)"}}>
        <input ref={inputRef} className="input" placeholder="Ask the agent…" style={{flex:1}} />
        <button className="btn" onClick={send}>Send</button>
      </div>
    </div>
  );
}
