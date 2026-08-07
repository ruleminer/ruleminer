import io

import paramiko
import settings
from exceptions import ReportSaveError


def put_report_file(file: io.BytesIO, report_directory: str):
    """
    Save report file to SFTP server
    :param file: file object containing the report
    :param report_directory: directory on the SFTP server
    :return:
    """
    with paramiko.SSHClient() as ssh:
        try:
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(
                settings.REPORTS_SFTP_HOST,
                port=settings.REPORTS_SFTP_PORT,
                username=settings.REPORTS_SFTP_USERNAME,
                password=settings.REPORTS_SFTP_PASSWORD,
            )
            with ssh.open_sftp() as sftp:
                sftp.putfo(file, report_directory)
        except Exception as e:
            raise ReportSaveError(e)
