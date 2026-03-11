import os
import httpx
from typing import Optional

WHATSAPP_API_URL = "https://graph.facebook.com/v19.0"
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")


class WhatsAppClient:
    def __init__(self):
        self.phone_number_id = PHONE_NUMBER_ID
        self.access_token = ACCESS_TOKEN
        self.base_url = f"{WHATSAPP_API_URL}/{self.phone_number_id}"

    def is_configured(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    async def send_text_message(self, to: str, message: str) -> dict:
        """Send a text message via WhatsApp Cloud API."""
        if not self.is_configured():
            # Simulation mode for demo/development
            return {
                "success": True,
                "message_id": f"sim_{to}_{hash(message) % 100000}",
                "mode": "simulation",
                "note": "WhatsApp not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN."
            }

        url = f"{self.base_url}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            message_id = data.get("messages", [{}])[0].get("id")
            return {"success": True, "message_id": message_id}

    async def send_template_message(self, to: str, template_name: str, language: str = "es", components: list = None) -> dict:
        """Send a template message via WhatsApp Cloud API."""
        if not self.is_configured():
            return {"success": True, "message_id": f"sim_tpl_{to}", "mode": "simulation"}

        url = f"{self.base_url}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language},
                "components": components or [],
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            message_id = data.get("messages", [{}])[0].get("id")
            return {"success": True, "message_id": message_id}


whatsapp_client = WhatsAppClient()


def get_auto_reply(message_text: str) -> str:
    """Simple pattern matching for auto-reply (simulates IA)."""
    text = message_text.lower()
    if any(w in text for w in ['subsidio', 'pago', 'cuando pagan', 'cuota familiar']):
        return "Hola 👋 Tu subsidio familiar está programado para el día 15 de cada mes. ¿Deseas consultar el estado de tu pago?"
    elif any(w in text for w in ['certificado', 'afiliacion', 'afiliación', 'constancia']):
        return "Puedo generarte el certificado de afiliación al instante. Confírmame tu número de cédula."
    elif any(w in text for w in ['pqrs', 'queja', 'reclamo', 'denuncia', 'peticion']):
        return "Entiendo tu solicitud. Voy a registrar tu PQRS. ¿Cuál es el motivo de tu contacto?"
    elif any(w in text for w in ['recreacion', 'recreación', 'turismo', 'vacacion', 'viaje']):
        return "COMFAGUAJIRA tiene planes de recreación y turismo para ti y tu familia. 🌴 ¿Te envío el catálogo?"
    elif any(w in text for w in ['actualizar', 'cambiar datos', 'datos', 'informacion personal']):
        return "Para actualizar tus datos personales puedes acercarte a cualquier sede o usar nuestro portal en línea."
    elif any(w in text for w in ['asesor', 'persona', 'humano', 'hablar con']):
        return "Te conecto con un asesor en este momento. Por favor espera. ⏳"
    elif any(w in text for w in ['hola', 'buenos', 'buenas', 'buen dia', 'saludos']):
        return ("¡Hola! 👋 Soy el asistente virtual de COMFAGUAJIRA. ¿En qué puedo ayudarte hoy?\n\n"
                "Puedo ayudarte con:\n• 💰 Subsidio familiar\n• 📄 Certificados\n• 📋 PQRS\n• 🏖 Recreación\n• 👤 Datos")
    else:
        return "Recibí tu mensaje. Un asesor de COMFAGUAJIRA te atenderá en breve. Nuestro horario es lunes a viernes 8am-6pm. ✅"
