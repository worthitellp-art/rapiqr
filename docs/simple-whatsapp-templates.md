# 📱 Simplest WhatsApp Templates (MSG91 + Meta Approved Standard)

This document contains **2 brand-new, ultra-simple, high-readability WhatsApp templates** with emojis and Call-To-Action (CTA) link buttons, plus the complete rules and JSON schemas for MSG91.

---

## ⚠️ Why Recipients Currently Have Trouble Seeing Messages / Links

1. **Unsaved Contacts Block Text Links**: If a business sends a URL directly in the message body text (`https://...`), WhatsApp often disables the hyperlink and hides previews until the recipient adds the sender to their phone contacts.
2. **CTA Buttons Always Work**: WhatsApp **Call To Action (Visit Website) buttons** render as clean, interactive button cards at the bottom of the message that are **always clickable**, even if the recipient hasn't saved your number!
3. **Cluttered Formatting**: Long walls of text get ignored on mobile. Short text with 1–2 emojis and clear spacing makes messages instantly readable.

---

## 📋 Rules & Requirements for MSG91 & Meta WhatsApp Templates

| Rule | Requirement | Why / Impact |
| :--- | :--- | :--- |
| **Template Name** | Lowercase letters, numbers, and underscores only (`[a-z0-9_]`). No spaces or dashes. | Meta will reject uppercase or special characters. |
| **Category** | `UTILITY` | Utility templates get approved fast (usually minutes) and don't require marketing opt-in. |
| **Language** | `en` (English) or `en_US` | Must match the language code sent by your backend API call. |
| **Body Variables** | Set **Variable Type** dropdown to **`Name`** before typing. Use `{{name}}` (e.g. `{{tag_name}}`). | If dropdown is left on "Number", typing `{{tag_name}}` throws an error. |
| **Button Type** | `Call To Action` → `Visit Website` → `Dynamic` | Allows appending a unique session ID or path at the end of the URL. |
| **Button URL Variable** | Meta requires the dynamic suffix to be `{{1}}` (e.g. `https://repiqr.com/.../session={{1}}`). | Meta only accepts positional `{{1}}` for dynamic button URLs. |
| **Sample Values** | **MANDATORY** for every single variable (`item_name`, `message`, button `{{1}}`). | Meta will immediately reject any template submitted without sample values. |
| **No Newlines in Variable Values** | At runtime, values passed into variables must NOT have raw line breaks. | MSG91 API will return an error if a variable value contains unescaped `\n`. |

---

## 🚀 Demo Template 1: `quick_scan_notify` (Scan Alert)

### Dashboard Setup (MSG91 Portal)
- **Template Name:** `quick_scan_notify`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Variable Type Dropdown:** `Name`
- **Header:** None
- **Footer:** None

### Body Text
```text
🔔 *RapiQR Alert*

Your item *{{item_name}}* was just scanned!
Message: "{{message}}"

Tap below to view details and reply 👇
```

### Body Sample Values
- `{{item_name}}` → `Car GJ 01 AB 1234`
- `{{message}}` → `Your vehicle lights are on`

### Button Setup
- **Button Type:** `Call To Action`
- **Action Type:** `Visit Website`
- **URL Type:** `Dynamic`
- **Button Text:** `💬 View & Reply`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Button Sample Value:** `6aae76dcae7ca2804553a390`

---

## 🚀 Demo Template 2: `quick_message_alert` (Instant Message Alert)

### Dashboard Setup (MSG91 Portal)
- **Template Name:** `quick_message_alert`
- **Category:** `UTILITY`
- **Language:** `English (en)`
- **Variable Type Dropdown:** `Name`
- **Header:** None
- **Footer:** None

### Body Text
```text
💬 *New Message Received*

You have a new message regarding *{{item_name}}*.

Tap the button below to open secure chat 👇
```

### Body Sample Values
- `{{item_name}}` → `Office Door Key`

