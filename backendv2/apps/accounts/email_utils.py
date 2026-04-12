"""
Email utilities for the accounts app.

Modular email sending functions, decoupled from views.
"""
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailVerificationToken

TOKEN_EXPIRY_HOURS = 24


def generate_verification_token(user) -> EmailVerificationToken:
    """Create a new (unused) EmailVerificationToken for the given user."""
    token_str = secrets.token_urlsafe(48)
    expires_at = timezone.now() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    return EmailVerificationToken.objects.create(
        user=user,
        token=token_str,
        expires_at=expires_at,
    )


def send_verification_email(user) -> EmailVerificationToken:
    """
    Generate a verification token and send the email.
    Returns the created EmailVerificationToken.
    Raises on send failure (let the caller decide whether to swallow it).
    """
    token = generate_verification_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-email?token={token.token}"

    context = {
        'verify_url': verify_url,
        'nombre': user.nombre,
        'expires_hours': TOKEN_EXPIRY_HOURS,
    }

    html_body = render_to_string('accounts/verify_email.html', context)
    plain_body = (
        f"Hola {user.nombre},\n\n"
        f"Verifica tu email haciendo clic en el siguiente enlace:\n{verify_url}\n\n"
        f"Este enlace expira en {TOKEN_EXPIRY_HOURS} horas.\n\n"
        "Si no creaste esta cuenta, puedes ignorar este mensaje."
    )

    send_mail(
        subject="Verifica tu email — Zelora",
        message=plain_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_body,
        fail_silently=False,
    )

    return token
