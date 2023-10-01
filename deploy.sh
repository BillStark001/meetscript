#!/bin/bash

echo "Constructing Frontend..."
cd ms-frontend
npm install
npm run build

echo "Copying Files..."
cd ..
mkdir ms-server/wwwroot
cp -r ms-frontend/dist/* ms-server/wwwroot/

echo "Launching Server..."
mkdir runtime
cd runtime
uvicorn main:app --port 8000 --app-dir ../ms-server
