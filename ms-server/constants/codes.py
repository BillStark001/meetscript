class Codes:
  
  DONE: int = 0, 'Operation Successful.', 200
  
  ERR_INVALID_USERNAME = 10
  ERR_INVALID_PASSWORD = 11
  ERR_INVALID_EMAIL = 12
  
  ERR_EXISTENT_EMAIL = 15
  
  ERR_WRONG_UNAME_OR_PW = 30
  ERR_AUTH_FAILED: int = 50, 'Could not validate credentials', 401
  ERR_WRONG_TOKEN_TYPE: int = 51, 'Wrong token type', 401
  
def _gen_desc():
  res = {}
  for code_str, c in Codes.__dict__.items():
    if not isinstance(c, (int, tuple)):
      continue
    if isinstance(c, int):
      c = (c,)
    
    code_int = c[0]
    desc = c[1] if len(c) > 1 and c[1] else code_str
    status = c[2] if len(c) > 2 else 400
    
    setattr(Codes, code_str, code_int)
    
    res[code_int] = (code_str, desc, status)
  return res
    
_descs = _gen_desc()

def getDescription(code: int) -> tuple:
  return _descs.get(code, (code, 'Unknown Status.', 200))
    