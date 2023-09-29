from fastapi import FastAPI, Request, Response, HTTPException
from dataclasses import dataclass, field, asdict
from dataclasses_json import config, dataclass_json, LetterCase
from typing import Optional
import json

# response format

@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ResponseMessage:
  code: int = field(default=0)
  message: str = field(default='')
  detail: Optional[dict] = field(
    default=None, 
    metadata=config(exclude=lambda x: x is None)
  )

# app

app = FastAPI()

async def custom_exception_middleware(request: Request, call_next):
  try:
    response = await call_next(request)
    return response
  except HTTPException as exc:
    msg = ResponseMessage(code=-1, message='')
    try:
      msg.detail = json.loads(exc.detail)
    except ValueError:
      msg.message = str(exc.detail)
    response = Response(content=msg.to_json(), status_code=exc.status_code, media_type="application/json")
    return response
  except Exception as e:
    msg = ResponseMessage(code=-1, message=str(e))
    response = Response(content=msg.to_json(), status_code=500, media_type="application/json")

# app.middleware('http')(custom_exception_middleware)
# app.middleware('https')(custom_exception_middleware)

@app.get("/")
async def root():
  return {"message": "Hello World"}
  
