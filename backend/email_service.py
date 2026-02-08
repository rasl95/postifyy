"""
Email Drip Campaign Service for Postify AI
Handles pricing abandonment tracking and automated email sequences
"""

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr

# Try to import resend, handle if not available
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configuration
MOCK_MODE = os.environ.get('EMAIL_MOCK_MODE', 'true').lower() == 'true'
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'hello@postify.ai')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Initialize Resend if available and not in mock mode
if RESEND_AVAILABLE and RESEND_API_KEY and RESEND_API_KEY != 'mock_mode':
    resend.api_key = RESEND_API_KEY
    logger.info("Resend email service initialized")
else:
    logger.info("Email service running in MOCK mode")

# Drip Campaign Configuration
DRIP_CONFIG = {
    "trigger_after_hours": 72,  # Enter flow if no checkout within 72 hours
    "cooldown_days": 30,  # Only trigger once per 30 days
    "emails": [
        {"delay_hours": 2, "template": "reminder"},
        {"delay_hours": 24, "template": "social_proof"},
        {"delay_hours": 72, "template": "soft_urgency"}
    ]
}

# Pydantic Models
class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str
    template_name: Optional[str] = None

class PricingEvent(BaseModel):
    event_type: str  # pricing_viewed, plan_selected, checkout_started, checkout_completed
    plan: Optional[str] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class EmailQueueItem(BaseModel):
    user_email: str
    template: str
    scheduled_at: str
    status: str = "pending"  # pending, sent, failed, cancelled
    drip_sequence_id: Optional[str] = None

