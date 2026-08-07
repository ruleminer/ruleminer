FROM python:3.11-slim
WORKDIR /app
# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y graphviz graphviz-dev
RUN apt-get install -y curl
RUN apt-get install -y gdebi-core
RUN apt-get install -y cmake

RUN curl -LO https://github.com/quarto-dev/quarto-cli/releases/download/v1.6.40/quarto-1.6.40-linux-amd64.deb
RUN dpkg -i quarto-1.6.40-linux-amd64.deb
RUN rm quarto-1.6.40-linux-amd64.deb

RUN pip3 install --upgrade pip
RUN pip3 install setuptools
COPY ./report-generator/requirements.txt /app
RUN pip3 install -r requirements.txt --no-cache-dir
COPY ./report-generator /app

COPY ./storage/rolap_data_storage /packages/rolap_data_storage
RUN pip3 install /packages/rolap_data_storage

COPY ./libraries/http_client /packages/http_client
RUN pip3 install /packages/http_client

COPY ./libraries/emag-reports /packages/emag-reports
RUN pip3 install /packages/emag-reports
