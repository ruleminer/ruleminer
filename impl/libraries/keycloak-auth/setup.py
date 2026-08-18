# pylint: disable=missing-module-docstring
from setuptools import find_packages
from setuptools import setup

setup(
    name='keycloak_auth',
    description='''
    Package for integrating Keycloak based authentication in a Django projects.
    ''',
    version='1.1.1',
    author='Cezary Maszczyk',
    author_email='cezary.maszczyk@emag.lukasiewicz.gov.pl',
    packages=find_packages(),
    install_requires=[
        'cryptography==40.0.2',
        'Django~=5.1',
        'djangorestframework~=3.15',
        'oauthlib==3.2.2',
        'PyJWT==2.9.0',
        'python-jose==3.3.0',
        'python-keycloak==2.15.3',
    ],
)
