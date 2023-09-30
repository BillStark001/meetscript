from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# app

app = FastAPI()


@app.get("/")
async def root():
  return FileResponse("wwwroot/index.html")

@app.get('/api')
async def api_root():
  return {'detail': 'Server is running.'}

app.mount("/", StaticFiles(directory="wwwroot"), name="static")
