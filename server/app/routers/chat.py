from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import time
router = APIRouter()
@router.get("/stream")
def chat_stream(text: str | None = Query(default=None), role: str | None = Query(default=None)):
    def gen():
        msgs = ["Hello! I’m the PolyFold_RX copilot (mock).", "Use the top controls in this panel to drive the main view."]
        if text: msgs.append(f"You said: {text}")
        for m in msgs:
            yield f"data: {m}\n\n"; time.sleep(0.2)
    return StreamingResponse(gen(), media_type="text/event-stream")
