## File Reading Rules

* Always use the built-in `Read` tool when inspecting source files.
* Do NOT use Bash commands such as `cat`, `sed`, `head`, `tail`, or similar commands to read source files.
* Use `Read` with the appropriate line range when only part of a file is needed.
* Use `Grep` for searching for text or symbols.
* Use `Glob` for finding files.
* Use Bash only when a shell command is actually required for execution, testing, building, installing, or other terminal operations.
* Before modifying a file, use `Read` to inspect the relevant existing code.
* Prefer direct file tools over shell commands for file inspection.


Clean Up Strategy (Before & After)
Current UI Component	Proposed Clean Version
QR Code Fleet Management + Subtext paragraph	QR Fleet Management (No subtext description)
Orders + Track fulfillment description paragraph	Orders (Clean title heading)
Distributors & Partners + Review B2B franchise requests...	Distributors & Partners (No subtext description)
Message Manager + Every SMS & WhatsApp send attempted...	Message Log Manager (No subtext description)
Large Test OTP Widget (Live) box section	Moved to a separate tab or condensed into a single icon button




Act as an expert Senior UX/UI Engineer and Frontend Developer. I want to optimize and radically simplify the UI of my dashboard application ("RepiQR") to fix a problem where there is too much wordy, confusing, and unnecessary description text. 

I need you to refactor our dashboard code templates to maximize data density and make it clean. Please apply these 5 strict layout rules to our components:

1. REMOVE SUBTITLE PARAGRAPHS
Completely delete descriptive subtexts directly underneath page headers. For example:
- Remove: "Generate, print, and monitor scannable smart asset stickers across all categories."
- Remove: "Track fulfillment, manage records, and contact customers right from this list."
- Remove: "Review B2B franchise requests, verify partner credentials, and unlock Distributor Dashboards."
- Remove: "Every SMS & WhatsApp send attempted via Twilio—alerts, phone verification..."

2. CONDENSE UTILITY WIDGETS
In the Message Manager section, the "Test OTP Widget (Live)" takes up too much primary vertical space. Convert this testing form into a collapsible accordion panel (hidden by default) or encapsulate it inside a clean modal popup triggered by a "Test OTP" button.

3. OPTIMIZE CONTAINER BLOCKS
Ensure that when data tables or list grids are completely empty (e.g., "No orders yet" or "No messages logged yet"), the empty-state fallback illustrations are compact, taking up no more than 200px of height.

4. SIMPLIFY STATS CHIPS
Keep the primary analytics indicators (Active, Pending, Scans) strictly limited to their absolute values and a badge status, removing any micro-labels that repeat information present in the table headers.

5. PROVIDE THE REFACTORED COMPONENT CODE
Please output the updated structural code layout using [INSERT YOUR WEB FRAMEWORK, e.g., React with Tailwind CSS, Vue, or HTML/Bootstrap]. Ensure that all decorative paragraph tags (<p> or <span> subtitles) are deleted from the UI headers to give us a sleek, minimal, and professional enterprise administration look.

