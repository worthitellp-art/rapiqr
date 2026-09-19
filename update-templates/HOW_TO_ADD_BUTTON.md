# How to add the button in MSG91's template editor

Applies to every template listed in `EDIT_TEMPLATES.md` — that file says **which template gets which button** (text + URL); this file is just the click-path for adding it in MSG91's UI, since the button row defaults to the wrong type.

## The gotcha

Clicking **+ Add Button** drops in a **Quick Reply** button by default — that type only has a "Button Text" field, no URL field, because Quick Reply buttons don't link anywhere (they just send a canned reply back). That's not what we want for any of these templates.

## Steps

1. Open the template in MSG91 → **WhatsApp → Templates** → find it → **Edit Template**.
2. Paste in the Body text from `EDIT_TEMPLATES.md` for this template.
3. Scroll to **Button (Optional)** → click **+ Add Button**.
4. On the new button row, look for a **type selector** — a small dropdown or set of tabs, usually sitting just to the left of (or just above) the "Button Text" field, offering: **Quick Reply / Call Phone Number / Visit Website**. It's easy to miss because it's small and the row opens already showing the Quick Reply fields.
5. Switch it to **Visit Website**. The row should now show:
   - **Button Text** — the label from `EDIT_TEMPLATES.md` (e.g. `View & Take Action`)
   - **Website URL type** — choose **Dynamic** (not Static — the URL has to carry a different session id per message)
   - **URL** — the static part from `EDIT_TEMPLATES.md` (e.g. `https://repiqr.com/#/dashboard?tab=chat&session=`); MSG91 usually appends `{{1}}` for you once you pick Dynamic, or gives a separate "example value" field to fill (use something like `6aae76dcae7ca2804553a390`)
6. For `location_shared`, repeat steps 3–5 a second time for **Button 2** (it needs two Visit Website buttons).
7. Click **Save**. The template goes back to **pending** — Meta review takes 24–72 hours (same as any body/button edit).

## If you can't find the type selector at all

Delete the Quick Reply button that got added (trash icon on that row) and click **+ Add Button** again — MSG91 sometimes remembers the last-picked button type for the session, so the type picker may not have shown up the first time. A fresh click after deleting usually surfaces it.

## Reference

See `EDIT_TEMPLATES.md` in this same folder for the exact Body text and button Text/URL per template (`emergency_alert`, `qr_scan_alert`, `location_shared`, `chat_started`, `chat_message`).
