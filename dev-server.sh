mkdir runtime
cd runtime
uvicorn main:app --port 8000 --reload --app-dir ../ms-server --reload-dir ../ms-server