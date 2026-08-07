# QueryTokenizer

`QueryTokenizer` is a Python class that helps you build query strings for HTTP requests. 
It provides a simple interface for adding query parameters and generating the final query string.

## Installation

First, you need to import the `QueryTokenizer` class from the `query_tokenizer` module:

```python
from query_tokenizer import QueryTokenizer

# Create a QueryTokenizer object
query_tokenizer = QueryTokenizer()

# Add query parameters
query_tokenizer.add_query_param('test', 'test')
query_tokenizer.add_query_param('test2', 'test2')

# Get the query string
print(query_tokenizer.get_query_string())
