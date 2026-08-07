HOST=$1
ADMIN=$2
PASSWORD=$3
/opt/keycloak/bin/kcadm.sh config credentials --server http://${HOST}/auth --realm master --user ${ADMIN} --password ${PASSWORD}
/opt/keycloak/bin/kcadm.sh update realms/ROLAP --file /opt/keycloak/bin/../data/import/rolap-realm.json