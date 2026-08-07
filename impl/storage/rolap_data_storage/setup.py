# pylint: disable=missing-module-docstring
from setuptools import find_packages
from setuptools import setup

setup(
    name='rolap_data_storage',
    description='''
    Package implementing data storage.
    ''',
    version='1.1.0',
    author='Adam Grzelak, Cezary Maszczyk',
    author_email='cezary.maszczyk@emag.lukasiewicz.gov.pl',
    packages=find_packages(),
    install_requires=[
        'pandas~=2.0',
        'psycopg~=3.2',
        'psycopg-binary~=3.2',
        'pyarrow~=19.0',
        'pydantic~=2.10',
        's3fs~=2025.2',
        'SQLAlchemy~=2.0',
    ],
)
