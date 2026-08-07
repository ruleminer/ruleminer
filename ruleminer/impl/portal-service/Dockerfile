FROM python:3.13-slim
EXPOSE 8000
WORKDIR /app 
# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential git

RUN pip3 install --upgrade pip
RUN pip3 install "setuptools<82"
COPY ./portal-service/requirements.txt /app
RUN pip3 install -r requirements.txt --no-cache-dir
COPY ./portal-service /app

COPY ./libraries/keycloak-auth /packages/keycloak-auth
RUN pip3 install /packages/keycloak-auth

COPY ./storage/rolap_data_storage /packages/rolap_data_storage
RUN pip3 install /packages/rolap_data_storage

COPY ./libraries/http_client /packages/http_client
RUN pip3 install /packages/http_client

COPY ./VERSION.txt /VERSION.txt

# temporary freeze decision-rules version to specific commit until ROLAP-2089 merge
RUN git clone https://github.com/ruleminer/decision-rules.git --branch ruleminer
RUN pip3 install ./decision-rules

COPY ./libraries/emag-reports/emag_reports/models /app/emag_report_models
