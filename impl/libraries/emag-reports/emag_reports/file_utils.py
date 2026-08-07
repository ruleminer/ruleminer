import os
import shutil
from contextlib import contextmanager


@contextmanager
def create_temp_execution_file(source_file: str, target_file: str) -> str:
    """
    Create a temporary file for execution and remove it when finished.

    Args:
        source_file (str): Path to the source file to be copied.
        target_file (str): Name of the execution file.

    Yields:
        str: The temporary file path.
    """
    temp_file = f"{target_file}_exec.ipynb"
    shutil.copy(source_file, temp_file)
    try:
        yield temp_file
    finally:
        os.remove(temp_file)
