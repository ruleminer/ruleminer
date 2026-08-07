# Use the Python base image
FROM python:3.13

COPY --from=eclipse-temurin:8-jre-jammy /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Create and set the working directory
WORKDIR /app

RUN pip3 install --upgrade pip
RUN pip3 install setuptools
COPY ./rule-service/rule_generation_service/requirements.txt /app
RUN pip3 install -r requirements.txt --no-cache-dir

# Copy your Celery worker code into the container
COPY ./rule-service/rule_generation_service /app

COPY ./storage/rolap_data_storage /packages/rolap_data_storage 
RUN pip3 install /packages/rolap_data_storage

COPY ./libraries/http_client /packages/http_client
RUN pip3 install /packages/http_client

RUN git clone https://github.com/ruleminer/decision-rules.git --branch ruleminer
RUN pip3 install ./decision-rules

RUN git clone https://github.com/ruleminer/deeprules.git --branch ruleminer
RUN pip3 install ./deeprules
