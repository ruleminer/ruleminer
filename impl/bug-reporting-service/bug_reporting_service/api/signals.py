import logging
from email.mime.image import MIMEImage

from bug_reporting_service.api.models import BugReport
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.dispatch import Signal

bug_report_submitted: Signal = Signal()


@receiver(bug_report_submitted)
def send_email_message(sender, bug_report: BugReport, **kwargs):
    """Send an email message when a bug report is submitted

    Args:
        sender (Type[BugReport]): the model class that sends the signal
        bug_report (BugReport): the newly submitted bug report.
    """
    from_email: str = settings.EMAIL_HOST_USER
    to_email: list[str] = settings.EMAILS_RECEIVERS

    email_content = f'''
    <html><body>
    <p>User <strong>"{bug_report.author.username}"</strong> submitted a bug report.</p>
    <p>Description provided by user:</p>
    <p style="margin-left: 20px; font-style: italic;">{bug_report.description}</p>
    '''

    msg = EmailMultiAlternatives(
        subject="New bug has been reported.",
        body='',
        from_email=from_email,
        to=to_email
    )

    if bug_report.screenshot.name is not None:
        email_content += '''
        <p>Screenshot provided by user:</p>
        <img style="margin-top: 20px;" src="cid:screenshot"/>
        '''
        image = 'screenshot.png'
        file_path = bug_report.screenshot.path
        with open(file_path, 'rb') as f:
            img = MIMEImage(f.read())
            img.add_header('Content-ID', '<screenshot>')
            img.add_header('Content-Disposition', 'inline', filename=image)
        msg.attach(img)

    if bug_report.allow_contact:
        email_content += f'''\n
        <p>User allows further contact via email address:</p>
        <a style="margin-left: 20px;" href= "mailto: {bug_report.author.email}">{bug_report.author.email}</a>
        '''

    email_content += '</body></html>'
    msg.mixed_subtype = 'related'
    msg.attach_alternative(email_content, "text/html")
    try:
        msg.send(fail_silently=False)
    except Exception as e:
        logger = logging.getLogger("bug_reporting_service")
        logger.exception(e)
