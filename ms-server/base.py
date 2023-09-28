from fastapi import FastAPI
from dataclasses import dataclass, field

# response format

class ResponseMessage:
  message: str = field(default='')
  code: str = field(default=0)

# app

app = FastAPI()

@app.get("/")
async def root():
  return {"message": "Hello World"}
  
