import asyncio
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from base import app

import user
import meeting

from config import EnvConfig


if EnvConfig.mount_static:
  
  @app.get("/")
  async def root():
    return FileResponse("../ms-server/wwwroot/index.html")

  app.mount("/", StaticFiles(directory="../ms-server/wwwroot"), name="static")
