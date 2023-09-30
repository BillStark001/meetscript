from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer

from typing import Optional

from config import AppConfig

from user.model import User, get_user
from codes import Codes, getDescription
from constants import TokenType


def create_jwt_token(
    data: User,
    type: str = TokenType.refresh,
    expires_delta: timedelta = None
):
  to_encode = {'sub': data.email, 'name': data.username, 'type': type}
  utcnow = datetime.utcnow()
  if expires_delta:
    expire = utcnow + expires_delta
  else:
    expire = utcnow + timedelta(minutes=AppConfig.JwtExpireMinutes)
  to_encode.update({'iat': utcnow, 'exp': expire})
  encoded_jwt = jwt.encode(
      to_encode, AppConfig.JwtSecretKey, algorithm='HS256')
  return encoded_jwt


def verify_jwt_token(
    token: str,
    type: Optional[str] = None
):
  payload = jwt.decode(token, AppConfig.JwtSecretKey, algorithms=['HS256'])
  email = payload.get('sub')
  issue_time = datetime.utcfromtimestamp(payload.get('iat'))
  user = get_user(email)
  if user is not None and user.pw_update > issue_time:
    return None, True  # the token is expired
  if type is not None and type != payload.get('type'):
    return user, False  # wrong type
  return user, True


_, _af_desc, _af_code = getDescription(Codes.ERR_AUTH_FAILED)
_, _wt_desc, _wt_code = getDescription(Codes.ERR_WRONG_TOKEN_TYPE)


def get_current_user(
    request: Request,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="token")),
    type: Optional[str] = None,
    hard: bool = True
) -> dict:
  
  # first try auth header
  try:
    user, right_type = verify_jwt_token(token, type)
  except JWTError:
    user = None
    right_type = True
    
  # if failed, try cookie
  if (user is None or not right_type) and type in request.cookies:
    try:
      user, right_type = verify_jwt_token(request.cookies.get(type), None)
    except JWTError:
      user = None
      right_type = True
    
  # if hard mode, raise error
  # else return user if available
  if user is None and hard:
    raise HTTPException(_af_code, detail=_af_desc, headers={"WWW-Authenticate": "Bearer"})
  if not right_type and hard:
    raise HTTPException(_wt_code, detail=_wt_desc, headers={"WWW-Authenticate": "Bearer"})
  
  return user
