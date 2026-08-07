from setuptools import find_packages
from setuptools import setup

setup(
    name='http_client',
    version='0.1.0',
    description='A simple HTTP client',
    packages=find_packages(),
    install_requires=[
        'pydantic>=2.9',
        'requests>=2.32',
    ],
)
