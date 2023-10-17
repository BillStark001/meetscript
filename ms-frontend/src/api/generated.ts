// To parse this data:
//
//   import { Convert, Backend } from "./file";
//
//   const backend = Convert.toBackend(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export type Backend = {
  openapi:    string;
  info:       BackendInfo;
  paths:      Paths;
  components: Components;
}

export type Components = {
  schemas:         Schemas;
  securitySchemes: SecuritySchemes;
}

export type Schemas = {
  baseResponseModel:   BaseResponseModel;
  changeInfoForm:      ChangeInfoForm;
  changePasswordForm:  ChangePasswordForm;
  httpValidationError: HTTPValidationError;
  initParams:          InitParams;
  loginForm:           LoginForm;
  registerForm:        RegisterForm;
  tokenResponseModel:  TokenResponseModel;
  validationError:     ValidationError;
}

export type BaseResponseModel = {
  properties: BaseResponseModelProperties;
  type:       string;
  title:      string;
}

export type BaseResponseModelProperties = {
  code:   Code;
  info:   PropertiesInfo;
  detail: PurpleDetail;
}

export type Code = {
  type:    string;
  title:   string;
  default: number;
}

export type PurpleDetail = {
  anyOf: DetailAnyOf[];
  title: string;
}

export type DetailAnyOf = {
  type:   string;
  items?: Scopes;
}

export type Scopes = {
}

export type PropertiesInfo = {
  type:    Type;
  title:   string;
  default: string;
}

export type Type = "string";

export type ChangeInfoForm = {
  properties: ChangeInfoFormProperties;
  type:       string;
  required:   string[];
  title:      string;
}

export type ChangeInfoFormProperties = {
  username: Username;
}

export type Username = {
  type:  Type;
  title: string;
}

export type ChangePasswordForm = {
  properties: ChangePasswordFormProperties;
  type:       string;
  required:   string[];
  title:      string;
}

export type ChangePasswordFormProperties = {
  pwdOld: Username;
  pwdNew: Username;
}

export type HTTPValidationError = {
  properties: HTTPValidationErrorProperties;
  type:       string;
  title:      string;
}

export type HTTPValidationErrorProperties = {
  detail: FluffyDetail;
}

export type FluffyDetail = {
  items: SchemaClass;
  type:  string;
  title: string;
}

export type SchemaClass = {
  ref: string;
}

export type InitParams = {
  properties: InitParamsProperties;
  type:       string;
  title:      string;
}

export type InitParamsProperties = {
  session: Name;
  name:    Name;
  time:    Time;
}

export type Name = {
  anyOf: NameAnyOf[];
  title: string;
}

export type NameAnyOf = {
  type: string;
}

export type Time = {
  anyOf: TimeAnyOf[];
  title: string;
}

export type TimeAnyOf = {
  type:    string;
  format?: string;
}

export type LoginForm = {
  properties: LoginFormProperties;
  type:       string;
  required:   string[];
  title:      string;
}

export type LoginFormProperties = {
  username: Username;
  password: Username;
}

export type RegisterForm = {
  properties: RegisterFormProperties;
  type:       string;
  required:   string[];
  title:      string;
}

export type RegisterFormProperties = {
  email:    Username;
  username: Username;
  password: Username;
}

export type TokenResponseModel = {
  properties: TokenResponseModelProperties;
  type:       string;
  title:      string;
}

export type TokenResponseModelProperties = {
  code:        Code;
  info:        PropertiesInfo;
  detail:      PurpleDetail;
  tokens:      Name;
  accessToken: Name;
}

export type ValidationError = {
  properties: ValidationErrorProperties;
  type:       string;
  required:   string[];
  title:      string;
}

export type ValidationErrorProperties = {
  loc:  LOC;
  msg:  Username;
  type: Username;
}

export type LOC = {
  items: LOCItems;
  type:  string;
  title: string;
}

export type LOCItems = {
  anyOf: NameAnyOf[];
}

export type SecuritySchemes = {
  oAuth2PasswordBearer: OAuth2PasswordBearer;
}

