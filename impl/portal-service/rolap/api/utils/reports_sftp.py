import io
import logging

import paramiko
from django.conf import settings
from rolap.api.exceptions import ReportDownloadError


def download_report_file(report_directory: str) -> bytes:
    """
    Get report from the SFTP server
    :param report_directory: directory on the SFTP server
    :return: report file (bytes)
    """
    file = io.BytesIO()

    with paramiko.SSHClient() as ssh:
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            ssh.connect(
                settings.REPORTS_SFTP_HOST,
                port=settings.REPORTS_SFTP_PORT,
                username=settings.REPORTS_SFTP_USERNAME,
                password=settings.REPORTS_SFTP_PASSWORD,
            )
            with ssh.open_sftp() as sftp:
                sftp.getfo(report_directory, file)
        except Exception as e:
            logging.exception(e, stack_info=True)
            raise ReportDownloadError()

    return file.getvalue()
