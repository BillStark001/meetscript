import os
from fastapi.logger import logger
from dotenv import load_dotenv
from pydantic import BaseModel, field_serializer, Field, validator
from pydantic_yaml import parse_yaml_file_as, to_yaml_file
from datetime import timedelta
from typing import Dict, Union, List


from utils.data import parse_timedelta, create_timedelta_str

load_dotenv()




class AppConfigModel(BaseModel):
  
  JwtSecretKey: str = 'JWT Secret Key'
  HmacSalt: bytes = b'HMAC Salt'
  
  AccessTokenExpires: timedelta = parse_timedelta('5min')
  RefreshTokenExpires: timedelta = parse_timedelta('180d')
  
  TokenAccessOverride: Dict[str, Union[str, List[str]]] = Field(default_factory=dict)
  
  @field_serializer('AccessTokenExpires', 'RefreshTokenExpires')
  def serialize_timedelta(self, delta: timedelta):
    return create_timedelta_str(delta)
  
  @validator('AccessTokenExpires', 'RefreshTokenExpires', pre=True)
  @classmethod
  def validate_timedelta(cls, delta: str):
    return parse_timedelta(delta)

_CONFIG_PATH = './config.yaml'

try:
  AppConfig = parse_yaml_file_as(AppConfigModel, _CONFIG_PATH)
except Exception as e:
  logger.warning(e)
  AppConfig = AppConfigModel()
  if not os.path.exists(_CONFIG_PATH):
    to_yaml_file(_CONFIG_PATH, AppConfig)

