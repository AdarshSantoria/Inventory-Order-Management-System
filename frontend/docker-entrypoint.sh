#!/bin/sh
set -eu

sed "s|__API_BASE_URL__|${API_BASE_URL}|g" /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js
