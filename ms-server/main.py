import asyncio
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from base import app, BaseResponseModel

import user
import admin
import meeting

from config import EnvConfig


if EnvConfig.mount_static:
  
  @app.get("/")
  async def root():
    return FileResponse("../ms-server/wwwroot/index.html")

  app.mount("/", StaticFiles(directory="../ms-server/wwwroot"), name="static")

else:
  
  @app.get('/')
  async def root():
    return BaseResponseModel(detail='This is the root API entry point.')