Yes 👍 You can make the visitor side very simple and avoid showing a confusing **“Connecting…”** state.

For your flow, I'd offer these notification/start-chat methods:

1. **Dashboard notification** 🔔
   Owner gets a new-chat alert → **Open Chat**

2. **SMS alert** 📱
   Owner receives SMS → **Open Chat** link

3. **WhatsApp alert** 💬
   Owner receives WhatsApp message → **Open Chat**

4. **Email alert** 📧
   Useful as a fallback, especially if the owner misses SMS.

5. **Push notification** 🔔
   If the owner has your PWA/mobile app installed.

6. **In-app chat inbox** 💬
   Owner can see all visitor conversations in one place.

For your **scan page**, I would design it like this:

```text
        Owner / Listing
             ↓
       [ QR SCANNED ]
             ↓
      Visitor sees page

┌──────────────────────────────┐
│  Interested in this listing? │
│                              │
│  Your message                │
│  ┌────────────────────────┐  │
│  │ Hi, I'm interested...  │  │
│  └────────────────────────┘  │
│                              │
│  Notify owner via            │
│                              │
│  ☑ SMS       ☑ WhatsApp      │
│                              │
│       [ Send Message ]       │
└──────────────────────────────┘
```

Then after sending:

```text
✓ Message sent

SMS        ✓ Sent
WhatsApp   ✓ Delivered
Owner      ✓ Notified
```

And if the visitor later opens the chat:

```text
Visitor: Hi, I'm interested
                 ✓✓
Owner: Hi! How can I help?
                 ✓✓
```

You can use status states like:

**✓ Sent → ✓✓ Delivered → ✓✓ Read**

One important UX point: **don't make the visitor choose between SMS and WhatsApp unless necessary.** A better option is:

`☑ SMS  ☑ WhatsApp`

with both selected by default, then your backend sends the notification through both channels. The actual conversation can remain inside your website, while SMS/WhatsApp simply brings the owner into it. 🔥
