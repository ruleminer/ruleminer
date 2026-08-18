# Rule generation service

This part of the application is responsible for generating rulesets for datasets,
i.e. it performs training of ML rule-based models.

It is deployed as one of docker containers which make up the application

Alternatively, the service can be run separately, directly on local machine.
Instruction below.

### Testing

The service has a small set of unit tests which can be run to make sure
all the underlying code (including dependencies) is working as expected.
To run:
```
python -m unittest tests
```

### How to run "rule-generation-service" worker as a standalone service

1. Setup a RabbitMQ container:
```
    docker pull rabbitmq:3-management
    docker run -d --hostname rmq --name rabbit-server -p 8081:15672 -p 5672:5672 rabbitmq:3-management
```
Broker can be access in the default setup by: ampq://guest:guest@localhost:5672
We can access the management panel by: http://localhost:8081
```
username = guest
password = guest
```


2. Install `rolap_data_storage` package
```
cd rolap/impl/storage/rolap_data_storage
pip install .
```

3. Start the worker
```
celery -A worker  worker -l info --pool=solo
```
