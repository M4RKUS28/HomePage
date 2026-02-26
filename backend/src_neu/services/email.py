"""
Async email service using aiosmtplib.

Drop-in replacement for the old synchronous smtplib-based email utility.
"""

import logging
from typing import Optional

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_email(
    subject: str,
    body: str,
    to_email: Optional[str] = None,
) -> bool:
    """
    Send a plain-text email asynchronously.

    Returns ``True`` on success, ``False`` on failure (never raises).
    """
    cfg = settings.email
    if not cfg.enabled:
        logger.info("Email disabled. Would have sent: '%s' to %s", subject, to_email or cfg.to_admin)
        return False

    recipient = to_email or cfg.to_admin
    if not recipient:
        logger.warning("No recipient configured for email '%s'", subject)
        return False

    msg = MIMEMultipart()
    msg["From"] = cfg.from_address or cfg.username
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        kwargs = {
            "hostname": cfg.host,
            "port": cfg.port,
            "username": cfg.username,
            "password": cfg.password,
        }
        if cfg.use_ssl:
            kwargs["use_tls"] = True  # implicit TLS
        elif cfg.use_tls:
            kwargs["start_tls"] = True  # STARTTLS

        await aiosmtplib.send(msg, **kwargs)
        logger.info("Email sent: '%s' → %s", subject, recipient)
        return True
    except Exception as exc:
        logger.error("Failed to send email '%s': %s", subject, exc)
        return False


async def notify_new_message(content: str, sender_username: str) -> bool:
    """Notify admin about a new contact message."""
    subject = f"New Message from {sender_username}"
    body = (
        f"A new message has been received on your portfolio site.\n\n"
        f"From: {sender_username}\n"
        f"Message:\n{content}\n\n"
        f"Please log in to your admin dashboard to respond."
    )
    return await send_email(subject, body)


async def notify_new_user(username: str, email: str) -> bool:
    """Notify admin about a new user registration."""
    subject = f"New User Registration: {username}"
    body = (
        f"A new user has registered on your portfolio site.\n\n"
        f"Username: {username}\n"
        f"Email: {email}\n\n"
        f"This user account has been created with default permissions."
    )
    return await send_email(subject, body)
