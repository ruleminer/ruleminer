#!/bin/sh

# parse the variables
USERNAME=$1
PASSWORD=$2

# replace values in users.conf config file
sed -i "s|rolap_user|${USERNAME}|g" /etc/sftp/users.conf
sed -i "s|rolap_password|${PASSWORD}|g" /etc/sftp/users.conf
