import { useEffect, useRef } from "react";
export default function MoleculeViewer3D({ xyzText }: { xyzText: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if (!el.current) return;
    const w = (window as any);
    if (w.$3Dmol) {
      const viewer = (w.$3Dmol as any).createViewer(el.current, { backgroundColor: "transparent" });
      viewer.addModel(xyzText, "xyz");
      viewer.setStyle({}, { stick: {} });
      viewer.zoomTo(); viewer.render();
    } else {
      el.current.innerHTML = "<pre style=\"padding:8px;\">"+ xyzText.replace(/</g,"&lt;") +"</pre>";
    }
  }, [xyzText]);
  return <div ref={el} style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden" }} />;
}
