import { useEffect, useRef } from "react";
import { useCopilot } from "../../state/copilotStore";

type Props = { collapsed?: boolean };
type Msg = { role: "user" | "assistant"; content: string };

export default function Copilot({ collapsed }: Props) {
  const messages = useCopilot((s) => s.messages);
  const append = useCopilot((s) => s.append);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const greeterStartedRef = useRef(false);

  async function send() {
    const text = inputRef.current?.value?.trim();
    if (!text) return;

    // Append the new user message locally
    append({ role: "user", content: text });
    inputRef.current!.value = "";

    // Filter out empty assistant stubs
    const cleanHistory = messages.filter(
      (m) => m.role !== "assistant" || (m.content && m.content.trim() !== "")
    );

    // Add a system prompt at the very start
    const systemPrompt = {
      role: "system",
      content:
        "You are the PolyFold-RX copilot. You answer conversationally and remember previous context in this chat.",
    };

    // Build the full conversation payload
    const payload = {
      messages: [systemPrompt, ...cleanHistory, { role: "user", content: text }],
    };

    // Open streaming connection
    const es = new EventSource(
      `/api/chat/stream?body=${encodeURIComponent(JSON.stringify(payload))}`
    );

    // Prepare a streaming assistant message
    let current = { role: "assistant", content: "" };
    append(current);

    es.onmessage = (ev) => {
      if (ev.data === "[DONE]") {
        es.close();
        return;
      }
      current.content += ev.data;
      useCopilot.setState((s) => {
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = { ...current };
        return { messages: msgs };
      });
    };

    es.onerror = () => es.close();
  }



  // Greeter runs once
  useEffect(() => {
    if (greeterStartedRef.current) return;
    greeterStartedRef.current = true;

    const es = new EventSource(`/api/chat/stream?role=greeter`);
    es.onmessage = (ev) =>
      append({ role: "assistant", content: ev.data });
    es.onerror = () => es.close();
    return () => es.close();
  }, [append]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (collapsed) return;
    if (scrollRef.current) scrollRef.current.style.minHeight = "0";
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, collapsed]);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "1fr auto" }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ overflowY: "auto", padding: "10px", minHeight: 0 }}
      >
        {messages.map((m: Msg, i: number) => (
          <div
            key={i}
            style={{
              margin: "6px 0",
              whiteSpace: "pre-wrap", // keeps accents & line breaks
            }}
          >
            <span
              style={{
                color: m.role === "user" ? "var(--accent)" : "var(--text)",
                fontWeight: 600,
              }}
            >
              {m.role === "user" ? "You" : "Agent"}:
            </span>{" "}
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <input
          ref={inputRef}
          className="input"
          placeholder="Ask the agent…"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