### Button Setup
- **Button Type:** `Call To Action`
- **Action Type:** `Visit Website`
- **URL Type:** `Dynamic`
- **Button Text:** `🚀 Open Chat`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Button Sample Value:** `6aae76dcae7ca2804553a390`

---

## 📦 MSG91 JSON Format (Template Registration / Export)

### Template 1 JSON (`quick_scan_notify.json`)
```json
{
  "category": "UTILITY",
  "name": "quick_scan_notify",
  "languages": [
    {
      "language": "en",
      "parameter_format": "NAMED",
      "code": [
        {
          "type": "BODY",
          "text": "🔔 *RapiQR Alert*\n\nYour item *{{item_name}}* was just scanned!\nMessage: \"{{message}}\"\n\nTap below to view details and reply 👇",
          "example": {
            "body_text_named_params": [
              {
                "param_name": "item_name",
                "example": "Car GJ 01 AB 1234"
              },
              {
                "param_name": "message",
                "example": "Your vehicle lights are on"
              }
            ]
          }
        },
        {
          "type": "BUTTONS",
          "buttons": [
            {
              "type": "URL",
              "text": "💬 View & Reply",
              "url": "https://repiqr.com/#/dashboard?tab=chat&session={{1}}",
              "example": [
                "6aae76dcae7ca2804553a390"
              ]
            }
          ]
        }
      ],
      "variables": [
        "body_item_name",
        "body_message",
        "button_1"
      ],
      "variable_type": {
        "body_item_name": {
          "type": "text",
          "parameter_name": "item_name"
        },
        "body_message": {
          "type": "text",
          "parameter_name": "message"
        },
        "button_1": {
          "type": "text"
        }
      }
    }
  ]
}
```

### Template 2 JSON (`quick_message_alert.json`)
```json
{
  "category": "UTILITY",
  "name": "quick_message_alert",
  "languages": [
    {
      "language": "en",
      "parameter_format": "NAMED",
      "code": [
        {
          "type": "BODY",
          "text": "💬 *New Message Received*\n\nYou have a new message regarding *{{item_name}}*.\n\nTap the button below to open secure chat 👇",
          "example": {
            "body_text_named_params": [
              {
                "param_name": "item_name",
                "example": "Office Door Key"
              }
            ]
          }
        },
        {
          "type": "BUTTONS",
          "buttons": [
            {
              "type": "URL",
              "text": "🚀 Open Chat",
              "url": "https://repiqr.com/#/dashboard?tab=chat&session={{1}}",
              "example": [
                "6aae76dcae7ca2804553a390"
              ]
            }
          ]
        }
      ],
      "variables": [
        "body_item_name",
        "button_1"
      ],
      "variable_type": {
        "body_item_name": {
          "type": "text",
          "parameter_name": "item_name"
        },
        "button_1": {
          "type": "text"
        }
      }
    }
  ]
}
```

---

## 📡 Backend API Payload Format (Sending via MSG91 Client)

When dispatching through `POST /api/v5/whatsapp/whatsapp-outbound-message/bulk/`, MSG91 expects components to match the placeholders:

```json
{
  "integrated_number": "91XXXXXXXXXX",
  "content_type": "template",
  "payload": {
    "messaging_product": "whatsapp",
    "type": "template",
    "template": {
      "name": "quick_scan_notify",
      "language": {
        "code": "en",
        "policy": "deterministic"
      },
      "to_and_components": [
        {
          "to": [
            "919876543210"
          ],
          "components": {
            "body_item_name": {
              "type": "text",
              "value": "Car GJ 01 AB 1234",
              "parameter_name": "item_name"
            },
            "body_message": {
              "type": "text",
              "value": "Your vehicle lights are on",
              "parameter_name": "message"
            },
            "button_1": {
              "type": "text",
              "value": "6aae76dcae7ca2804553a390"
            }
          }
        }
      ]
    }
  }
}
```
