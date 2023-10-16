export MOUNT_STATIC=false

echo "Launching Server..."
mkdir runtime
cd runtime
uvicorn main:app --port 8000 --app-dir ../ms-server

unset MOUNT_STATIC