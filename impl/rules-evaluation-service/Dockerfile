FROM python:3.13-slim
EXPOSE 9000
WORKDIR /app 
# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential git

RUN pip3 install --upgrade pip
RUN pip3 install setuptools
COPY ./rules-evaluation-service/requirements.txt /app
RUN pip3 install -r requirements.txt --no-cache-dir
COPY ./rules-evaluation-service /app 

COPY ./storage/rolap_data_storage /packages/rolap_data_storage 
RUN pip3 install /packages/rolap_data_storage 

# temporary freeze decision-rules version to specific commit until ROLAP-2089 merge
RUN git clone https://github.com/ruleminer/decision-rules.git --branch ruleminer
RUN pip3 install ./decision-rules
