# Keycloak

## Settings
Keycloak allows manual configuration through the admin panel available at {host}/auth. Log in to the admin panel using the administrator account.

## Export Settings
To export the settings (so they can be transferred to another environment, for example), you need to run the export_realm.sh script inside the keycloak container. A file named rolap-realm.json will be created in the /exports folder. Then, you need to copy it to the /imports folder.

## Import Settings
When setting up the keycloak container, the settings from the /imports/rolap-realm.json file will be automatically loaded.   
**!IMPORTANT!** _If keycloak has already been set up on a given host, settings have been imported, and the auth-db database was not cleaned before rebuilding, the import will be skipped (even if there were changes). If changes have been made and you want to avoid cleaning the database, you should follow the steps described in the Update Settings section._

## Update Settings
If the settings have been updated and the changes are reflected in the /imports/rolap-realm.json file, you need to run the update_realm.sh script inside the keycloak container, providing the host address where keycloak is running, the admin username, and the password, for example:   
/bin/bash update_realm.sh localhost:8080 admin CHANGE_ME   
**!IMPORTANT!** _Unfortunately, not all settings import correctly during an update (e.g., reCAPTCHA settings). Therefore, after performing the update, you should check in the admin panel to ensure all settings are correct._