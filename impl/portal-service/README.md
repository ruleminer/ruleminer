# ROLAP Portal Service

The supported open-source setup runs the portal service as part of the local
Docker Compose stack described in the repository root `README.md`.

## Tests

Run tests inside the local container:

```sh
docker compose --profile local --env-file .env.local exec rest-api sh scripts/test.sh
```

To run a selected test:

```sh
docker compose --profile local --env-file .env.local exec rest-api \
  python manage.py test --testrunner="rolap.test_runner.APITestRunner" \
  rolap.api.tests.rulesets.overwrite_ruleset
```

## Migrations

Create a migration:

```sh
docker compose --profile local --env-file .env.local exec rest-api \
  python manage.py makemigrations --settings=rolap.settings.container <app_name>
```

Apply migrations:

```sh
docker compose --profile local --env-file .env.local exec rest-api \
  python manage.py migrate --settings=rolap.settings.container
```
