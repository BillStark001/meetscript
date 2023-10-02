import asyncio
from fastapi import FastAPI
from fastapi.responses import FileResponse

# app

app = FastAPI()


@app.get("/")
async def root():
  return FileResponse("../ms-server/wwwroot/index.html")

@app.get('/api')
async def api_root():
  return {'detail': 'Server is running.'}
