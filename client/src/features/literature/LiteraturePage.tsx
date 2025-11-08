import PdfViewer from "./PdfViewer";
import SchemaInspector from "./SchemaInspector";

export default function LiteraturePage() {
  return (
    <div style={{display:"grid", gridTemplateRows:"1fr auto", gap:"12px", height:"100%", overflow:"hidden"}}>
      <div className="panel" style={{padding:"10px", overflow:"auto"}}>
        <PdfViewer />
      </div>
      <div className="panel" style={{padding:"10px", overflow:"auto"}}>
        <SchemaInspector />
      </div>
    </div>
  );
}
