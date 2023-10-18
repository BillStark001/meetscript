#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <certificate name>"
    exit 1
fi

target_dir="."
cert_name="$1"
if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
fi


openssl genpkey -algorithm RSA -out "$target_dir/$cert_name.pass.key" -aes256 -pass pass:temp_password
openssl rsa -in "$target_dir/$cert_name.pass.key" -out "$target_dir/$cert_name.key" -passin pass:temp_password

openssl req -new -key "$target_dir/$cert_name.key" -out "$target_dir/$cert_name.csr" -subj "/C=US/ST=State/L=City/O=Organization/OU=Organizational Unit/CN=example.com"

openssl x509 -req -in "$target_dir/$cert_name.csr" -signkey "$target_dir/$cert_name.key" -out "$target_dir/$cert_name.crt"

echo "Generated: $target_dir/$cert_name.{key,csr,crt}"
