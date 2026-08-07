#!/bin/sh

# parse the variables
HOST=$1
REST_API_HOST_PORT=$2
KEYCLOAK_HTTP_HOST_PORT=$3

# replace URLs in environment.ts file with appropriate values
sed -i "s|http://localhost:8000/api|http://${HOST}:${REST_API_HOST_PORT}/api|g" projects/rolap/src/environments/environment.ts
sed -i "s|http://localhost:8000/calculate|http://${HOST}:${REST_API_HOST_PORT}/calculate|g" projects/rolap/src/environments/environment.ts
sed -i "s|http://localhost:8000/manage|http://${HOST}:${REST_API_HOST_PORT}/manage|g" projects/rolap/src/environments/environment.ts
sed -i "s|http://localhost:8080/auth|http://${HOST}:${KEYCLOAK_HTTP_HOST_PORT}/auth|g" projects/rolap/src/environments/environment.ts
sed -i "s|http://localhost:8000/bugs|http://${HOST}:${REST_API_HOST_PORT}/bugs|g" projects/rolap/src/environments/environment.ts
