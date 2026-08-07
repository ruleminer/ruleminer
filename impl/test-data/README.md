## Script for introduction of test data

### Use
The script has to be run from the `rolap/impl` directory.
It performs HTTP requests to portal-service in order to fill it
with test data. The necessary credentials are loaded from an env file, 
which we have to specify as an argument like so:
```
python test-data/populate.py <env_file>
```
