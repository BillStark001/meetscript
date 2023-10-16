#!/bin/bash

site_name="ms"
server_name="_"

if [ -n "$1" ]; then
    site_name="$1"
fi

if [ -n "$2" ]; then
    server_name="$2"
fi


# 1. detect nginx
nginx_installed=false
if nginx -v > /dev/null 2>&1; then
    nginx_installed=true
fi

if [ "$nginx_installed" = false ]; then
    echo "Nginx is not installed. Aborting."
    exit 1
fi

# 2. build frontend
ms_frontend_path="./ms-frontend"
if [ -d "$ms_frontend_path" ]; then
    (cd "$ms_frontend_path" && npm run build)
else
    echo "ms-frontend directory not found. Aborting."
    exit 1
fi

# 3. generate nginx site config
ms_static_path=$(readlink -f "$ms_frontend_path/dist")
ms_index_path="$ms_static_path/index.html"
nginx_config="server {
    listen 80;
    root $ms_static_path;
    server_name $server_name;

    location /ms {
        alias $ms_index_path;
        default_type text/html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }

    location / {
        try_files \$uri \$uri/ =404;
    }
}
"

# 4. refresh nginx settings
nginx_config_file_path="/etc/nginx/sites-available/$site_name"
echo "$nginx_config" | sudo tee "$nginx_config_file_path"

sites_enabled_link="/etc/nginx/sites-enabled/$site_name"
if [ -e "$sites_enabled_link" ]; then
    sudo rm "$sites_enabled_link"
fi

sudo ln -s "$nginx_config_file_path" "$sites_enabled_link"

nginx_service_command="sudo systemctl restart nginx"
if $nginx_service_command; then
    echo "Nginx service restarted successfully."
else
    echo "Failed to restart Nginx service."
fi

# 5. launch server
export MOUNT_STATIC=false

echo "Launching Server..."
mkdir runtime
cd runtime
uvicorn main:app --port 8000 --app-dir ../ms-server

unset MOUNT_STATIC