export type OAuth2PasswordBearer = {
  type:  string;
  flows: Flows;
}

export type Flows = {
  password: Password;
}

export type Password = {
  scopes:   Scopes;
  tokenURL: string;
}

export type BackendInfo = {
  title:   string;
  version: string;
}

export type Paths = {
  api:               API;
  apiUserLogin:      APIMeetInitClass;
  apiUserRegister:   APIMeetInitClass;
  apiUserPwChange:   APIMeetInitClass;
  apiUserInfoChange: APIMeetInitClass;
  apiMeetInit:       APIMeetInitClass;
  apiMeetClose:      APIMeetClose;
  apiMeetWsRequest:  APIMeetWsRequest;
  empty:             Empty;
}

export type API = {
  get: PostClass;
}

export type PostClass = {
  summary:     string;
  operationID: string;
  responses:   PostResponses;
  security?:   Security[];
}

export type PostResponses = {
  the200: The200_Value;
}

export type The200_Value = {
  description: Description;
  content:     ResponseContent;
}

export type ResponseContent = {
  applicationJSON: FluffyApplicationJSON;
}

export type FluffyApplicationJSON = {
  schema: SchemaClass;
}

export type Description = "Successful Response" | "Validation Error";

export type Security = {
  oAuth2PasswordBearer: any[];
}

export type APIMeetClose = {
  post: PostClass;
}

export type APIMeetInitClass = {
  post: Post;
}

export type Post = {
  summary:      string;
  operationID:  string;
  requestBody?: RequestBody;
  responses:    { [key: string]: The200_Value };
  security?:    Security[];
  parameters?:  Parameter[];
}

export type Parameter = {
  name:     string;
  in:       string;
  required: boolean;
  schema:   Schema;
}

export type Schema = {
  type:    string;
  default: boolean;
  title:   string;
}

export type RequestBody = {
  content:  ResponseContent;
  required: boolean;
}

export type APIMeetWsRequest = {
  get: Post;
}

export type Empty = {
  get: Get;
}

export type Get = {
  summary:     string;
  operationID: string;
  responses:   PurpleResponses;
}

export type PurpleResponses = {
  the200: Purple200;
}

export type Purple200 = {
  description: Description;
  content:     PurpleContent;
}

export type PurpleContent = {
  applicationJSON: PurpleApplicationJSON;
}

