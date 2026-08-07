# Report Generator

Service for generating reports from datasets stored by users.

### Testing
There is a unit test for EDA report generation. To run it, execute the following command:
```bash
docker exec -it report-generator python -m unittest tests
```
The other types of reports are generated using `emag-reports` library,
which has its separate tests.
