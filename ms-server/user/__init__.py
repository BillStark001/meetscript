import asyncio

from fastapi import Depends, HTTPException
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from constants import Codes, getDescription
from config import AppConfig
from user.model import create_user, authenticate_user, initialize_db
from user.auth import create_jwt_token

from base import app
from constants import Token


class RegisterForm(BaseModel):
  email: str
  username: str
  password: str

@app.post("/api/user/login")
async def login(
  response: Response,
  form_data: OAuth2PasswordRequestForm = Depends(),
):
  email = form_data.username
  password = form_data.password
  code, user = await authenticate_user(email, password)  # Use your existing authentication function

  if code == Codes.DONE:
    token = create_jwt_token( 
      user, 
      Token.Refresh, 
      AppConfig.RefreshTokenExpires
    )
    
    response.set_cookie(
      key=Token.Refresh.value, 
      value=token, 
      expires=AppConfig.RefreshTokenExpires, 
      httponly=True
    )
    return {"detail": "Done.", Token.Refresh: token}
  
  else:
    _, desc, status = getDescription(code)
    raise HTTPException(status_code=status, detail=desc)

@app.post("/api/user/register")
async def register(
  form_data: RegisterForm
):
  code = await create_user(form_data.email, form_data.username, form_data.password)
  if code == Codes.DONE:
    return {"detail": "Done."}
  
  else:
    _, desc, status = getDescription(code)
    raise HTTPException(status_code=status, detail=desc)
  
  
initialize_db()