export type PurpleApplicationJSON = {
  schema: Scopes;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toBackend(json: string): Backend {
      return cast(JSON.parse(json), r("Backend"));
  }

  public static backendToJson(value: Backend): string {
      return JSON.stringify(uncast(value, r("Backend")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : '';
  const keyText = key ? ` for key "${key}"` : '';
  throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
      if (typ.length === 2 && typ[0] === undefined) {
          return `an optional ${prettyTypeName(typ[1])}`;
      } else {
          return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
      }
  } else if (typeof typ === "object" && typ.literal !== undefined) {
      return typ.literal;
  } else {
      return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
      const map: any = {};
      typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
      typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
      const map: any = {};
      typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
      typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
      if (typeof typ === typeof val) return val;
      return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
      // val must validate against one typ in typs
      const l = typs.length;
      for (let i = 0; i < l; i++) {
          const typ = typs[i];
          try {
              return transform(val, typ, getProps);
          } catch (_) {}
      }
      return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
      if (cases.indexOf(val) !== -1) return val;
      return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
  }

  function transformArray(typ: any, val: any): any {
      // val must be an array with no invalid elements
      if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
      return val.map(el => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
      if (val === null) {
          return null;
      }
      const d = new Date(val);
      if (isNaN(d.valueOf())) {
          return invalidValue(l("Date"), val, key, parent);
      }
      return d;
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
      if (val === null || typeof val !== "object" || Array.isArray(val)) {
          return invalidValue(l(ref || "object"), val, key, parent);
      }
      const result: any = {};
      Object.getOwnPropertyNames(props).forEach(key => {
          const prop = props[key];
          const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
          result[prop.key] = transform(v, prop.typ, getProps, key, ref);
      });
      Object.getOwnPropertyNames(val).forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(props, key)) {
              result[key] = transform(val[key], additional, getProps, key, ref);
          }
      });
      return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
      if (val === null) return val;
      return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === "object" && typ.ref !== undefined) {
      ref = typ.ref;
      typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
      return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
          : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
          : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  "Backend": o([
      { json: "openapi", js: "openapi", typ: "" },
      { json: "info", js: "info", typ: r("BackendInfo") },
      { json: "paths", js: "paths", typ: r("Paths") },
      { json: "components", js: "components", typ: r("Components") },
  ], false),
  "Components": o([
      { json: "schemas", js: "schemas", typ: r("Schemas") },
      { json: "securitySchemes", js: "securitySchemes", typ: r("SecuritySchemes") },
  ], false),
  "Schemas": o([
      { json: "BaseResponseModel", js: "baseResponseModel", typ: r("BaseResponseModel") },
      { json: "ChangeInfoForm", js: "changeInfoForm", typ: r("ChangeInfoForm") },
      { json: "ChangePasswordForm", js: "changePasswordForm", typ: r("ChangePasswordForm") },
      { json: "HTTPValidationError", js: "httpValidationError", typ: r("HTTPValidationError") },
      { json: "InitParams", js: "initParams", typ: r("InitParams") },
      { json: "LoginForm", js: "loginForm", typ: r("LoginForm") },
      { json: "RegisterForm", js: "registerForm", typ: r("RegisterForm") },
      { json: "TokenResponseModel", js: "tokenResponseModel", typ: r("TokenResponseModel") },
      { json: "ValidationError", js: "validationError", typ: r("ValidationError") },
  ], false),
  "BaseResponseModel": o([
      { json: "properties", js: "properties", typ: r("BaseResponseModelProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "BaseResponseModelProperties": o([
      { json: "code", js: "code", typ: r("Code") },
      { json: "info", js: "info", typ: r("PropertiesInfo") },
      { json: "detail", js: "detail", typ: r("PurpleDetail") },
  ], false),
  "Code": o([
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
      { json: "default", js: "default", typ: 0 },
  ], false),
  "PurpleDetail": o([
      { json: "anyOf", js: "anyOf", typ: a(r("DetailAnyOf")) },
      { json: "title", js: "title", typ: "" },
  ], false),
  "DetailAnyOf": o([
      { json: "type", js: "type", typ: "" },
      { json: "items", js: "items", typ: u(undefined, r("Scopes")) },
  ], false),
  "Scopes": o([
  ], false),
  "PropertiesInfo": o([
      { json: "type", js: "type", typ: r("Type") },
      { json: "title", js: "title", typ: "" },
      { json: "default", js: "default", typ: "" },
  ], false),
  "ChangeInfoForm": o([
      { json: "properties", js: "properties", typ: r("ChangeInfoFormProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "required", js: "required", typ: a("") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "ChangeInfoFormProperties": o([
      { json: "username", js: "username", typ: r("Username") },
  ], false),
  "Username": o([
      { json: "type", js: "type", typ: r("Type") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "ChangePasswordForm": o([
      { json: "properties", js: "properties", typ: r("ChangePasswordFormProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "required", js: "required", typ: a("") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "ChangePasswordFormProperties": o([
      { json: "pwdOld", js: "pwdOld", typ: r("Username") },
      { json: "pwdNew", js: "pwdNew", typ: r("Username") },
  ], false),
  "HTTPValidationError": o([
      { json: "properties", js: "properties", typ: r("HTTPValidationErrorProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "HTTPValidationErrorProperties": o([
      { json: "detail", js: "detail", typ: r("FluffyDetail") },
  ], false),
  "FluffyDetail": o([
      { json: "items", js: "items", typ: r("SchemaClass") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "SchemaClass": o([
      { json: "$ref", js: "ref", typ: "" },
  ], false),
  "InitParams": o([
      { json: "properties", js: "properties", typ: r("InitParamsProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "InitParamsProperties": o([
      { json: "session", js: "session", typ: r("Name") },
      { json: "name", js: "name", typ: r("Name") },
      { json: "time", js: "time", typ: r("Time") },
  ], false),
  "Name": o([
      { json: "anyOf", js: "anyOf", typ: a(r("NameAnyOf")) },
      { json: "title", js: "title", typ: "" },
  ], false),
  "NameAnyOf": o([
      { json: "type", js: "type", typ: "" },
  ], false),
  "Time": o([
      { json: "anyOf", js: "anyOf", typ: a(r("TimeAnyOf")) },
      { json: "title", js: "title", typ: "" },
  ], false),
  "TimeAnyOf": o([
      { json: "type", js: "type", typ: "" },
      { json: "format", js: "format", typ: u(undefined, "") },
  ], false),
  "LoginForm": o([
      { json: "properties", js: "properties", typ: r("LoginFormProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "required", js: "required", typ: a("") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "LoginFormProperties": o([
      { json: "username", js: "username", typ: r("Username") },
      { json: "password", js: "password", typ: r("Username") },
  ], false),
  "RegisterForm": o([
      { json: "properties", js: "properties", typ: r("RegisterFormProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "required", js: "required", typ: a("") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "RegisterFormProperties": o([
      { json: "email", js: "email", typ: r("Username") },
      { json: "username", js: "username", typ: r("Username") },
      { json: "password", js: "password", typ: r("Username") },
  ], false),
  "TokenResponseModel": o([
      { json: "properties", js: "properties", typ: r("TokenResponseModelProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "TokenResponseModelProperties": o([
      { json: "code", js: "code", typ: r("Code") },
      { json: "info", js: "info", typ: r("PropertiesInfo") },
      { json: "detail", js: "detail", typ: r("PurpleDetail") },
      { json: "tokens", js: "tokens", typ: r("Name") },
      { json: "access_token", js: "accessToken", typ: r("Name") },
  ], false),
  "ValidationError": o([
      { json: "properties", js: "properties", typ: r("ValidationErrorProperties") },
      { json: "type", js: "type", typ: "" },
      { json: "required", js: "required", typ: a("") },
      { json: "title", js: "title", typ: "" },
  ], false),
  "ValidationErrorProperties": o([
      { json: "loc", js: "loc", typ: r("LOC") },
      { json: "msg", js: "msg", typ: r("Username") },
      { json: "type", js: "type", typ: r("Username") },
  ], false),
  "LOC": o([
      { json: "items", js: "items", typ: r("LOCItems") },
      { json: "type", js: "type", typ: "" },
      { json: "title", js: "title", typ: "" },
  ], false),
  "LOCItems": o([
      { json: "anyOf", js: "anyOf", typ: a(r("NameAnyOf")) },
  ], false),
  "SecuritySchemes": o([
      { json: "OAuth2PasswordBearer", js: "oAuth2PasswordBearer", typ: r("OAuth2PasswordBearer") },
  ], false),
  "OAuth2PasswordBearer": o([
      { json: "type", js: "type", typ: "" },
      { json: "flows", js: "flows", typ: r("Flows") },
  ], false),
  "Flows": o([
      { json: "password", js: "password", typ: r("Password") },
  ], false),
  "Password": o([
      { json: "scopes", js: "scopes", typ: r("Scopes") },
      { json: "tokenUrl", js: "tokenURL", typ: "" },
  ], false),
  "BackendInfo": o([
      { json: "title", js: "title", typ: "" },
      { json: "version", js: "version", typ: "" },
  ], false),
  "Paths": o([
      { json: "/api", js: "api", typ: r("API") },
      { json: "/api/user/login", js: "apiUserLogin", typ: r("APIMeetInitClass") },
      { json: "/api/user/register", js: "apiUserRegister", typ: r("APIMeetInitClass") },
      { json: "/api/user/pw/change", js: "apiUserPwChange", typ: r("APIMeetInitClass") },
      { json: "/api/user/info/change", js: "apiUserInfoChange", typ: r("APIMeetInitClass") },
      { json: "/api/meet/init", js: "apiMeetInit", typ: r("APIMeetInitClass") },
      { json: "/api/meet/close", js: "apiMeetClose", typ: r("APIMeetClose") },
      { json: "/api/meet/ws_request", js: "apiMeetWsRequest", typ: r("APIMeetWsRequest") },
      { json: "/", js: "empty", typ: r("Empty") },
  ], false),
  "API": o([
      { json: "get", js: "get", typ: r("PostClass") },
  ], false),
  "PostClass": o([
      { json: "summary", js: "summary", typ: "" },
      { json: "operationId", js: "operationID", typ: "" },
      { json: "responses", js: "responses", typ: r("PostResponses") },
      { json: "security", js: "security", typ: u(undefined, a(r("Security"))) },
  ], false),
  "PostResponses": o([
      { json: "200", js: "the200", typ: r("The200_Value") },
  ], false),
  "The200_Value": o([
      { json: "description", js: "description", typ: r("Description") },
      { json: "content", js: "content", typ: r("ResponseContent") },
  ], false),
  "ResponseContent": o([
      { json: "application/json", js: "applicationJSON", typ: r("FluffyApplicationJSON") },
  ], false),
  "FluffyApplicationJSON": o([
      { json: "schema", js: "schema", typ: r("SchemaClass") },
  ], false),
  "Security": o([
      { json: "OAuth2PasswordBearer", js: "oAuth2PasswordBearer", typ: a("any") },
  ], false),
  "APIMeetClose": o([
      { json: "post", js: "post", typ: r("PostClass") },
  ], false),
  "APIMeetInitClass": o([
      { json: "post", js: "post", typ: r("Post") },
  ], false),
  "Post": o([
      { json: "summary", js: "summary", typ: "" },
      { json: "operationId", js: "operationID", typ: "" },
      { json: "requestBody", js: "requestBody", typ: u(undefined, r("RequestBody")) },
      { json: "responses", js: "responses", typ: m(r("The200_Value")) },
      { json: "security", js: "security", typ: u(undefined, a(r("Security"))) },
      { json: "parameters", js: "parameters", typ: u(undefined, a(r("Parameter"))) },
  ], false),
  "Parameter": o([
      { json: "name", js: "name", typ: "" },
      { json: "in", js: "in", typ: "" },
      { json: "required", js: "required", typ: true },
      { json: "schema", js: "schema", typ: r("Schema") },
  ], false),
  "Schema": o([
      { json: "type", js: "type", typ: "" },
      { json: "default", js: "default", typ: true },
      { json: "title", js: "title", typ: "" },
  ], false),
  "RequestBody": o([
      { json: "content", js: "content", typ: r("ResponseContent") },
      { json: "required", js: "required", typ: true },
  ], false),
  "APIMeetWsRequest": o([
      { json: "get", js: "get", typ: r("Post") },
  ], false),
  "Empty": o([
      { json: "get", js: "get", typ: r("Get") },
  ], false),
  "Get": o([
      { json: "summary", js: "summary", typ: "" },
      { json: "operationId", js: "operationID", typ: "" },
      { json: "responses", js: "responses", typ: r("PurpleResponses") },
  ], false),
  "PurpleResponses": o([
      { json: "200", js: "the200", typ: r("Purple200") },
  ], false),
  "Purple200": o([
      { json: "description", js: "description", typ: r("Description") },
      { json: "content", js: "content", typ: r("PurpleContent") },
  ], false),
  "PurpleContent": o([
      { json: "application/json", js: "applicationJSON", typ: r("PurpleApplicationJSON") },
  ], false),
  "PurpleApplicationJSON": o([
      { json: "schema", js: "schema", typ: r("Scopes") },
  ], false),
  "Type": [
      "string",
  ],
  "Description": [
      "Successful Response",
      "Validation Error",
  ],
};
