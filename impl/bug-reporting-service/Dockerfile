FROM python:3.13-slim
WORKDIR /app 
# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential

RUN pip3 install --upgrade pip
RUN pip3 install "setuptools<82"
COPY ./bug-reporting-service/requirements.txt /app
RUN pip3 install -r requirements.txt --no-cache-dir

COPY ./libraries/keycloak-auth /packages/keycloak-auth
RUN pip3 install /packages/keycloak-auth
