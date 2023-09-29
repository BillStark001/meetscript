# main.py

from fastapi import FastAPI, Depends, HTTPException, Cookie
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional

from codes import Codes
from config import AppConfig
from user.model import create_user, authenticate_user
from user.auth import create_jwt_token, verify_jwt_token

from base import app, ResponseMessage

# User login endpoint
@app.post("/api/user/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
  email = form_data.username
  password = form_data.password
  code, user = authenticate_user(email, password)  # Use your existing authentication function

  if code == Codes.DONE:
    token = create_jwt_token(user)
    response_raw = ResponseMessage(detail={"refresh_token": token})
    response = JSONResponse(content=response_raw)
    response.set_cookie(
      key="refresh_token", 
      value=token, 
      expires=timedelta(minutes=AppConfig.JwtExpireMinutes), 
      httponly=True
    )
    return response
  
  elif code == Codes.ERR_WRONG_UNAME_OR_PW:
    raise HTTPException(status_code=401, detail="Incorrect username or password")
  else:
    raise HTTPException(status_code=400, detail="Invalid input")
