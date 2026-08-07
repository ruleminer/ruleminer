# Fixtures

This directory should contains all static data inserted to the database after system
build.

Fixtures are stored in json files and loaded using the following command:
```bash
python manage.py loaddata fixture_name
```

Unfortunately all fixtures must be loaded one by one by their names. There is no command
for loading all fixtures in one command. 

### Utility scripts.

There is a directory script storing utility scripts for preparing fixtures. 