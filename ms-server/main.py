from fastapi.staticfiles import StaticFiles

from base import app
import user



app.mount("/", StaticFiles(directory="wwwroot"), name="static")