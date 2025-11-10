from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from openai import OpenAI
import json

router = APIRouter()
client = OpenAI(api_key=open("./OPEN_AI_KEY.txt").read().strip())


@router.get("/stream")
def chat_stream(
    body: str | None = Query(default=None),
    text: str | None = Query(default=None),
    role: str | None = Query(default=None),
):
    def gen():
        # ---- GREETER ----
        if role == "greeter":
            yield "data: Hello! I'm the PolyFold-RX copilot.\n\n"
            yield "data: Ask me about MIPs or modeling workflows.\n\n"
            yield "data: [DONE]\n\n"
            return

        # ---- MESSAGE PREP ----
        if body:
            payload = json.loads(body)
            messages = payload.get("messages", [])
        elif text:
            messages = [
                {"role": "system", "content": "You are a helpful AI copilot."},
                {"role": "user", "content": text},
            ]
        else:
            yield "data: [error] No input provided\n\n"
            yield "data: [DONE]\n\n"
            return

        # ---- OPENAI CALL ----
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.3,
        )
        full = resp.choices[0].message.content
        # send full reply once
        yield f"data: {full}\n\n"
        yield "data: [DONE]\n\n"
        # Explicitly end generator
        return

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
