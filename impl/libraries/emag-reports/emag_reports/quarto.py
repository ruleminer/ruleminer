import os
import shutil
import subprocess
import tempfile

import yaml


def render(
        input_file: str,
        output_file: str,
        execute_params: dict,
        output_format: str = "html",
        execute: bool = True,
):
    """
    Render a Quarto report from notebook

    Args:
        input_file (str): path to the input notebook file
        output_file (str): path to the output file
        execute_params (dict): parameters to pass to the notebook
        output_format (str): output format of the report - `html` or `pdf`
        execute (bool): whether to execute the notebook
    """
    params_file = tempfile.NamedTemporaryFile(mode='w',
                                              prefix="quarto-params",
                                              suffix=".yml",
                                              delete=False)
    yaml.dump(execute_params, params_file)
    params_file.close()

    args = [
        "render", input_file,
        "--output", output_file,
        "--to", output_format,
        "--execute" if execute else "--no-execute",
        "--execute-params", params_file.name,
        "--debug",
    ]

    # run process
    try:
        process = subprocess.Popen([find_quarto()] + args)
        process.wait()
    finally:
        if params_file is not None:
            os.remove(params_file.name)


def find_quarto() -> str:
    """
    Get the path to Quarto

    Returns:
        str: path to Quarto command line tools
    """
    path_env = os.getenv("QUARTO_PATH")
    if path_env is None:
        quarto = shutil.which("quarto")
    else:
        quarto = path_env
    if quarto is None:
        raise FileNotFoundError("Unable to find quarto command line tools.")
    return quarto
