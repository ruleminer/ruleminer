# Bug Reporting Service

Service allowing user to report bugs and their feedback.

## Running tests

```
python manage.py test bug_reporting_service.api.tests
```

## Creating new migration files

Whenever changes are made to an application model, a new migrations should be
created using commands below, and then committed to VCS. Remember to name your migrations
using your initials and a very brief comment describing the implemented change.

```bash
python ./manage.py makemigrations --name <migration_name>
```
e.g.
```bash
python ./manage.py makemigrations --name CM_model_new_field_added
```
The first part `CM` is the initials of the author and the third is the name of the changes `model_new_field_added`.

## Applying database migrations

The command below should be used to apply migrations to the database.
This should be done whenever changes from remote repository are pulled.
Arguments `app_name` and `migration_name` are optional. The latter argument can be used
to revert migrations or, put differently, to only apply migrations up to the one given as argument.
The ordinal number of a given migration can be used instead of its full name, as shown below.

```bash
python ./manage.py migrate [app_name] [migration_name]
```
e.g.
```bash
python ./manage.py migrate 0004
```

More detailed instructions about managing migrations can be found in our internal documentation.