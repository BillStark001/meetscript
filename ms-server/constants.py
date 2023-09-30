from enum import Enum

class UserGroup(str, Enum):
  user = "user"
  admin = "admin"
  root = "root"
  
class TokenType(str, Enum):
  refresh = "Token.Refresh"
  access_general = "Token.Access.General"
  access_user_info = "Token.Access.UserInfo"
  
