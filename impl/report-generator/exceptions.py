class BaseReportException(Exception):
    def __init__(self, code: str, cause: Exception = None):
        self.code = code
        self.cause = cause
        super().__init__(code)


class ReportGenerationError(BaseReportException):
    def __init__(self, cause: Exception = None):
        super().__init__("report_generation_error", cause)


class ReportSaveError(BaseReportException):
    def __init__(self, cause: Exception = None):
        super().__init__("report_save_error", cause)


class DatasetReadError(BaseReportException):
    def __init__(self, cause: Exception = None):
        super().__init__("dataset_read_error", cause)


class ReportNotImplementedError(BaseReportException):
    def __init__(self, cause: Exception = None):
        super().__init__("report_not_implemented_error", cause)
