FROM atmoz/sftp:latest

WORKDIR /app

ARG USERNAME="rolap"
ARG PASSWORD="CHANGE_ME"

COPY users.conf /etc/sftp/users.conf

COPY build_config.sh /app

RUN sh ./build_config.sh $USERNAME $PASSWORD
