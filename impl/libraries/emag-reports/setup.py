from setuptools import find_packages
from setuptools import setup

setup(
    name='emag_reports',
    version='1.0.0',
    description="""
    Internal EMAG library for generating predictive analysis (PA) and knowledge discovery (KD) reports.
    """,
    author="Adam Grzelak, Łukasz Macha, Konrad Chwełatiuk, Cezary Maszczyk, Łukasz Wróbel",
    author_email="a.grzelak@emag.lukasiewicz.gov.pl",
    packages=find_packages(),
    package_data={
        "": [
            "discovery_notebooks/*.ipynb",
            "prediction_notebooks/*.ipynb",
        ]
    },
    install_requires=[
        'ecs-logging==2.2.0',
        'imbalanced-learn==0.12.3',
        'imodels==1.4.6',
        'itables==2.2.2',
        'jupyter==1.1.1',
        'matplotlib==3.9.2',
        'mlxtend==0.23.1',
        'networkx==3.2.1',
        'numpy==1.26.4',
        'Orange3==3.38.1',
        'pandas==2.0.3',
        'papermill==2.6.0',
        'pydantic==2.10.6',
        'pygraphviz==1.11',
        'scikit-learn==1.5.2',
        'osqp >=0.6.3,<1.0.0',
        'scikit-survival==0.23.0',
        'shap==0.46.0',
        'wittgenstein==0.3.4',
        'xgboost==2.0.3',
    ],
)
