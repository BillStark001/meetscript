from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from config import AppConfig

def create_access_token(data: dict, expires_delta: timedelta = None):
  to_encode = data.copy()
  if expires_delta:
    expire = datetime.utcnow() + expires_delta
  else:
    expire = datetime.utcnow() + timedelta(minutes=AppConfig.JwtExpireMinutes)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, AppConfig.JwtSecretKey, algorithm='HS256')
  return encoded_jwt


def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="token"))) -> dict:
  try:
    payload = jwt.decode(token, AppConfig.JwtSecretKey, algorithms=['HS256'])
    return payload
  except JWTError:
    raise HTTPException(status_code=401, detail="JWT token is invalid")
