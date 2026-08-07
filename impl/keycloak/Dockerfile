FROM quay.io/keycloak/keycloak:23.0 as builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

WORKDIR /opt/keycloak
RUN /opt/keycloak/bin/kc.sh build --http-relative-path /auth

FROM quay.io/keycloak/keycloak:23.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/

COPY ./keycloak/imports /opt/keycloak/bin/../data/import
COPY ./keycloak/theme/ /opt/keycloak/themes/
