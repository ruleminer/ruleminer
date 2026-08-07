from endpoints.condition_attribute_importance import \
    router as calculate_importance_router
from endpoints.coverage_matrix import \
    router as calculate_coverage_matrix_router
from endpoints.histogram import router as histogram_router
from endpoints.local_explainability import router as local_explainability
from endpoints.prediction import router as calculate_prediction_router
from endpoints.prediction_indicators import \
    router as calculate_prediction_indicators_router
from endpoints.prediction_summary import \
    router as calculate_prediction_summary_router
from endpoints.quantitive_characteristic import \
    router as calculate_quantitive_characteristic_router
from endpoints.rule_coverage import router as calculate_rule_coverage_router
from endpoints.rule_indicators import \
    router as calculate_rules_indicators_router
from endpoints.rules_compare import router as calculate_rule_similarity_router
from endpoints.unique_examples import \
    router as calculate_unique_examples_router
from exceptions.exception_handlers import custom_http_exception_handler
from exceptions.exception_handlers import custom_request_validation_exception_handler
from exceptions.exception_handlers import other_exception_handler
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException

app = FastAPI()

app.include_router(calculate_importance_router)
app.include_router(calculate_prediction_indicators_router)
app.include_router(calculate_prediction_summary_router)
app.include_router(calculate_quantitive_characteristic_router)
app.include_router(calculate_rule_coverage_router)
app.include_router(calculate_rules_indicators_router)
app.include_router(calculate_prediction_router)
app.include_router(calculate_coverage_matrix_router)
app.include_router(local_explainability)
app.include_router(histogram_router)
app.include_router(calculate_rule_similarity_router)
app.include_router(calculate_unique_examples_router)

app.add_exception_handler(HTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError,
                          custom_request_validation_exception_handler)
app.add_exception_handler(Exception, other_exception_handler)