# Email Templates
def get_email_template(template_name: str, user_name: str, language: str = "en") -> Dict[str, str]:
    """Get email template content based on template name"""
    
    templates = {
        "reminder": {
            "en": {
                "subject": "You left something behind 👀",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Hey{' ' + user_name if user_name else ''}!</h2>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            We noticed you were checking out our Pro features. Here's what you're missing:
        </p>
        <table style="margin:25px 0;width:100%;">
            <tr><td style="padding:12px 0;border-bottom:1px solid #1F2937;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">200 AI generations per month</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #1F2937;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">Brand AI for consistent content</span>
            </td></tr>
            <tr><td style="padding:12px 0;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">Advanced analytics & exports</span>
            </td></tr>
        </table>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=reminder" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:20px;">
            Unlock Pro Features →
        </a>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Unsubscribe</a>
    </td></tr>
</table>
</body>
</html>
"""
            },
            "ru": {
                "subject": "Вы кое-что забыли 👀",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Привет{' ' + user_name if user_name else ''}!</h2>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            Мы заметили, что вы смотрели Pro функции. Вот что вы упускаете:
        </p>
        <table style="margin:25px 0;width:100%;">
            <tr><td style="padding:12px 0;border-bottom:1px solid #1F2937;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">200 AI генераций в месяц</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #1F2937;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">Brand AI для единого стиля</span>
            </td></tr>
            <tr><td style="padding:12px 0;">
                <span style="color:#FF3B30;">✓</span>
                <span style="color:#ffffff;margin-left:10px;">Аналитика и экспорт данных</span>
            </td></tr>
        </table>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=reminder" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:20px;">
            Разблокировать Pro →
        </a>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Отписаться</a>
    </td></tr>
</table>
</body>
</html>
"""
            }
        },
        "social_proof": {
            "en": {
                "subject": "See how creators save 10+ hours/week with Pro",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Join 10,000+ creators using Pro</h2>
        <div style="background:#1F2937;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="color:#ffffff;font-style:italic;margin:0 0 10px;">
                "Postify Pro cut my content creation time by 80%. I create a week's worth of posts in 30 minutes."
            </p>
            <p style="color:#9CA3AF;font-size:14px;margin:0;">— Sarah M., Social Media Manager</p>
        </div>
        <h3 style="color:#ffffff;font-size:18px;margin:25px 0 15px;">What Pro creators unlock:</h3>
        <table style="width:100%;">
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Brand AI</span> — Your brand voice, automated
            </td></tr>
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Marketing Sets</span> — All platforms, one click
            </td></tr>
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Analytics</span> — Track what converts
            </td></tr>
        </table>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=social_proof" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:25px;">
            Upgrade to Pro →
        </a>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Unsubscribe</a>
    </td></tr>
</table>
</body>
</html>
"""
            },
            "ru": {
                "subject": "Как создатели экономят 10+ часов в неделю с Pro",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Присоединяйтесь к 10,000+ Pro создателям</h2>
        <div style="background:#1F2937;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="color:#ffffff;font-style:italic;margin:0 0 10px;">
                "Postify Pro сократил время создания контента на 80%. Контент на неделю за 30 минут."
            </p>
            <p style="color:#9CA3AF;font-size:14px;margin:0;">— Анна М., SMM-менеджер</p>
        </div>
        <h3 style="color:#ffffff;font-size:18px;margin:25px 0 15px;">Что получают Pro пользователи:</h3>
        <table style="width:100%;">
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Brand AI</span> — Ваш голос бренда, автоматически
            </td></tr>
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Маркетинг-наборы</span> — Все платформы, один клик
            </td></tr>
            <tr><td style="padding:10px 0;color:#9CA3AF;">
                <span style="color:#FF3B30;font-weight:bold;">Аналитика</span> — Отслеживайте конверсии
            </td></tr>
        </table>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=social_proof" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:25px;">
            Перейти на Pro →
        </a>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Отписаться</a>
    </td></tr>
</table>
</body>
</html>
"""
            }
        },
        "soft_urgency": {
            "en": {
                "subject": "Your 50 bonus credits are waiting ✨",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Don't let Free limits hold you back</h2>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            With only 3 generations per month, you're barely scratching the surface of what AI can do for your content.
        </p>
        <div style="background:linear-gradient(135deg,#FF3B30 0%,#FF6B5B 100%);border-radius:12px;padding:25px;margin:25px 0;text-align:center;">
            <p style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 5px;">🎁 50 Bonus Credits</p>
            <p style="color:#ffffff;opacity:0.9;font-size:14px;margin:0;">Waiting for you when you upgrade</p>
        </div>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            That's 50 extra pieces of content — posts, video ideas, product descriptions. All powered by AI, all with your brand voice.
        </p>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=urgency&bonus=50" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:20px;">
            Claim Your Bonus →
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:20px;">
            No pressure. But your content is waiting.
        </p>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Unsubscribe</a>
    </td></tr>
</table>
</body>
</html>
"""
            },
            "ru": {
                "subject": "50 бонусных кредитов ждут вас ✨",
                "html": f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0A0A0B;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:40px 30px;text-align:center;">
        <h1 style="color:#FF3B30;font-size:28px;margin:0;">✨ Postify AI</h1>
    </td></tr>
    <tr><td style="padding:0 30px 30px;">
        <h2 style="color:#ffffff;font-size:24px;margin:0 0 20px;">Не позволяйте лимитам Free тормозить вас</h2>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            С 3 генерациями в месяц вы едва касаетесь возможностей AI для вашего контента.
        </p>
        <div style="background:linear-gradient(135deg,#FF3B30 0%,#FF6B5B 100%);border-radius:12px;padding:25px;margin:25px 0;text-align:center;">
            <p style="color:#ffffff;font-size:20px;font-weight:bold;margin:0 0 5px;">🎁 50 бонусных кредитов</p>
            <p style="color:#ffffff;opacity:0.9;font-size:14px;margin:0;">Ждут вас при переходе на Pro</p>
        </div>
        <p style="color:#9CA3AF;font-size:16px;line-height:1.6;">
            Это 50 единиц контента — посты, идеи для видео, описания товаров. Всё на AI, всё в вашем стиле.
        </p>
        <a href="{FRONTEND_URL}/pricing?utm_source=drip&utm_campaign=urgency&bonus=50" 
           style="display:inline-block;background:#FF3B30;color:#ffffff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:20px;">
            Получить бонус →
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:20px;">
            Без давления. Но ваш контент ждёт.
        </p>
    </td></tr>
    <tr><td style="padding:20px 30px;border-top:1px solid #1F2937;text-align:center;">
        <a href="{FRONTEND_URL}/unsubscribe" style="color:#6B7280;font-size:12px;text-decoration:underline;">Отписаться</a>
    </td></tr>
</table>
</body>
</html>
"""
            }
        }
    }
    
    lang = language if language in ["en", "ru"] else "en"
    template = templates.get(template_name, templates["reminder"])
    return template.get(lang, template["en"])


