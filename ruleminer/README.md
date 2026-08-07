# RULEMINER

RULEMINER can be run as a complete local stack with Docker Compose. 

## Requirements

- Docker with Docker Compose v2
- at least 8 GB of free RAM for Docker
- Python 3.10+ only if the optional data initialization script is used

## Configure the local environment

All commands below should be run from the `impl` directory.

1. Create your private local configuration:

   Linux/macOS:

   ```sh
   cp .env.template .env.local
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.template .env.local
   ```

2. Open `.env.local` and replace every value beginning with `CHANGE_ME`.
   Use different, strong passwords for the databases, Keycloak, RabbitMQ,
   SFTP and the application accounts.

3. Keep `.env.local` private. 

The optional Stripe and email variables may remain empty when those features
are not used locally.

## Start the application

Build and start all local services:

```sh
docker compose --profile local --env-file .env.local up --build -d
```

Run the database migrations and load the basic metadata:

```sh
docker compose --profile local --env-file .env.local exec rest-api python manage.py migrate --settings=rolap.settings.container
docker compose --profile local --env-file .env.local exec bug-reporting-service python manage.py migrate --settings=bug_reporting_service.settings
docker compose --profile local --env-file .env.local exec rest-api python manage.py loaddata indicators_meta --settings=rolap.settings.container
```

Populate the application with the basic algorithms and plans:

```sh
python -m pip install -r test-data/requirements.txt
python test-data/populate_basic.py .env.local
```

Open:

- application: `http://localhost:4200`
- Keycloak: `http://localhost:8080/auth/`
- RabbitMQ management: `http://localhost:15672`

To stop the stack:

```sh
docker compose --profile local --env-file .env.local down
```

## Local user

The local Keycloak realm creates the interactive user:

- username: `john`
- password: the value of `JOHN_PASSWORD` from `.env.local`

The realm also creates the technical accounts `operator` and
`celery_worker`. Their passwords are read from `OPERATOR_PASSWORD` and
`WORKER_KEYCLOAK_PASSWORD`; they are used by initialization scripts and
background workers.

Keycloak imports users only when its database is initialized for the first
time. If passwords in `.env.local` are changed after the first startup, update
them in Keycloak or recreate the local volumes:

```sh
docker compose --profile local --env-file .env.local down -v
```

The `-v` option permanently removes all local application data.

## Tests

Run backend tests in the running container:

```sh
docker compose --profile local --env-file .env.local exec rest-api sh scripts/test.sh
```

For Cypress tests, expose `JOHN_PASSWORD` in the shell before starting
Cypress. The test configuration supports the local environment only.

