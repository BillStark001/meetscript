from fastapi import FastAPI

from config import AppConfig

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}
