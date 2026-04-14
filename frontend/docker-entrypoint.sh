#!/bin/sh
# Replace PORT in nginx config
sed -i "s/listen 80/listen ${PORT:-80}/" /etc/nginx/conf.d/default.conf
echo "Starting nginx on port ${PORT:-80}"
exec nginx -g "daemon off;"
