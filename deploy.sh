#!/bin/bash

site_name="ms"
server_name="_"
cert_path=""

while getopts "s:v:c:" opt; do
  case $opt in
    s) site_name="$OPTARG" ;;
    v) server_name="$OPTARG" ;;
    c) cert_path="$OPTARG" ;;
    \?) echo "Invalid Argument: -$OPTARG" >&2; exit 1 ;;
  esac
done

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

# handler certificate

listen_phrase="listen 80;
    root $ms_static_path;
    server_name $server_name;"

if [ -n "$cert_path" ]; then
    cert_path_full=$(readlink -f "$cert_path")
    listen_phrase="listen 80;
    server_name $server_name;

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    root $ms_static_path;
    server_name $server_name;

    ssl_certificate $cert_path_full.crt;
    ssl_certificate_key $cert_path_full.key;"
fi

nginx_config="server {
    $listen_phrase

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

nginx_service_command="sudo nginx -s reload"
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