async def send_email(recipient_email: str, subject: str, html_content: str) -> Dict[str, Any]:
    """Send email via Resend or mock"""
    
    if MOCK_MODE or not RESEND_AVAILABLE or RESEND_API_KEY == 'mock_mode':
        # Mock mode - log email instead of sending
        logger.info(f"[MOCK EMAIL] To: {recipient_email}, Subject: {subject}")
        return {
            "status": "success",
            "mode": "mock",
            "message": f"Mock email logged for {recipient_email}",
            "email_id": f"mock_{datetime.now(timezone.utc).timestamp()}"
        }
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Email sent to {recipient_email}: {email_response.get('id')}")
        return {
            "status": "success",
            "mode": "live",
            "message": f"Email sent to {recipient_email}",
            "email_id": email_response.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return {
            "status": "error",
            "mode": "live",
            "message": str(e),
            "email_id": None
        }


async def process_drip_campaign(db, user_email: str, user_data: Dict[str, Any]) -> None:
    """Process drip campaign for a user who abandoned pricing"""
    
    user_name = user_data.get("full_name", "").split(" ")[0] if user_data.get("full_name") else ""
    language = user_data.get("preferred_language", "en")
    
    # Get drip sequence
    drip_sequence = await db.drip_sequences.find_one(
        {"user_email": user_email, "status": "active"},
        {"_id": 0}
    )
    
    if not drip_sequence:
        return
    
    current_step = drip_sequence.get("current_step", 0)
    if current_step >= len(DRIP_CONFIG["emails"]):
        # Campaign completed
        await db.drip_sequences.update_one(
            {"user_email": user_email, "status": "active"},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        return
    
    email_config = DRIP_CONFIG["emails"][current_step]
    scheduled_at = datetime.fromisoformat(drip_sequence.get("next_email_at"))
    
    if datetime.now(timezone.utc) >= scheduled_at:
        # Time to send email
        template = get_email_template(email_config["template"], user_name, language)
        
        result = await send_email(user_email, template["subject"], template["html"])
        
        # Log email
        await db.email_logs.insert_one({
            "user_email": user_email,
            "template": email_config["template"],
            "step": current_step + 1,
            "drip_sequence_id": drip_sequence.get("sequence_id"),
            "status": result["status"],
            "email_id": result.get("email_id"),
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "mode": result.get("mode", "unknown")
        })
        
        # Update sequence
        next_step = current_step + 1
        if next_step < len(DRIP_CONFIG["emails"]):
            next_email_at = datetime.now(timezone.utc) + timedelta(hours=DRIP_CONFIG["emails"][next_step]["delay_hours"])
            await db.drip_sequences.update_one(
                {"user_email": user_email, "status": "active"},
                {
                    "$set": {
                        "current_step": next_step,
                        "next_email_at": next_email_at.isoformat(),
                        "last_email_sent": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            await db.drip_sequences.update_one(
                {"user_email": user_email, "status": "active"},
                {
                    "$set": {
                        "status": "completed",
                        "current_step": next_step,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )


async def check_and_start_drip_campaign(db, user_email: str) -> Optional[str]:
    """Check if user qualifies for drip campaign and start if eligible"""
    
    # Get user
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user:
        return None
    
    # Don't trigger for Pro/Business users
    if user.get("subscription_plan") in ["pro", "business"]:
        return None
    
    # Check email preferences
    if user.get("email_unsubscribed"):
        return None
    
    # Check cooldown (30 days)
    last_drip = await db.drip_sequences.find_one(
        {"user_email": user_email},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if last_drip:
        last_drip_time = datetime.fromisoformat(last_drip.get("created_at", "2000-01-01T00:00:00+00:00"))
        if datetime.now(timezone.utc) - last_drip_time < timedelta(days=DRIP_CONFIG["cooldown_days"]):
            return None
    
    # Check pricing events
    pricing_event = await db.pricing_events.find_one(
        {"user_email": user_email, "event_type": "pricing_viewed"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not pricing_event:
        return None
    
    # Check if checkout was completed within 72 hours
    checkout_completed = await db.pricing_events.find_one({
        "user_email": user_email,
        "event_type": "checkout_completed",
        "timestamp": {"$gt": pricing_event.get("timestamp")}
    })
    
    if checkout_completed:
        return None
    
    # Check if 72 hours have passed since pricing_viewed
    pricing_time = datetime.fromisoformat(pricing_event.get("timestamp"))
    # For testing, we can reduce this. In production, use full 72 hours
    # if datetime.now(timezone.utc) - pricing_time < timedelta(hours=DRIP_CONFIG["trigger_after_hours"]):
    #     return None
    
    # Start drip campaign
    sequence_id = f"drip_{user_email}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    first_email_at = datetime.now(timezone.utc) + timedelta(hours=DRIP_CONFIG["emails"][0]["delay_hours"])
    
    await db.drip_sequences.insert_one({
        "sequence_id": sequence_id,
        "user_email": user_email,
        "status": "active",
        "current_step": 0,
        "next_email_at": first_email_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "trigger_event": "pricing_abandonment"
    })
    
    logger.info(f"Started drip campaign for {user_email}: {sequence_id}")
    return sequence_id


async def stop_drip_campaign(db, user_email: str, reason: str = "upgraded") -> bool:
    """Stop active drip campaign for a user"""
    
    result = await db.drip_sequences.update_many(
        {"user_email": user_email, "status": "active"},
        {
            "$set": {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "cancel_reason": reason
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Stopped drip campaign for {user_email}: {reason}")
        return True
    return False
