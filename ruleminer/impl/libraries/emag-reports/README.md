# EMAG reports
Generate predictive analysis (PA) and knowledge discovery (KD) reports for your data.


## Overview
There are two kinds of reports that can be generated:
- Predictive analysis (PA) report
- Knowledge discovery (KD) report

They can be generated for three different types of datasets (ML problem types):
- Classification
- Regression
- Survival analysis


## Requirements
`emag_reports` library requires Quarto ([installation](https://quarto.org/docs/get-started/)).


## Use
In order to generate a report, a report request has to be initialized
and passed to `generate_report` function.
Reports are highly customizable in terms of settings, preprocessing and model selection.

### Common settings
Both kinds of reports have the following settings:
- `title`: title of the report
- `dataset`: information about the dataset, such as name and target attribute
- `preprocessing`: operations to be applied on the dataset prior to the main part

### Predictive analysis (PA) report
- `settings`: common settings for predictive models, such as analysis mode (train-test or 5-fold cross-validation)
- `algorithms`: list of predictive models to be applied to the dataset

### Knowledge discovery (KD) report
- `algorithms`: list of whitebox models applied to the dataset

### Formatting
In order to ensure proper formatting, `_quarto.yaml` file has to be present in the directory
where report generation is executed. A sample `_quarto.yaml` file is provided below:

```yaml
project:
  type: default

execute:
  echo: false
  freeze: false

format:
  html:
    html-table-processing: none
    embed-resources: true
    anchor-sections: false
```
These are the recommended settings, but of course they can be adjusted to fit the user's needs.


## Testing
The library is equipped with integration tests for ensuring that all kinds of reports are generated correctly.
To run the tests:

```bash
python -m unittest tests
```
