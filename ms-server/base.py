import asyncio
from fastapi import FastAPI
from fastapi.responses import FileResponse

# app

app = FastAPI()

@app.get('/api')
async def api_root():
  return {'detail': 'Server is running.'}
