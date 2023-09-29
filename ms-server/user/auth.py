from datetime import datetime, timedelta
from jose import ExpiredSignatureError, jwt, JWTError
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from config import AppConfig

from user.model import User, get_user


def create_jwt_token(data: User, expires_delta: timedelta = None):
  to_encode = {'sub': data.email, 'name': data.username}
  utcnow = datetime.utcnow()
  if expires_delta:
    expire = utcnow + expires_delta
  else:
    expire = utcnow + timedelta(minutes=AppConfig.JwtExpireMinutes)
  to_encode.update({'iat': utcnow, 'exp': expire})
  encoded_jwt = jwt.encode(
      to_encode, AppConfig.JwtSecretKey, algorithm='HS256')
  return encoded_jwt


def verify_jwt_token(token: str):
  payload = jwt.decode(token, AppConfig.JwtSecretKey, algorithms=['HS256'])
  email = payload.get('sub')
  issue_time = datetime.utcfromtimestamp(payload.get('iat'))
  user = get_user(email)
  if user is not None and user.pw_update > issue_time:
    return None  # the token is expired
  return user


def get_current_user_hard(token: str = Depends(OAuth2PasswordBearer(tokenUrl="token"))) -> dict:
  credentials_exception = HTTPException(
      status_code=401,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    user = verify_jwt_token(token)
    if user is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception


def get_current_user_soft(token: str = Depends(OAuth2PasswordBearer(tokenUrl="token"))) -> dict:
  try:
    user = verify_jwt_token(token)
    return user
  except JWTError:
    pass
  return None
