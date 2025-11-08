import { useEffect, useRef, useState } from "react";
type Msg = { role: "user"|"assistant"; content: string };
export default function Copilot() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  function send() {
    const t = inputRef.current?.value?.trim(); if (!t) return;
    setMessages(m => [...m, { role: "user", content: t }]);
    inputRef.current!.value = "";
    const es = new EventSource(`/api/chat/stream?text=${encodeURIComponent(t)}`);
    es.onmessage = (ev) => setMessages(m => [...m, { role:"assistant", content: ev.data }]);
    es.onerror = () => es.close();
  }
  useEffect(()=>{
    const es = new EventSource(`/api/chat/stream?role=greeter`);
    es.onmessage = (ev) => setMessages(m => [...m, { role:"assistant", content: ev.data }]);
    es.onerror = () => es.close();
    return () => es.close();
  }, []);
  return (<>
    <div style={{overflow:"auto", padding:"10px"}}>
      {messages.map((m,i)=>(<div key={i} style={{margin:"6px 0"}}>
        <span style={{color: m.role==="user" ? "var(--accent)" : "var(--text)", fontWeight:600}}>{m.role==="user" ? "You" : "Agent"}:</span> {m.content}
      </div>))}
    </div>
    <div style={{display:"flex", gap:"8px", padding:"8px", borderTop:"1px solid var(--border)"}}>
      <input ref={inputRef} className="input" placeholder="Ask the agent…" style={{flex:1}} />
      <button className="btn" onClick={send}>Send</button>
    </div>
  </>);
}
