# backend/src/utils/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from ..config.settings import (
    EMAIL_ENABLED, EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, 
    EMAIL_PASSWORD, EMAIL_FROM, EMAIL_TO_ADMIN, 
    EMAIL_USE_TLS, EMAIL_USE_SSL
)

logger = logging.getLogger(__name__)


def send_email(subject, body, to_email=None):
    """
    Send an email with the given subject and body.
    If to_email is not provided, uses the default admin email from settings.
    """
    if not EMAIL_ENABLED:
        logger.info(f"Email is disabled. Would have sent: '{subject}' to {to_email or EMAIL_TO_ADMIN}")
        return False
    
    recipient = to_email or EMAIL_TO_ADMIN
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Add body
        msg.attach(MIMEText(body, 'plain'))
        
        # Setup server based on port and protocol
        if EMAIL_USE_SSL:
            logger.info(f"Connecting to {EMAIL_HOST}:{EMAIL_PORT} using SSL")
            server = smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT)
        else:
            logger.info(f"Connecting to {EMAIL_HOST}:{EMAIL_PORT}")
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            
            if EMAIL_USE_TLS:
                logger.info("Starting TLS")
                server.starttls()
        
        # Login and send
        logger.info(f"Logging in as {EMAIL_USERNAME}")
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        logger.info(f"Sending email to {recipient}")
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully: '{subject}' to {recipient}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        # Add more detailed logging to help diagnose the issue
        logger.error(f"Email settings: HOST={EMAIL_HOST}, PORT={EMAIL_PORT}, "
                    f"USE_TLS={EMAIL_USE_TLS}, USE_SSL={EMAIL_USE_SSL}")
        return False

def notify_new_message(message_content, sender_username):
    """Send notification about new message"""
    subject = f"New Message from {sender_username}"
    body = f"""A new message has been received on your portfolio site.

From: {sender_username}
Message:
{message_content}

Please log in to your admin dashboard to respond.
"""
    return send_email(subject, body)

def notify_new_user(username, email):
    """Send notification about new user registration"""
    subject = f"New User Registration: {username}"
    body = f"""A new user has registered on your portfolio site.

Username: {username}
Email: {email}

This user account has been created with default permissions.
"""
    return send_email(subject, body)