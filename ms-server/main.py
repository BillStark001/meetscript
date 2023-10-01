import asyncio
from fastapi.staticfiles import StaticFiles

from base import app

import user
import meeting

app.mount("/", StaticFiles(directory="../ms-server/wwwroot"), name="static")
