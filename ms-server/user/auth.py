import asyncio
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordBearer
from fastapi.logger import logger
from aenum import EnumType

from typing import Optional

from config import AppConfig

from user.model import User, get_user, guest_user
from constants import Codes, getDescription, Token, hasAccess, UserGroup


def create_jwt_token(
    data: User,
    token_type: str = Token.Refresh,
    expires_delta: timedelta = None
):
  to_encode = {'sub': data.email, 'name': data.username, 'type': token_type}
  utcnow = datetime.utcnow()
  if expires_delta:
    expire = utcnow + expires_delta
  else:
    expire = utcnow + AppConfig.AccessTokenExpires
  to_encode.update({'iat': utcnow, 'exp': expire})
  encoded_jwt = jwt.encode(
      to_encode, AppConfig.JwtSecretKey, algorithm='HS256')
  return encoded_jwt


async def verify_jwt_token(
    token: str,
    token_type: Optional[str] = None
):
  if not token:
    return None, True
  try:
    payload = jwt.decode(token, AppConfig.JwtSecretKey, algorithms=['HS256'])
  except JWTError:
    return None, True  # the token is invalid
  email = payload.get('sub')
  issue_time = datetime.utcfromtimestamp(payload.get('iat'))
  user = await get_user(email)
  if user is not None and user.pw_update > issue_time:
    return None, True  # the token is expired
  if token_type is not None and token_type != payload.get('type'):
    return user, False  # wrong type
  return user, True


_, _af_desc, _af_code = getDescription(Codes.ERR_AUTH_FAILED)
_, _wt_desc, _wt_code = getDescription(Codes.ERR_WRONG_TOKEN_TYPE)


async def get_current_user(
    request: Request,
    response: Response,
    token: str = Depends(OAuth2PasswordBearer(
        tokenUrl="token", auto_error=False)),
    token_type: Optional[str] = None,
    hard: bool = True
) -> Optional[User]:
  async def _v(token_type: str):
    user, right_type = await verify_jwt_token(token, token_type)
    _type = token_type if token_type is not None else Token.Refresh.value
    if (user is None or not right_type) and _type in request.cookies:
      user, right_type = await verify_jwt_token(request.cookies.get(_type), None)
    return user, right_type

  # first try auth header and then cookie
  user, right_type = await _v(token_type)

  # if type is none, right_type is guaranteed to be true
  if token_type is not None and \
          token_type != Token.Refresh and (user is None or not right_type):
    # try to get the refresh token
    user_refresh, right_type = await _v(Token.Refresh.value)
    flag = True

    if user_refresh is None:
      # there is no valid refresh token
      right_type = False
      flag = False

    elif user is None or user_refresh.email != user.email:
      # there is a refresh token for another user
      user = user_refresh

    if flag and hasAccess(user.group, token_type):
      # there is valid refresh token, grant a new access token if accessible
      access_token = create_jwt_token(
          user, token_type, AppConfig.AccessTokenExpires)
      response.set_cookie(
          token_type,
          access_token,
          expires=AppConfig.AccessTokenExpires,
          httponly=True
      )
      right_type = True

  # if hard mode, raise error or guest user
  # else return user if available
  guest_flag = token_type is not None and hasAccess(
      UserGroup.Guest, token_type)
  if user is None and hard:
    if guest_flag:
      return guest_user
    raise HTTPException(_af_code, detail=_af_desc, headers={
                        "WWW-Authenticate": "Bearer"})
  if not right_type and hard:
    if guest_flag:
      return guest_user
    raise HTTPException(_wt_code, detail=_wt_desc, headers={
                        "WWW-Authenticate": "Bearer"})

  return user


async def get_current_user_ws(token: str, token_type: Optional[str] = None, hard: bool = True):
  user, right_type = verify_jwt_token(token, token_type)
  guest_flag = token_type is not None and hasAccess(
      UserGroup.Guest, token_type)
  if user is None or not right_type:
    if not guest_flag and hard:
      return None
    return guest_user
  return user


class CurrentUser:
  """
  Get the current user based on the provided authentication token.

  Args:
      type (Optional[str], optional): The type of token, if specified. Defaults to None.
      hard (bool, optional): Whether to enforce strict authentication. Defaults to True.

  Raises:
      HTTPException: Raised when authentication fails.

  Returns:
      Optional[User]: The authenticated user if successful, else None.
  """

  def __init__(
      self,
      token_type: Optional[str] = None,
      hard: bool = True
  ):
    self.token_type = token_type.value if type(
        type(token_type)) == EnumType else token_type
    self.hard = hard

  async def __call__(
      self,
      request: Request,
      response: Response,
      token: str = Depends(OAuth2PasswordBearer(
          tokenUrl="token", auto_error=False)),
  ):
    return await get_current_user(request, response, token, self.token_type, self.hard)
