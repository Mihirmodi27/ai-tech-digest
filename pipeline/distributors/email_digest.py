"""
Email Distributor
Sends the daily digest as a formatted email via Resend.
"""
import resend
from datetime import datetime, timezone

from config import RESEND_API_KEY, EMAIL_FROM
from db import supabase
from runs import track_run

resend.api_key = RESEND_API_KEY


def get_todays_digest() -> dict | None:
    """Fetch the latest published digest with items."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    result = supabase.table('digests').select('*').eq(
        'digest_date', today
    ).eq('status', 'published').limit(1).execute()

    if not result.data:
        return None

    digest = result.data[0]
    items_result = supabase.table('digest_items').select(
        '*, categories(name), sources(name)'
    ).eq('digest_id', digest['id']).order('rank').execute()

    digest['items'] = items_result.data
    return digest


def build_email_html(digest: dict) -> str:
    """Generate the HTML email body."""
    date_str = datetime.strptime(digest['digest_date'], '%Y-%m-%d').strftime('%B %d, %Y')
    items = digest['items']

    # Top 5 section
    top5_html = ""
    for i, item in enumerate(items[:5], 1):
        cat = item.get('categories', {}).get('name', '')
        top5_html += f"""
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #222225;">
            <span style="color:#3B82F6;font-weight:700;font-size:16px;margin-right:8px;">{i}</span>
            <span style="color:#a1a1aa;font-size:10px;text-transform:uppercase;">{cat}</span><br/>
            <a href="{item.get('url','#')}" style="color:#e4e4e7;font-weight:600;font-size:15px;text-decoration:none;">{item['headline']}</a><br/>
            <span style="color:#a1a1aa;font-size:13px;">{item['what'][:200]}</span><br/>
            <span style="color:#e4e4e7;font-size:13px;opacity:0.85;">→ {item['why'][:200]}</span>
          </td>
        </tr>"""

    # Remaining items
    rest_html = ""
    for item in items[5:]:
        cat = item.get('categories', {}).get('name', '')
        src = item.get('sources', {}).get('name', '')
        rest_html += f"""
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #222225;">
            <span style="color:#3B82F6;font-size:10px;text-transform:uppercase;">{cat}</span>
            <span style="color:#71717a;font-size:11px;margin-left:8px;">{src}</span><br/>
            <a href="{item.get('url','#')}" style="color:#e4e4e7;font-size:14px;text-decoration:none;">{item['headline']}</a><br/>
            <span style="color:#e4e4e7;font-size:12px;opacity:0.85;">→ {item['why'][:150]}</span>
          </td>
        </tr>"""

    return f"""
    <div style="max-width:640px;margin:0 auto;background:#0a0a0b;color:#e4e4e7;font-family:'Inter',-apple-system,sans-serif;padding:24px;">
      <div style="border-bottom:1px solid #222225;padding-bottom:16px;margin-bottom:20px;">
        <h1 style="font-size:18px;font-weight:600;margin:0;">AI & Tech Digest</h1>
        <p style="color:#71717a;font-size:12px;margin:4px 0 0;">{date_str} · {digest.get('items_included', len(items))} stories · {digest.get('sources_scanned', 0)} sources</p>
      </div>

      <h2 style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Top Stories</h2>
      <table width="100%" cellpadding="0" cellspacing="0">{top5_html}</table>

      <h2 style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;margin:24px 0 8px;">More Headlines</h2>
      <table width="100%" cellpadding="0" cellspacing="0">{rest_html}</table>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #222225;color:#71717a;font-size:11px;">
        Sources scanned: {digest.get('sources_scanned', 0)} · Items evaluated: {digest.get('items_evaluated', 0)}<br/>
        Generated at {digest.get('generated_at', 'N/A')}
      </div>
    </div>
    """


def get_subscribers(frequency: str = 'daily') -> list[str]:
    """Fetch active subscriber emails."""
    result = supabase.table('subscribers').select('email').eq(
        'active', True
    ).eq('frequency', frequency).execute()
    return [s['email'] for s in result.data]


def send_digest_email(dry_run: bool = False):
    """Main entry point: fetch today's digest and email it to subscribers."""
    with track_run('distribute', dry_run=dry_run) as run:
        prefix = '[email][dry-run] ' if dry_run else '[email] '

        digest = get_todays_digest()
        if not digest:
            run['status'] = 'skipped'
            run['input_count'] = 0
            run['output_count'] = 0
            print(f"{prefix}No published digest for today. Skipping.")
            return

        subscribers = get_subscribers('daily')
        run['input_count'] = len(subscribers)
        if not subscribers:
            run['status'] = 'skipped'
            run['output_count'] = 0
            print(f"{prefix}No active daily subscribers. Skipping.")
            return

        date_str = datetime.strptime(digest['digest_date'], '%Y-%m-%d').strftime('%b %d')
        subject = f"AI & Tech Digest — {date_str}"
        html = build_email_html(digest)

        if dry_run:
            print(f"{prefix}Would send '{subject}' to {len(subscribers)} subscribers")
            print(f"{prefix}HTML preview (first 500 chars):")
            print(html[:500])
            run['output_count'] = 0
            run['metadata'] = {'digest_date': digest['digest_date'], 'recipients': len(subscribers)}
            return

        print(f"{prefix}Sending to {len(subscribers)} subscribers...")

        sent = 0
        failed = 0
        for email in subscribers:
            try:
                resend.Emails.send({
                    "from": EMAIL_FROM,
                    "to": email,
                    "subject": subject,
                    "html": html,
                })
                print(f"  ✓ {email}")
                sent += 1
            except Exception as e:
                print(f"  ✗ {email}: {e}")
                failed += 1

        run['output_count'] = sent
        run['metadata'] = {'failed': failed, 'digest_date': digest['digest_date']}
        print(f"{prefix}Done.")


if __name__ == '__main__':
    send_digest_email()
