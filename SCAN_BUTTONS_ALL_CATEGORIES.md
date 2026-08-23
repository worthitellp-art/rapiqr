# RepiQR — Every scan-page button, by sticker category

Generated from `src/components/scan/categoryVariants.ts` (the single source of truth for
the data-driven scan pages) plus a hand-extracted appendix for the bespoke car/bike screen.
Regenerate with `node scripts/dump-scan-buttons.mjs` — do not hand-edit sections 1-17.

**17 categories** · each has 1 hero CTA + 3 mini buttons + 6 tiles × 3 buttons + 1 composer + 1 assistant button.

## Action kinds

| kind | what the button actually does (`ScanPage.runVariantAction`) |
| --- | --- |
| `call` | `via: public` dials the number straight from the handset. `via: partner` / `via: support` ignore the printed number and resolve the admin-configured provider for that service (Communication page); if none is configured the button shows a "not configured yet" banner. |
| `notify` | Posts a backend alert → SMS fan-out to the owner **and** their emergency contacts, and drops the same text into the visitor's RepiChat thread. |
| `maps` | Opens a Google Maps search around the visitor's current pin. |
| `pin` | Shares live GPS: opens Maps **and** dispatches an `emergency` alert to owner + emergency contacts. |
| `write` | Scrolls to / focuses the free-text composer on the same screen. |
| `ask` | Opens the AI assistant sheet. |

## Button styles

| style | colour |
| --- | --- |
| `primary` | red |
| `wa` | green |
| `blue` | blue |
| `ghost` | white/outline |

## Index

| # | Category key | Label | Module | Tone | Renderer |
| --- | --- | --- | --- | --- | --- |
| 1 | `car` | Car | Vehicle module | red | **bespoke screen in ScanPage.tsx** (this data is unused) |
| 2 | `bike` | Bike | Vehicle module | red | **bespoke screen in ScanPage.tsx** (this data is unused) |
| 3 | `bicycle` | Bicycle | Vehicle module | red | CategoryScanView |
| 4 | `helmet` | Helmet | Vehicle module | red | CategoryScanView |
| 5 | `home` | Home Gate | Home / Office module | red | CategoryScanView |
| 6 | `door` | Door Tag | Home / Office module | calm | CategoryScanView |
| 7 | `apartment` | Apartment | Home / Office module | red | CategoryScanView |
| 8 | `employee` | Employee ID | Home / Office module | calm | CategoryScanView |
| 9 | `nfc` | NFC Tag | Home / Office module | calm | CategoryScanView |
| 10 | `child` | Kids | Kids & Seniors module | red | CategoryScanView |
| 11 | `senior` | Senior | Kids & Seniors module | red | CategoryScanView |
| 12 | `wristband` | Wristband | Kids & Seniors module | red | CategoryScanView |
| 13 | `pet` | Pet | Luggage & Travel module | calm | CategoryScanView |
| 14 | `luggage` | Luggage | Luggage & Travel module | calm | CategoryScanView |
| 15 | `travel` | Travel Tag | Luggage & Travel module | calm | CategoryScanView |
| 16 | `wallet` | Wallet | Luggage & Travel module | calm | CategoryScanView |
| 17 | `keychain` | Keychain | Luggage & Travel module | calm | CategoryScanView |

---

## 1. `car` — Car

> ⚠️ `car` is listed in `BESPOKE_CATEGORIES`, so ScanPage renders its own hard-coded screen
> for it instead of `CategoryScanView`. The buttons below are the declared data, which is
> currently **not** what a visitor sees for this category.

| | |
| --- | --- |
| Module | Vehicle module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `siren` |
| Title | This is an emergency or an accident |
| Subtitle | We've detected an emergency or accident |
| Sample tagline | Car tag · GJ 01 XX 0000 |
| Default owner alert | "I scanned the RepiQR tag on your car — there is an emergency at the vehicle." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag on your car — there is an emergency at the vehicle." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Contacts** | `phone` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 1.1 Tile — Towing *(Roadside recovery)*

Icon `tow` · tint `rose`

*Get the car lifted to the nearest garage.*

- The closest RepiQR towing partner is called for you
- The owner gets the request with your GPS pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Towing partner · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Towing partner) · via `partner` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your car needs towing — I am with the vehicle now." |
| 3 | **Share my live location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 1.2 Tile — Wrong Parking *(Blocking the way)*

Icon `park` · tint `blue`

*Ask the owner to move the car — without ever seeing their number.*

- One tap sends a polite move-your-car alert
- Adding your pin tells them exactly which car it is

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask the owner to move it** | `wa` | **notify** → SMS + RepiChat to owner: "Your car is blocking my way. Could you move it when you can?" |
| 2 | **Attach the exact spot** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 1.3 Tile — Mechanic *(On-site repair)*

Icon `wrench` · tint `cream`

*A mechanic comes to the car instead of the car going to them.*

- Partner mechanics cover most city pin codes
- The owner is told what was reported and by whom

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Mechanic desk · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Mechanic desk) · via `partner` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your car has a breakdown — I have called a mechanic to the spot." |
| 3 | **Find garages near me** | `blue` | **maps** → Google Maps search: `car repair near me` |

#### 1.4 Tile — Puncture *(Tyre assistance)*

Icon `tyre` · tint `violet`

*Flat tyre help, brought to the roadside.*

- Puncture kit or spare-fitting at the vehicle
- No number is exchanged with the owner

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Tyre assistance · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Tyre assistance) · via `partner` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your car has a flat tyre. Tyre assistance has been requested." |
| 3 | **Find a tyre shop nearby** | `blue` | **maps** → Google Maps search: `tyre shop near me` |

#### 1.5 Tile — Fuel Delivery *(Tank ran dry)*

Icon `fuel` · tint `amber`

*Five litres delivered to wherever the car has stopped.*

- Petrol or diesel, delivered to your pin
- Payment is settled by the owner in the app

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Fuel delivery · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Fuel delivery) · via `partner` |
| 2 | **Send where the car is** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your car has run out of fuel — a delivery has been requested." |

#### 1.6 Tile — Accident Report *(Police & insurance)*

Icon `police` · tint `rose`

*Report a crash and pull the owner into the loop instantly.*

- 112 reaches police, fire and ambulance together
- The owner receives the alert with the time and place

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Call Police · 100** | `ghost` | **call** → dials `100` (Police) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There has been an accident involving your car. Emergency services have been informed." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Car Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Your car is blocked in at the mall parking... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can help you handle this car. What is happening? |

Suggested questions inside the assistant:

- Car is blocking me
- There has been a crash
- Car will not start
- Is the owner told?

---

## 2. `bike` — Bike

> ⚠️ `bike` is listed in `BESPOKE_CATEGORIES`, so ScanPage renders its own hard-coded screen
> for it instead of `CategoryScanView`. The buttons below are the declared data, which is
> currently **not** what a visitor sees for this category.

| | |
| --- | --- |
| Module | Vehicle module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `siren` |
| Title | This is Emergency or an accident |
| Subtitle | We've detected an emergency or accident |
| Sample tagline | Bike tag · GJ 01 AB 1234 |
| Default owner alert | "I scanned the RepiQR tag on your bike — there is an emergency at the vehicle." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag on your bike — there is an emergency at the vehicle." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Contacts** | `phone` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 2.1 Tile — Bike Towing *(Roadside recovery)*

Icon `tow` · tint `rose`

*A two-wheeler recovery van comes to the bike.*

- Partner van carries a ramp for two-wheelers
- The owner gets the request with your GPS pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Bike towing · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Bike towing) · via `partner` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bike needs towing — I am with it now." |
| 3 | **Share my live location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 2.2 Tile — Mechanic *(On-site repair)*

Icon `wrench` · tint `cream`

*On-spot repair for a bike that will not move.*

- Chain, clutch, plug and battery jobs on the roadside
- The owner sees what was reported

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Mechanic desk · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Mechanic desk) · via `partner` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bike has broken down — a mechanic has been called to the spot." |
| 3 | **Find mechanics near me** | `blue` | **maps** → Google Maps search: `two wheeler mechanic near me` |

#### 2.3 Tile — Parking Issue *(Blocking path)*

Icon `park` · tint `blue`

*Ask the rider to move the bike, anonymously.*

- One tap sends a polite move-your-bike alert
- Your pin tells them exactly which bike it is

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask the rider to move it** | `wa` | **notify** → SMS + RepiChat to owner: "Your bike is blocking the path. Could you move it when you can?" |
| 2 | **Attach the exact spot** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 2.4 Tile — Puncture *(Tyre assistance)*

Icon `tyre` · tint `violet`

*Puncture help without pushing the bike anywhere.*

- Tube repair or replacement at the roadside
- Works for scooters and motorcycles

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Puncture help · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Puncture help) · via `partner` |
| 2 | **Find puncture shops nearby** | `blue` | **maps** → Google Maps search: `puncture repair near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bike has a puncture. Roadside tyre help has been requested." |

#### 2.5 Tile — Theft Alert *(Report and alert)*

Icon `theft` · tint `rose`

*Flag a bike that looks stolen or tampered with.*

- The owner is alerted the moment you send it
- Police can be reached on 112 in the same flow

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner now** | `wa` | **notify** → SMS + RepiChat to owner: "I think your bike is being tampered with or has been moved without you." |
| 2 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send where the bike is** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 2.6 Tile — Fuel Delivery *(Tank ran dry)*

Icon `fuel` · tint `amber`

*Fuel brought to the bike, no jerrycan hunt.*

- Two to five litres delivered to your pin
- Settled by the owner inside RepiQR

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Fuel delivery · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Fuel delivery) · via `partner` |
| 2 | **Send where the bike is** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bike has run out of fuel — a delivery has been requested." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Bike Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | Type your message here... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can help with this bike. What do you need? |

Suggested questions inside the assistant:

- Bike is blocking me
- The rider is hurt
- I think it is stolen
- Do I pay for towing?

---

## 3. `bicycle` — Bicycle

| | |
| --- | --- |
| Module | Vehicle module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `cycle` |
| Title | This cyclist may need help |
| Subtitle | We've detected an emergency or accident |
| Sample tagline | Bicycle tag · Frame no. BC-4471 |
| Default owner alert | "I scanned the RepiQR tag on your bicycle — there is an emergency at the cycle." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag on your bicycle — there is an emergency at the cycle." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Contacts** | `phone` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 3.1 Tile — Rider Down *(Cyclist is hurt)*

Icon `ambulance` · tint `rose`

*A cyclist on the ground needs a medical team before anything else.*

- 108 is the free ambulance line in most states
- Do not lift the rider — wait with them and keep them warm
- The contacts on this tag get the alert with your pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 3.2 Tile — Theft Alert *(Cut lock or moved)*

Icon `theft` · tint `violet`

*Flag a cycle that looks stolen, cut loose or dumped.*

- The owner is alerted the second you send it
- Police are one tap away on 112 in the same sheet

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner now** | `wa` | **notify** → SMS + RepiChat to owner: "I think your bicycle has been stolen or moved without you." |
| 2 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send where the cycle is** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 3.3 Tile — Roadside Fix *(Chain, brakes, gears)*

Icon `wrench` · tint `cream`

*The small repairs that get a cycle rolling again.*

- Chain, brake and gear jobs are done on the spot
- The owner sees what was reported and when

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Cycle mechanic · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Cycle mechanic) · via `partner` |
| 2 | **Find a cycle shop nearby** | `blue` | **maps** → Google Maps search: `bicycle repair shop near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bicycle has broken down — I have called for roadside help." |

#### 3.4 Tile — Puncture *(Tube repair)*

Icon `tyre` · tint `blue`

*Flat tube help, so nobody has to walk the cycle home.*

- Patch or tube replacement at the roadside
- Works for cycles and e-bikes alike

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Puncture help · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Puncture help) · via `partner` |
| 2 | **Find a puncture shop nearby** | `blue` | **maps** → Google Maps search: `cycle puncture repair near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bicycle has a puncture. Roadside help has been requested." |

#### 3.5 Tile — Blocking a Path *(Chained in the way)*

Icon `park` · tint `sky`

*Ask the owner to move it — without ever seeing their number.*

- One tap sends a polite move-your-cycle alert
- Your pin tells them exactly which cycle it is

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask the owner to move it** | `wa` | **notify** → SMS + RepiChat to owner: "Your bicycle is chained across the path. Could you move it when you can?" |
| 2 | **Attach the exact spot** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 3.6 Tile — Abandoned Cycle *(Standing for days)*

Icon `flag` · tint `mint`

*A cycle that has not moved in a week is usually a lost one.*

- The owner is told where it stands and since when
- Support chases the owner if they never reply

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the owner it is here** | `wa` | **notify** → SMS + RepiChat to owner: "Your bicycle has been standing in the same spot for days — is it lost?" |
| 2 | **Add what you can see** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Call RepiQR support · 1800 123 4567** | `ghost` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Cycle Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Cycle is lying near the flyover... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can help with this bicycle. What do you see? |

Suggested questions inside the assistant:

- The rider has fallen
- I think it is stolen
- It has been here for days
- Who pays for the repair?

---

## 4. `helmet` — Helmet

| | |
| --- | --- |
| Module | Vehicle module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `helmet` |
| Title | This rider needs help |
| Subtitle | You've scanned a helmet safety tag — stay with them |
| Sample tagline | Helmet tag · Blood group B+ · Rider |
| Default owner alert | "I scanned the RepiQR tag inside your helmet — the rider needs help right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag inside your helmet — the rider needs help right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Family** | `people` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 4.1 Tile — Ambulance *(Rider is injured)*

Icon `ambulance` · tint `rose`

*Get a medical team moving before anything else.*

- 108 is the free ambulance number in most states
- 112 reaches police, fire and ambulance together
- Family on this tag is alerted with your live pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 4.2 Tile — Do Not Remove *(Helmet first aid)*

Icon `guide` · tint `violet`

*The three minutes before the ambulance arrives.*

- Leave the helmet on unless they have stopped breathing
- Do not turn the head or neck — support it as it lies
- Keep talking to them and note the time of the crash

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |
| 3 | **Share where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 4.3 Tile — Medical Info *(Blood group, allergies)*

Icon `medical` · tint `peach`

*What a paramedic asks for, without exposing an identity.*

- Blood group B+ · allergic to sulfa drugs
- On blood-pressure medication, no known heart condition

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "The rider is being treated — please share their medical history with the paramedic." |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 4.4 Tile — Accident Report *(Police & insurance)*

Icon `police` · tint `blue`

*Report the crash and pull the family into the loop instantly.*

- 112 reaches police, fire and ambulance together
- The family receives the alert with the time and place

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Call Police · 100** | `ghost` | **call** → dials `100` (Police) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There has been an accident involving the rider of this helmet. Emergency services have been informed." |

#### 4.5 Tile — Notify Family *(Emergency contacts)*

Icon `people` · tint `mint`

*One tap reaches everyone stored on this tag.*

- Push, SMS and WhatsApp go out together
- Your number is never shown to any of them

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the family now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 4.6 Tile — Helmet Found *(Nobody around)*

Icon `bag` · tint `cream`

*A helmet lying alone is usually just lost, not a crash.*

- The owner is told where it was found and when
- A police station is the safest handover if you cannot wait

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the owner I have it** | `wa` | **notify** → SMS + RepiChat to owner: "I have found your helmet and it is safe with me right now." |
| 2 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 3 | **Say where I found it** | `ghost` | **write** → focuses the free-text composer |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Rider’s Family |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Rider is conscious, ambulance called... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | You stopped — that is the important part. What is happening? |

Suggested questions inside the assistant:

- Should I take the helmet off?
- The rider is unconscious
- I only found the helmet
- What can I see about them?

---

## 5. `home` — Home Gate

| | |
| --- | --- |
| Module | Home / Office module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `siren` |
| Title | Emergency at this property |
| Subtitle | Fire, gas leak, medical or security emergency |
| Sample tagline | Home gate tag · Block C, Flat 402 |
| Default owner alert | "I scanned the RepiQR tag at your gate — something needs your attention at the property." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag at your gate — something needs your attention at the property." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Residents** | `phone` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 5.1 Tile — Fire Emergency *(Call 101)*

Icon `fire` · tint `rose`

*Fire services first, residents a second later.*

- 101 is the national fire line; 112 also routes to it
- Residents get an alert with the gate address

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Fire services · 101** | `primary` | **call** → dials `101` (Fire services) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There is a fire emergency at your property. Fire services have been called." |

#### 5.2 Tile — Gas Leak *(Urgent hazard)*

Icon `gas` · tint `amber`

*Smell of gas at the gate or in the corridor.*

- Do not ring bells or switch anything on or off
- Residents are alerted so they can shut the valve

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call LPG / gas leak helpline · 1906** | `primary` | **call** → dials `1906` (LPG / gas leak helpline) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There is a gas smell at your property — please shut the cylinder valve and ventilate." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 5.3 Tile — Water Leak *(Plumbing issue)*

Icon `water` · tint `sky`

*Overflowing tank, burst line or a flooded porch.*

- Residents get a photo-ready alert with the time
- A partner plumber can be dispatched to the gate

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the residents** | `wa` | **notify** → SMS + RepiChat to owner: "Water is leaking at your property — it looks like a burst line or an overflowing tank." |
| 2 | **Call Plumber on call · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Plumber on call) · via `partner` |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 5.4 Tile — Delivery *(Parcel at the gate)*

Icon `parcel` · tint `cream`

*Courier at the gate with nobody home.*

- Residents are pinged instantly with your note
- Leave the drop instructions they reply with

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the residents I am here** | `wa` | **notify** → SMS + RepiChat to owner: "I have a delivery for you at the gate. Where should I leave it?" |
| 2 | **Add a note about the parcel** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Share where I am standing** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 5.5 Tile — Visitor *(Someone is at the gate)*

Icon `visitor` · tint `blue`

*Announce yourself without shouting or calling.*

- Residents see who is at the gate and when
- They can reply on WhatsApp without sharing a number

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Announce me at the gate** | `wa` | **notify** → SMS + RepiChat to owner: "I am at your gate — could you let me in?" |
| 2 | **Say who I am** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 5.6 Tile — Security Alert *(Suspicious activity)*

Icon `cctv` · tint `violet`

*Report someone or something that looks wrong.*

- Residents are alerted with the time and place
- Police are one tap away on 100 or 112

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the residents** | `wa` | **notify** → SMS + RepiChat to owner: "There is suspicious activity at your property — please check your cameras." |
| 2 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Call Police · 100** | `ghost` | **call** → dials `100` (Police) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Home Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | Type your message here... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can help you reach the people inside. What is going on? |

Suggested questions inside the assistant:

- Nobody is answering
- I smell gas
- There is a fire
- Is my number shown?

---

## 6. `door` — Door Tag

| | |
| --- | --- |
| Module | Home / Office module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `door` / `bell` |
| Title | You are at this door |
| Subtitle | Reach the resident without knowing their number |
| Sample tagline | Door tag · Flat 402, Block C |
| Default owner alert | "I am at your door and nobody is answering." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the resident** | **notify** → SMS + RepiChat to owner: "I am at your door and nobody is answering." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Resident** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Leave a Parcel note** | `parcel` | **write** → focuses the free-text composer |

### Quick-action tiles (6) and their buttons

#### 6.1 Tile — Knock Digitally *(Instant ping)*

Icon `bell` · tint `amber`

*The alert lands on their phone even when the bell is not heard.*

- Push, SMS and WhatsApp go out together
- They can reply without either number being shown

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ring the resident now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Say who I am** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Share that I am at the door** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 6.2 Tile — Delivery *(Parcel at the door)*

Icon `parcel` · tint `cream`

*Courier at the door with nobody home.*

- Residents are pinged instantly with your note
- Follow the drop instructions they reply with

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the resident I am here** | `wa` | **notify** → SMS + RepiChat to owner: "I have a delivery for you at the door. Where should I leave it?" |
| 2 | **Add a note about the parcel** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 6.3 Tile — Visitor *(Announce yourself)*

Icon `visitor` · tint `blue`

*Say who you are without shouting through the door.*

- The resident sees who is outside and when
- Useful when the bell is broken or the flat is empty

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Announce me at the door** | `wa` | **notify** → SMS + RepiChat to owner: "I am at your door — could you let me in?" |
| 2 | **Say who I am** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 6.4 Tile — Emergency *(Fire, gas or medical)*

Icon `fire` · tint `rose`

*Something is wrong inside and nobody is opening.*

- 112 reaches police, fire and ambulance together
- 101 goes straight to fire services
- The resident is alerted with the time and the flat

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Call Fire services · 101** | `ghost` | **call** → dials `101` (Fire services) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There is an emergency at your door — emergency services have been called." |

#### 6.5 Tile — Leak / Damage *(Water at the door)*

Icon `water` · tint `sky`

*Seepage in the corridor usually starts behind a closed door.*

- The resident gets a timestamped alert
- A partner plumber can be sent to the flat

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the resident** | `wa` | **notify** → SMS + RepiChat to owner: "Water is leaking from your flat into the corridor." |
| 2 | **Call Plumber on call · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Plumber on call) · via `partner` |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 6.6 Tile — Report Issue *(Wrong details or misuse)*

Icon `flag` · tint `violet`

*Damaged tag, wrong flat number or a tag used to harass.*

- Support reviews the tag and contacts the owner
- Use 112 instead if anyone is in danger

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call RepiQR support · 1800 123 4567** | `primary` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |
| 2 | **Describe the problem** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message the Resident |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Delivery at the door, nobody is answering... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can reach the person inside. What do you need? |

Suggested questions inside the assistant:

- Nobody is answering
- I have a parcel
- Is my number shown?
- Something is wrong inside

---

## 7. `apartment` — Apartment

| | |
| --- | --- |
| Module | Home / Office module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `building` |
| Title | Emergency in this building |
| Subtitle | Fire, lift entrapment, gas or medical emergency |
| Sample tagline | Apartment gate tag · Tower B · Security desk |
| Default owner alert | "I scanned the RepiQR tag at your society gate — there is an emergency in the building." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR tag at your society gate — there is an emergency in the building." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Society** | `people` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 7.1 Tile — Fire Emergency *(Call 101)*

Icon `fire` · tint `rose`

*Fire services first, the society committee a second later.*

- 101 is the national fire line; 112 also routes to it
- Use the stairs, never the lift
- The committee and security are alerted with the tower name

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Fire services · 101** | `primary` | **call** → dials `101` (Fire services) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There is a fire in the building. Fire services have been called." |

#### 7.2 Tile — Trapped in Lift *(Someone is stuck)*

Icon `lift` · tint `amber`

*Get the technician moving and the trapped person talking.*

- Stay outside the doors and keep speaking to them
- Never force a lift door open yourself
- Security is alerted with the tower and floor

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Lift technician · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Lift technician) · via `partner` |
| 2 | **Alert security now** | `wa` | **notify** → SMS + RepiChat to owner: "Someone is trapped in the lift — please send the technician and security now." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 7.3 Tile — Gas Leak *(Urgent hazard)*

Icon `gas` · tint `peach`

*Smell of gas in a corridor or a stairwell.*

- Do not ring bells or switch anything on or off
- Residents are alerted so they can shut the valve

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call LPG / gas leak helpline · 1906** | `primary` | **call** → dials `1906` (LPG / gas leak helpline) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There is a gas smell in the building — please shut the cylinder valves and ventilate." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 7.4 Tile — Visitor / Guest *(Announce at the gate)*

Icon `visitor` · tint `blue`

*Get in without arguing with the intercom.*

- The flat is pinged directly with your name
- They can approve you without sharing a number

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Announce me at the gate** | `wa` | **notify** → SMS + RepiChat to owner: "I am at your society gate — could you approve my entry?" |
| 2 | **Say who I am** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 7.5 Tile — Delivery *(Courier at the gate)*

Icon `parcel` · tint `cream`

*Security will not accept it and nobody is picking up.*

- The flat gets your note with the time
- Leave the parcel exactly where they reply

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the flat I am here** | `wa` | **notify** → SMS + RepiChat to owner: "I have a delivery at the society gate. Where should I leave it?" |
| 2 | **Add a note about the parcel** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Share which gate I am at** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 7.6 Tile — Security Alert *(Suspicious activity)*

Icon `cctv` · tint `violet`

*Report someone or something that looks wrong on the premises.*

- Security and the committee are alerted with the time
- Police are one tap away on 100 or 112

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert security** | `wa` | **notify** → SMS + RepiChat to owner: "There is suspicious activity in the building — please check the cameras." |
| 2 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Call Police · 100** | `ghost` | **call** → dials `100` (Police) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message the Society |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Lift stuck between 4th and 5th floor... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | I can reach the society desk. What is happening? |

Suggested questions inside the assistant:

- Someone is stuck in the lift
- There is a fire
- I smell gas
- Security will not let me in

---

## 8. `employee` — Employee ID

| | |
| --- | --- |
| Module | Home / Office module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `badge` / `badge` |
| Title | You found someone's ID card |
| Subtitle | Thanks for stopping — let’s get it back to them |
| Sample tagline | Employee tag · Card EMP-2214 · access enabled |
| Default owner alert | "I have found your employee ID card and it is safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the employer** | **notify** → SMS + RepiChat to owner: "I have found your employee ID card and it is safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Employer** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Nearest Drop Point** | `box` | **maps** → Google Maps search: `lost and found counter near me` |

### Quick-action tiles (6) and their buttons

#### 8.1 Tile — Notify Employer *(Instant alert)*

Icon `bell` · tint `amber`

*The card holder and their admin desk are told together.*

- They see your pin, never your phone number
- The alert is timestamped in the RepiQR log

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert them now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found it** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 8.2 Tile — Block Access *(The card opens doors)*

Icon `shield` · tint `rose`

*An access card in a stranger’s hands is a building risk.*

- Ask them to deactivate the card before anything else
- A replacement is issued once the old card is blocked

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask them to block the card** | `wa` | **notify** → SMS + RepiChat to owner: "I have your access card — please deactivate it now, I will return the card itself." |
| 2 | **Call RepiQR support · 1800 123 4567** | `primary` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 8.3 Tile — Company Desk *(Call reception)*

Icon `headset` · tint `blue`

*The reception desk can page the person in minutes.*

- Quote the card number printed on the tag
- Reception logs the handover against the employee

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Company reception · 1800 123 4567** | `primary` | **call** → dials `1800 123 4567` (Company reception) · via `support` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I found an employee card of yours. How should I return it?" |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 8.4 Tile — Drop It Off *(Counter or desk)*

Icon `box` · tint `cream`

*A staffed counter is safer than your pocket.*

- Quote the tag code when you hand it over
- The employer is told exactly which counter holds it

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest counter** | `blue` | **maps** → Google Maps search: `lost and found counter near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I am leaving your ID card at the lost and found counter here." |
| 3 | **Share which building I am in** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 8.5 Tile — Medical Emergency *(The holder is unwell)*

Icon `medical` · tint `peach`

*The card holder is the one who needs help, not the card.*

- 108 is the free ambulance number in most states
- The employer and emergency contacts are alerted at once

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your employee has collapsed and needs medical help — an ambulance has been called." |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 8.6 Tile — Nearest Police *(Hand over safely)*

Icon `police` · tint `mint`

*The safest handover when nobody replies.*

- Stations log found property against the tag code
- The employer is told which station holds the card

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody replied, so I am depositing your ID card at the nearest police station." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message the Employer |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found the card outside the metro gate... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for picking it up. Where did you find the card? |

Suggested questions inside the assistant:

- Why block the card?
- I cannot carry it around
- Nobody is replying
- Is there a reward?

---

## 9. `nfc` — NFC Tag

| | |
| --- | --- |
| Module | Home / Office module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `nfc` / `nfc` |
| Title | You tapped a RepiQR smart tag |
| Subtitle | Reach the owner without either number being shown |
| Sample tagline | NFC tag · universal · tap or scan |
| Default owner alert | "I tapped your RepiQR smart tag — I have the item it is stuck to." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I tapped your RepiQR smart tag — I have the item it is stuck to." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Write a Message** | `chat` | **write** → focuses the free-text composer |

### Quick-action tiles (6) and their buttons

#### 9.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*One tap tells the owner their tag has been read.*

- Push, SMS and WhatsApp go out together
- They see your pin, never your phone number

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I am** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 9.2 Tile — Owner’s Note *(Left on this tag)*

Icon `note` · tint `violet`

*Written by the owner for whoever taps it.*

- "Thanks for stopping — please just message me here."
- "A reward is arranged through RepiQR, no cash needed."

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Reply on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Write a reply** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 9.3 Tile — Return the Item *(Drop point or courier)*

Icon `box` · tint `cream`

*Two ways to hand it back without meeting a stranger.*

- Partner shops and desks hold items until collection
- Courier pickup and shipping are paid by the owner

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find a drop point near me** | `blue` | **maps** → Google Maps search: `safe drop point near me` |
| 2 | **Call Courier pickup · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Courier pickup) · via `partner` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I can drop your item at a RepiQR point or hand it to a courier — which do you prefer?" |

#### 9.4 Tile — Emergency *(Someone needs help)*

Icon `alert` · tint `rose`

*If the tag is worn on a person and something is wrong.*

- 112 reaches police, fire and ambulance together
- The owner’s contacts are alerted with your pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Call Ambulance · 108** | `ghost` | **call** → dials `108` (Ambulance) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 9.5 Tile — Report Misuse *(Tag looks wrong)*

Icon `flag` · tint `sky`

*A cloned, damaged or misused tag should not stay live.*

- Support reviews the tag and contacts the owner
- A misused tag can be disabled within the hour

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call RepiQR support · 1800 123 4567** | `primary` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |
| 2 | **Describe the problem** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 9.6 Tile — How This Works *(Privacy & scans)*

Icon `shield` · tint `mint`

*What a tap does, and what it never does.*

- No number, address or full name is shown to you
- The owner does not get your number either
- Every tap is logged with the time, for the owner alone

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |
| 2 | **Message the owner** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Call RepiQR support · 1800 123 4567** | `ghost` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message the Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Tapped this tag on a laptop sleeve... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | This is a universal RepiQR tag. What is it stuck to? |

Suggested questions inside the assistant:

- What is this tag on?
- How do I return it?
- Can they see my number?
- The tag looks fake

---

## 10. `child` — Kids

| | |
| --- | --- |
| Module | Kids & Seniors module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `siren` |
| Title | This child needs help |
| Subtitle | You've scanned a child safety tag — stay with them |
| Sample tagline | School-bag tag · Age 7 · Blood group O+ |
| Default owner alert | "I have found your child and I am with them right now. They are safe." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I have found your child and I am with them right now. They are safe." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Guardians** | `people` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 10.1 Tile — Childline 1098 *(Govt. helpline)*

Icon `helpline` · tint `sky`

*India's 24x7 free helpline for children in distress.*

- 1098 is toll-free from any phone, day or night
- Use it if no guardian answers within a few minutes

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Childline · 1098** | `primary` | **call** → dials `1098` (Childline) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I have found your child and I am with them. Please call back through RepiQR." |
| 3 | **Send where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 10.2 Tile — Nearest Police *(Report a found child)*

Icon `police` · tint `blue`

*Hand the child over to a station if no one can be reached.*

- Stay with the child until an officer arrives
- The guardian gets a copy of everything you report

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody answered, so I am taking your child to the nearest police station." |

#### 10.3 Tile — Medical Info *(Blood group, allergies)*

Icon `medical` · tint `rose`

*The details a paramedic would ask for, without exposing identity.*

- Blood group O+ · allergic to penicillin
- Asthma inhaler carried in the front pocket

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your child is being treated — please share their medical history with the paramedic." |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 10.4 Tile — Ambulance *(Medical emergency)*

Icon `ambulance` · tint `peach`

*Get a medical team moving before anything else.*

- 108 is the free ambulance number in most states
- Guardians are alerted with your live pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 10.5 Tile — What To Do *(Step-by-step guide)*

Icon `guide` · tint `violet`

*A short script for the next five minutes.*

- Stay where you are — lost children are found where they stopped
- Notify the guardian, then wait in a visible, public spot
- Do not put the child in a vehicle; let the adult come to you

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Share where we are waiting** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 10.6 Tile — Stay Visible *(Wait in a safe spot)*

Icon `people` · tint `mint`

*Pick somewhere staffed and public, then hold there.*

- A shop counter, security desk or ticket window works best
- Send the pin so the guardian walks straight to you

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Share where we are waiting** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Find a staffed safe point** | `blue` | **maps** → Google Maps search: `police station near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "We are waiting in a safe public spot — here is where to find us." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Parent or Guardian |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Child is safe with me near... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | You are doing the right thing by stopping. What do you need? |

Suggested questions inside the assistant:

- No one is answering
- Should I move the child?
- The child is hurt
- What can I see about them?

---

## 11. `senior` — Senior

| | |
| --- | --- |
| Module | Kids & Seniors module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `senior` |
| Title | This senior citizen needs help |
| Subtitle | You've scanned a senior safety tag — stay with them |
| Sample tagline | Senior keychain · Age 74 · Blood group A+ |
| Default owner alert | "I have found your family member and I am with them right now. They are safe." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I have found your family member and I am with them right now. They are safe." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Family** | `people` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 11.1 Tile — Elderline 14567 *(Govt. helpline)*

Icon `helpline` · tint `sky`

*India’s national helpline for senior citizens, free and 24x7.*

- 14567 is toll-free from any phone, day or night
- Use it if no family member answers within a few minutes

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Elderline · 14567** | `primary` | **call** → dials `14567` (Elderline) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I have found your family member and I am with them. Please call back through RepiQR." |
| 3 | **Send where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 11.2 Tile — Medical Info *(Conditions & medicines)*

Icon `medical` · tint `rose`

*What a paramedic asks for, without exposing an address.*

- Blood group A+ · diabetic, on insulin twice a day
- On a blood thinner — tell any doctor before treatment
- Pacemaker fitted in 2019

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your family member is being treated — please share their medical history with the paramedic." |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 11.3 Tile — Ambulance *(Medical emergency)*

Icon `ambulance` · tint `peach`

*Get a medical team moving before anything else.*

- 108 is the free ambulance number in most states
- Family is alerted with your live pin at the same time

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 11.4 Tile — Seems Confused *(Memory loss guide)*

Icon `guide` · tint `violet`

*A short script for the next five minutes.*

- Speak slowly, use their name, do not argue with them
- Stay where you are — do not walk them to a new place
- Do not put them in a vehicle; let the family come to you

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the family now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Share where we are waiting** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 11.5 Tile — Nearest Police *(If nobody answers)*

Icon `police` · tint `blue`

*A station is a safe place to wait when calls go unanswered.*

- Stay with them until an officer takes over
- The family gets a copy of everything you report

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Emergency (all services) · 112** | `primary` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 2 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody answered, so I am taking your family member to the nearest police station." |

#### 11.6 Tile — Stay With Them *(Wait in a safe spot)*

Icon `people` · tint `mint`

*Pick somewhere staffed, shaded and public, then hold there.*

- A shop counter, pharmacy or clinic works best
- Send the pin so the family walks straight to you

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Share where we are waiting** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Find a staffed safe point** | `blue` | **maps** → Google Maps search: `pharmacy near me` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "We are waiting in a safe public spot — here is where to find us." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message the Family |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found near the temple gate, they are calm... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | You are doing the right thing by stopping. What do you need? |

Suggested questions inside the assistant:

- They seem confused
- Nobody is answering
- They have collapsed
- What can I see about them?

---

## 12. `wristband` — Wristband

| | |
| --- | --- |
| Module | Kids & Seniors module |
| Tone | `red` (red emergency hero) |
| Hero icon / beacon | `alert` / `band` |
| Title | This person needs medical help |
| Subtitle | You've scanned a medical ID wristband |
| Sample tagline | Wristband · Epilepsy · Blood group O− |
| Default owner alert | "I scanned the RepiQR medical wristband — the wearer needs help right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Get Help** | **notify** → SMS + RepiChat to owner: "I scanned the RepiQR medical wristband — the wearer needs help right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Contacts** | `people` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Request Ambulance** | `ambulance` | **call** → dials `108` (Ambulance) · via `public` |

### Quick-action tiles (6) and their buttons

#### 12.1 Tile — Ambulance *(Call 108 now)*

Icon `ambulance` · tint `rose`

*A medical team first, everything else after.*

- 108 is the free ambulance number in most states
- 112 reaches police, fire and ambulance together
- Contacts on this tag are alerted with your pin

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |
| 3 | **Send our exact location** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 12.2 Tile — Seizure First Aid *(What to do right now)*

Icon `guide` · tint `violet`

*The four things that matter while you wait.*

- Turn them on their side and cushion the head
- Never hold them down or put anything in the mouth
- Time it — past five minutes, call 108 immediately
- Stay until they are awake and know where they are

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |
| 3 | **Share where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 12.3 Tile — Medical ID *(Condition & medicines)*

Icon `medical` · tint `peach`

*What the wearer needs a stranger to know.*

- Blood group O− · epilepsy, on levetiracetam
- Allergic to penicillin — tell any doctor first
- Rescue medicine carried in the right jacket pocket

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "The wearer of this wristband is being treated — please share their medical history." |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 12.4 Tile — Nearest Hospital *(Get them seen)*

Icon `hospital` · tint `blue`

*When they can walk but should still be checked.*

- Emergency departments run 24x7 in every district
- Contacts are told which hospital you went to

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find a hospital near me** | `blue` | **maps** → Google Maps search: `hospital emergency near me` |
| 2 | **Call Ambulance · 108** | `primary` | **call** → dials `108` (Ambulance) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I am taking the wearer of this wristband to the nearest hospital." |

#### 12.5 Tile — Notify Contacts *(Family & doctor)*

Icon `people` · tint `mint`

*One tap reaches everyone stored on this band.*

- Push, SMS and WhatsApp go out together
- Your number is never shown to any of them

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the contacts now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 12.6 Tile — Health Helpline *(104 and 14416)*

Icon `helpline` · tint `sky`

*A doctor on the phone when it is not yet an ambulance.*

- 104 is the free state health advice line
- 14416 is Tele-MANAS, for a mental health crisis

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Health helpline · 104** | `primary` | **call** → dials `104` (Health helpline) · via `public` |
| 2 | **Call Tele-MANAS · 14416** | `ghost` | **call** → dials `14416` (Tele-MANAS) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I am with the wearer of this wristband and have called the health helpline." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Their Contacts |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. They had a seizure, now resting... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Stay calm and stay with them. What is happening? |

Suggested questions inside the assistant:

- They are having a seizure
- Should I give them medicine?
- They seem fine now
- What can I see about them?

---

## 13. `pet` — Pet

| | |
| --- | --- |
| Module | Luggage & Travel module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `paw` / `paw` |
| Title | You found someone's pet |
| Subtitle | Thanks for stopping — let's get them home |
| Sample tagline | Pet tag · Indie · 4 yrs · friendly |
| Default owner alert | "I have found your pet and they are safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I have found your pet and they are safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Nearest Vet** | `medical` | **maps** → Google Maps search: `veterinary clinic near me` |

### Quick-action tiles (6) and their buttons

#### 13.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*The owner gets a push, an SMS and a WhatsApp alert at once.*

- They see your pin, never your phone number
- Most owners reply within a couple of minutes

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found them** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 13.2 Tile — Nearest Vet *(If the pet is hurt)*

Icon `medical` · tint `rose`

*Injured or limping — a clinic comes first, paperwork later.*

- Treatment costs are settled by the owner in RepiQR
- The owner is told which clinic you went to

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find a vet near me** | `blue` | **maps** → Google Maps search: `veterinary clinic near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your pet is hurt — I am taking them to the nearest vet." |
| 3 | **Call Animal helpline · 1962** | `primary` | **call** → dials `1962` (Animal helpline) · via `public` |

#### 13.3 Tile — Animal Helpline *(Rescue on 1962)*

Icon `helpline` · tint `sky`

*Government animal ambulance and rescue line.*

- 1962 covers most Indian states for animal rescue
- Use it when the pet cannot be moved safely

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Animal helpline · 1962** | `primary` | **call** → dials `1962` (Animal helpline) · via `public` |
| 2 | **Send where the pet is** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your pet needs rescue help — I have called the animal helpline." |

#### 13.4 Tile — Pet Profile *(Name, diet, meds)*

Icon `note` · tint `violet`

*What this pet needs, in the owner’s own words.*

- Answers to "Indie" · food-motivated, no chicken
- On thyroid medicine every morning
- Nervous around other dogs — keep the leash short

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I have your pet. Anything I should know beyond the profile on the tag?" |
| 2 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 13.5 Tile — Food & Water *(Keep them calm)*

Icon `water` · tint `mint`

*Three things that settle a scared animal.*

- Water first, food only if the owner confirms the diet
- Sit at their level; do not chase or corner them
- Keep them leashed or in a closed room until pickup

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your pet is calm and with me. Where should we meet?" |
| 3 | **Share where we are** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 13.6 Tile — Shelter Drop *(If you cannot wait)*

Icon `box` · tint `cream`

*A registered shelter is a safe handover point.*

- The owner is told exactly which shelter you chose
- Shelters log the tag number so the pet is traceable

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find a shelter near me** | `blue` | **maps** → Google Maps search: `animal shelter near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I cannot wait any longer — I am leaving your pet at a registered shelter." |
| 3 | **Call Animal helpline · 1962** | `primary` | **call** → dials `1962` (Animal helpline) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Pet Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found near the park gate, she is calm... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for helping. What is the pet like right now? |

Suggested questions inside the assistant:

- The pet is scared
- The pet is injured
- Can I feed them?
- Nobody replied yet

---

## 14. `luggage` — Luggage

| | |
| --- | --- |
| Module | Luggage & Travel module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `bag` / `bag` |
| Title | You found someone's bag |
| Subtitle | Thanks for stopping — let's get it back to them |
| Sample tagline | Luggage tag · Cabin trolley · dark blue |
| Default owner alert | "I have found your bag and it is safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I have found your bag and it is safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Lost & Found** | `box` | **maps** → Google Maps search: `lost and found counter near me` |

### Quick-action tiles (6) and their buttons

#### 14.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*One tap tells the owner their bag has surfaced.*

- They see your pin, never your phone number
- The alert is timestamped in their RepiQR history

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found it** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 14.2 Tile — Lost & Found *(Nearest counter)*

Icon `box` · tint `cream`

*Airports, stations and malls all run a counter.*

- Hand it over and quote the tag code on the sticker
- The owner is told which counter holds the bag

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest counter** | `blue` | **maps** → Google Maps search: `lost and found counter near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I am handing your bag to the lost and found counter here." |
| 3 | **Share which terminal I am in** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 14.3 Tile — Airline Desk *(Checked baggage)*

Icon `plane` · tint `sky`

*Bags that came off a belt belong with the airline.*

- The baggage desk logs it against the flight
- RepiQR notifies the owner with the reference

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the baggage desk** | `blue` | **maps** → Google Maps search: `airline baggage service desk` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your bag is at the airline baggage desk here — please claim it with your flight number." |
| 3 | **Call RepiQR support · 1800 123 4567** | `ghost` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |

#### 14.4 Tile — Courier Return *(Free pickup)*

Icon `parcel` · tint `blue`

*A courier collects the bag from wherever you are.*

- Pickup and return shipping are paid by the owner
- You get a receipt for the handover

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Courier pickup · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Courier pickup) · via `partner` |
| 2 | **Send my pickup address** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I can hand your bag to a courier — send the pickup and I will keep it safe until then." |

#### 14.5 Tile — Nearest Police *(Hand over safely)*

Icon `police` · tint `violet`

*The safest handover when the owner is unreachable.*

- Stations log found property against the tag code
- The owner is told which station has it

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody replied, so I am depositing your bag at the nearest police station." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 14.6 Tile — Owner's Note *(Message left for you)*

Icon `note` · tint `mint`

*Left on the tag for whoever finds it.*

- "Thank you for stopping — there are medicines inside."
- "A reward is arranged through RepiQR, no cash needed."

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Reply to the owner** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Bag Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found at the airport carousel 4... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for picking it up. Where did you find the bag? |

Suggested questions inside the assistant:

- I am at an airport
- I cannot carry it around
- Can I open the bag?
- Is there a reward?

---

## 15. `travel` — Travel Tag

| | |
| --- | --- |
| Module | Luggage & Travel module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `plane` / `plane` |
| Title | You found someone's travel pouch |
| Subtitle | Documents inside — let’s get them back fast |
| Sample tagline | Travel tag · passport pouch · navy |
| Default owner alert | "I have found your travel pouch and it is safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I have found your travel pouch and it is safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Lost & Found** | `box` | **maps** → Google Maps search: `lost and found counter near me` |

### Quick-action tiles (6) and their buttons

#### 15.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*Someone mid-journey needs to hear this within minutes.*

- They see your pin, never your phone number
- The alert is timestamped in their RepiQR history

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found it** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 15.2 Tile — Documents Inside *(Passport & tickets)*

Icon `note` · tint `violet`

*Handle a document pouch differently from a bag.*

- Do not photograph or post the documents anywhere
- Hand it to a counter, never to an individual who claims it
- The owner may be standing at an immigration desk right now

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell the owner I have it** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Say exactly what I am holding** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 15.3 Tile — Airline Desk *(At the airport)*

Icon `plane` · tint `sky`

*Inside a terminal, the airline desk is the fastest route.*

- The desk logs it against the flight and the passenger
- RepiQR notifies the owner with the reference

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the baggage desk** | `blue` | **maps** → Google Maps search: `airline baggage service desk` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Your travel pouch is at the airline desk here — please claim it with your flight number." |
| 3 | **Call RepiQR support · 1800 123 4567** | `ghost` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |

#### 15.4 Tile — Tourist Helpline *(1363, 24x7)*

Icon `helpline` · tint `blue`

*For a traveller far from home and out of options.*

- 1363 is the national tourist helpline, free and multilingual
- 139 covers Indian Railways enquiries and lost property

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Tourist helpline · 1363** | `primary` | **call** → dials `1363` (Tourist helpline) · via `public` |
| 2 | **Call Railway helpline · 139** | `ghost` | **call** → dials `139` (Railway helpline) · via `public` |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I have your travel pouch and have contacted the tourist helpline for you." |

#### 15.5 Tile — Nearest Police *(Hand over safely)*

Icon `police` · tint `mint`

*The safest handover for documents when nobody replies.*

- Stations log found documents against the tag code
- The owner is told which station holds the pouch

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody replied, so I am depositing your travel pouch at the nearest police station." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 15.6 Tile — Courier Return *(Owner pays pickup)*

Icon `parcel` · tint `cream`

*A courier collects the pouch from wherever you are.*

- Pickup and return shipping are paid by the owner
- You get a receipt for the handover

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Courier pickup · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Courier pickup) · via `partner` |
| 2 | **Send my pickup address** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I can hand your travel pouch to a courier — send the pickup and I will keep it safe until then." |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Pouch Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found at the station, platform 3... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for picking it up. Where did you find the pouch? |

Suggested questions inside the assistant:

- I am at an airport
- Someone says it is theirs
- They are a foreign tourist
- Can I open the pouch?

---

## 16. `wallet` — Wallet

| | |
| --- | --- |
| Module | Luggage & Travel module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `wallet` / `wallet` |
| Title | You found someone's wallet |
| Subtitle | Cards inside — the owner is probably panicking |
| Sample tagline | Wallet tag · brown leather · 4 cards |
| Default owner alert | "I have found your wallet and it is safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I have found your wallet and it is safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Fraud Helpline** | `card` | **call** → dials `1930` (Cyber fraud helpline) · via `public` |

### Quick-action tiles (6) and their buttons

#### 16.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*The fastest way to stop someone cancelling their whole day.*

- They see your pin, never your phone number
- Push, SMS and WhatsApp go out together

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner now** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found it** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 16.2 Tile — Block the Cards *(Freeze first, collect later)*

Icon `card` · tint `rose`

*Tell them to freeze the cards even though the wallet is safe.*

- Every bank app has an instant freeze that is reversible
- Freezing costs nothing and is undone on collection
- Never read the card numbers out to anyone, owner included

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Tell them to freeze the cards** | `wa` | **notify** → SMS + RepiChat to owner: "Your wallet is safe with me — freeze your cards in your bank app anyway until you have it back." |
| 2 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 16.3 Tile — Fraud Helpline *(Cyber crime 1930)*

Icon `shield` · tint `violet`

*If money has already moved, the first hour matters most.*

- 1930 is the national cyber and financial fraud helpline
- Reporting inside 24 hours is what makes a reversal possible

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Cyber fraud helpline · 1930** | `primary` | **call** → dials `1930` (Cyber fraud helpline) · via `public` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "There may already be fraud on your cards — report it on 1930 straight away." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 16.4 Tile — Nearest Police *(Hand over safely)*

Icon `police` · tint `blue`

*A wallet with cash inside is safest logged at a station.*

- Found property is recorded against the tag code
- The owner is told which station holds the wallet

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody replied, so I am depositing your wallet at the nearest police station." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 16.5 Tile — Courier Return *(Owner pays pickup)*

Icon `parcel` · tint `cream`

*A courier collects the wallet from wherever you are.*

- Pickup and shipping are paid by the owner
- You get a receipt for the handover

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Courier pickup · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Courier pickup) · via `partner` |
| 2 | **Send my pickup address** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I can hand your wallet to a courier — send the pickup and I will keep it safe." |

#### 16.6 Tile — Owner’s Note *(Message left for you)*

Icon `note` · tint `mint`

*Left on the tag for whoever finds it.*

- "Thank you for stopping — please just message me here."
- "A reward is arranged through RepiQR, no cash needed."

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Reply on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Reply to the owner** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Wallet Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found on the seat at the bus stand... |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for stopping. Where did you find the wallet? |

Suggested questions inside the assistant:

- Should they block the cards?
- There is cash inside
- Money has already been spent
- Is there a reward?

---

## 17. `keychain` — Keychain

| | |
| --- | --- |
| Module | Luggage & Travel module |
| Tone | `calm` (amber calm hero) |
| Hero icon / beacon | `key` / `key` |
| Title | You found someone's keys |
| Subtitle | Thanks for stopping — let's get them back safely |
| Sample tagline | Keychain tag · 3 keys · blue fob |
| Default owner alert | "I have found your keys and they are safe with me right now." |

### Hero CTA (1 button)

| Button | Action |
| --- | --- |
| **Notify the owner** | **notify** → SMS + RepiChat to owner: "I have found your keys and they are safe with me right now." |

### Mini stat buttons (3)

| # | Button | Icon | Action |
| --- | --- | --- | --- |
| 1 | **Share Live Location** | `pin` | **pin** → shares live GPS with owner + emergency contacts |
| 2 | **Notify Owner** | `bell` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 3 | **Nearest Drop Point** | `box` | **maps** → Google Maps search: `safe drop point near me` |

### Quick-action tiles (6) and their buttons

#### 17.1 Tile — Notify Owner *(Instant alert)*

Icon `bell` · tint `amber`

*The owner learns their keys are found before they panic.*

- They see your pin, never your phone number
- Alerts go out by push, SMS and WhatsApp together

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Attach where I found them** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Write a message instead** | `ghost` | **write** → focuses the free-text composer |

#### 17.2 Tile — Drop Point *(Nearest safe spot)*

Icon `box` · tint `cream`

*Partner shops and desks hold keys until collection.*

- Quote the tag code when you hand them over
- The owner is told the exact drop point

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find a drop point near me** | `blue` | **maps** → Google Maps search: `safe drop point near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I am leaving your keys at a RepiQR drop point nearby." |
| 3 | **Share where I am** | `blue` | **pin** → shares live GPS with owner + emergency contacts |

#### 17.3 Tile — Nearest Police *(Hand over safely)*

Icon `police` · tint `blue`

*Always available, always logged.*

- Found property is recorded against the tag code
- The owner is told which station holds the keys

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Find the nearest police station** | `blue` | **maps** → Google Maps search: `police station near me` |
| 2 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "Nobody replied, so I am depositing your keys at the nearest police station." |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

#### 17.4 Tile — Courier Return *(Free pickup)*

Icon `parcel` · tint `sky`

*A courier collects the keys from you.*

- Pickup and shipping are paid by the owner
- You get a receipt for the handover

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call Courier pickup · 1800 200 4004** | `primary` | **call** → dials `1800 200 4004` (Courier pickup) · via `partner` |
| 2 | **Send my pickup address** | `blue` | **pin** → shares live GPS with owner + emergency contacts |
| 3 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: "I can hand your keys to a courier — send the pickup and I will keep them safe." |

#### 17.5 Tile — Owner's Note *(Message left for you)*

Icon `note` · tint `violet`

*Left on the tag for whoever finds it.*

- "Thank you — the house key is on this ring, please do not delay."
- "A reward is arranged through RepiQR, no cash needed."

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Alert the owner on WhatsApp** | `wa` | **notify** → SMS + RepiChat to owner: *(uses the category default alert)* |
| 2 | **Reply to the owner** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Ask the RepiQR assistant** | `ghost` | **ask** → opens the RepiQR assistant |

#### 17.6 Tile — Report Issue *(Something looks wrong)*

Icon `flag` · tint `rose`

*Damaged tag, wrong details or a suspicious situation.*

- Support reviews the tag and contacts the owner
- Use 112 instead if anyone is in danger

| # | Button label | Style | Action |
| --- | --- | --- | --- |
| 1 | **Call RepiQR support · 1800 123 4567** | `primary` | **call** → dials `1800 123 4567` (RepiQR support) · via `support` |
| 2 | **Describe the problem** | `ghost` | **write** → focuses the free-text composer |
| 3 | **Call Emergency (all services) · 112** | `ghost` | **call** → dials `112` (Emergency (all services)) · via `public` |

### Message-the-owner card

| | |
| --- | --- |
| Heading | Message Key Owner |
| Sub-heading | Send a direct alert via WhatsApp |
| Input placeholder | e.g. Found near Thangadh bus stand |
| Send button | posts the typed text as a `contact_owner` alert (SMS to owner) and opens RepiChat |

### Assistant button

| Button | Greeting |
| --- | --- |
| **Ask the RepiQR Assistant** | Thanks for stopping. Where did you find the keys? |

Suggested questions inside the assistant:

- I cannot wait here
- Can they see my number?
- What if it is a house key?
- Is there a reward?

---

## Appendix A — every distinct button label, alphabetical

113 distinct labels.

| Button label | Kind | Used in |
| --- | --- | --- |
| Add a note about the parcel | `write` | home/Delivery, door/Delivery, apartment/Delivery |
| Add what you can see | `write` | bicycle/Abandoned Cycle |
| Alert security | `notify` | apartment/Security Alert |
| Alert security now | `notify` | apartment/Trapped in Lift |
| Alert the contacts now | `notify` | wristband/Notify Contacts |
| Alert the family now | `notify` | helmet/Notify Family, senior/Seems Confused |
| Alert the owner now | `notify` | bike/Theft Alert, bicycle/Theft Alert, nfc/Notify Owner, travel/Notify Owner, wallet/Notify Owner |
| Alert the owner on WhatsApp | `notify` | car/Towing, car/Mechanic, car/Puncture, car/Fuel Delivery, car/Accident Report, bike/Bike Towing, bike/Mechanic, bike/Puncture, bike/Fuel Delivery, bicycle/Roadside Fix, bicycle/Puncture, helmet/Medical Info, helmet/Accident Report, home/Fire Emergency, home/Gas Leak, door/Emergency, apartment/Fire Emergency, apartment/Gas Leak, employee/Company Desk, employee/Drop It Off, employee/Medical Emergency, employee/Nearest Police, nfc/Return the Item, child/Childline 1098, child/Nearest Police, child/Medical Info, child/What To Do, child/Stay Visible, senior/Elderline 14567, senior/Medical Info, senior/Nearest Police, senior/Stay With Them, wristband/Medical ID, wristband/Nearest Hospital, wristband/Health Helpline, pet/Notify Owner, pet/Nearest Vet, pet/Animal Helpline, pet/Pet Profile, pet/Food & Water, pet/Shelter Drop, luggage/Notify Owner, luggage/Lost & Found, luggage/Airline Desk, luggage/Courier Return, luggage/Nearest Police, luggage/Owner's Note, travel/Airline Desk, travel/Tourist Helpline, travel/Nearest Police, travel/Courier Return, wallet/Fraud Helpline, wallet/Nearest Police, wallet/Courier Return, keychain/Notify Owner, keychain/Drop Point, keychain/Nearest Police, keychain/Courier Return, keychain/Owner's Note |
| Alert the resident | `notify` | door/Leak / Damage |
| Alert the residents | `notify` | home/Water Leak, home/Security Alert |
| Alert them now | `notify` | employee/Notify Employer |
| Announce me at the door | `notify` | door/Visitor |
| Announce me at the gate | `notify` | home/Visitor, apartment/Visitor / Guest |
| Ask the owner to move it | `notify` | car/Wrong Parking, bicycle/Blocking a Path |
| Ask the RepiQR assistant | `ask` | helmet/Do Not Remove, helmet/Medical Info, home/Visitor, door/Delivery, door/Visitor, apartment/Visitor / Guest, employee/Company Desk, nfc/Owner’s Note, nfc/How This Works, child/Medical Info, child/What To Do, senior/Medical Info, senior/Seems Confused, wristband/Seizure First Aid, wristband/Medical ID, pet/Pet Profile, pet/Food & Water, luggage/Owner's Note, travel/Documents Inside, wallet/Block the Cards, wallet/Owner’s Note, keychain/Owner's Note |
| Ask the rider to move it | `notify` | bike/Parking Issue |
| Ask them to block the card | `notify` | employee/Block Access |
| Attach the exact spot | `pin` | car/Wrong Parking, bike/Parking Issue, bicycle/Blocking a Path |
| Attach where I am | `pin` | nfc/Notify Owner |
| Attach where I found it | `pin` | employee/Notify Employer, luggage/Notify Owner, travel/Notify Owner, wallet/Notify Owner |
| Attach where I found them | `pin` | pet/Notify Owner, keychain/Notify Owner |
| Attach where we are | `pin` | helmet/Notify Family, wristband/Notify Contacts |
| Call Ambulance · 108 | `call` | bicycle/Rider Down, helmet/Ambulance, helmet/Do Not Remove, helmet/Medical Info, employee/Medical Emergency, nfc/Emergency, child/Medical Info, child/Ambulance, senior/Medical Info, senior/Ambulance, wristband/Ambulance, wristband/Seizure First Aid, wristband/Medical ID, wristband/Nearest Hospital |
| Call Animal helpline · 1962 | `call` | pet/Nearest Vet, pet/Animal Helpline, pet/Shelter Drop |
| Call Bike towing · 1800 200 4004 | `call` | bike/Bike Towing |
| Call Childline · 1098 | `call` | child/Childline 1098 |
| Call Company reception · 1800 123 4567 | `call` | employee/Company Desk |
| Call Courier pickup · 1800 200 4004 | `call` | nfc/Return the Item, luggage/Courier Return, travel/Courier Return, wallet/Courier Return, keychain/Courier Return |
| Call Cyber fraud helpline · 1930 | `call` | wallet/Fraud Helpline |
| Call Cycle mechanic · 1800 200 4004 | `call` | bicycle/Roadside Fix |
| Call Elderline · 14567 | `call` | senior/Elderline 14567 |
| Call Emergency (all services) · 112 | `call` | car/Accident Report, bike/Theft Alert, bicycle/Rider Down, bicycle/Theft Alert, helmet/Ambulance, helmet/Accident Report, home/Fire Emergency, home/Gas Leak, home/Security Alert, door/Emergency, door/Report Issue, apartment/Fire Emergency, apartment/Trapped in Lift, apartment/Gas Leak, apartment/Security Alert, employee/Nearest Police, nfc/Emergency, nfc/Report Misuse, child/Nearest Police, child/Ambulance, senior/Ambulance, senior/Nearest Police, wristband/Ambulance, luggage/Nearest Police, travel/Nearest Police, wallet/Fraud Helpline, wallet/Nearest Police, keychain/Nearest Police, keychain/Report Issue |
| Call Fire services · 101 | `call` | home/Fire Emergency, door/Emergency, apartment/Fire Emergency |
| Call Fuel delivery · 1800 200 4004 | `call` | car/Fuel Delivery, bike/Fuel Delivery |
| Call Health helpline · 104 | `call` | wristband/Health Helpline |
| Call Lift technician · 1800 200 4004 | `call` | apartment/Trapped in Lift |
| Call LPG / gas leak helpline · 1906 | `call` | home/Gas Leak, apartment/Gas Leak |
| Call Mechanic desk · 1800 200 4004 | `call` | car/Mechanic, bike/Mechanic |
| Call Plumber on call · 1800 200 4004 | `call` | home/Water Leak, door/Leak / Damage |
| Call Police · 100 | `call` | car/Accident Report, helmet/Accident Report, home/Security Alert, apartment/Security Alert |
| Call Puncture help · 1800 200 4004 | `call` | bike/Puncture, bicycle/Puncture |
| Call Railway helpline · 139 | `call` | travel/Tourist Helpline |
| Call RepiQR support · 1800 123 4567 | `call` | bicycle/Abandoned Cycle, door/Report Issue, employee/Block Access, nfc/Report Misuse, nfc/How This Works, luggage/Airline Desk, travel/Airline Desk, keychain/Report Issue |
| Call Tele-MANAS · 14416 | `call` | wristband/Health Helpline |
| Call Tourist helpline · 1363 | `call` | travel/Tourist Helpline |
| Call Towing partner · 1800 200 4004 | `call` | car/Towing |
| Call Tyre assistance · 1800 200 4004 | `call` | car/Puncture |
| Describe the problem | `write` | door/Report Issue, nfc/Report Misuse, keychain/Report Issue |
| Find a cycle shop nearby | `maps` | bicycle/Roadside Fix |
| Find a drop point near me | `maps` | nfc/Return the Item, keychain/Drop Point |
| Find a hospital near me | `maps` | wristband/Nearest Hospital |
| Find a puncture shop nearby | `maps` | bicycle/Puncture |
| Find a shelter near me | `maps` | pet/Shelter Drop |
| Find a staffed safe point | `maps` | child/Stay Visible, senior/Stay With Them |
| Find a tyre shop nearby | `maps` | car/Puncture |
| Find a vet near me | `maps` | pet/Nearest Vet |
| Find garages near me | `maps` | car/Mechanic |
| Find mechanics near me | `maps` | bike/Mechanic |
| Find puncture shops nearby | `maps` | bike/Puncture |
| Find the baggage desk | `maps` | luggage/Airline Desk, travel/Airline Desk |
| Find the nearest counter | `maps` | employee/Drop It Off, luggage/Lost & Found |
| Find the nearest police station | `maps` | helmet/Helmet Found, employee/Nearest Police, child/Nearest Police, senior/Nearest Police, luggage/Nearest Police, travel/Nearest Police, wallet/Nearest Police, keychain/Nearest Police |
| Fraud Helpline | `call` | wallet/mini |
| Get Help | `notify` | car/hero, bike/hero, bicycle/hero, helmet/hero, home/hero, apartment/hero, child/hero, senior/hero, wristband/hero |
| Leave a Parcel note | `write` | door/mini |
| Lost & Found | `maps` | luggage/mini, travel/mini |
| Message the owner | `notify` | nfc/How This Works |
| Nearest Drop Point | `maps` | employee/mini, keychain/mini |
| Nearest Vet | `maps` | pet/mini |
| Notify Contacts | `notify` | car/mini, bike/mini, bicycle/mini, wristband/mini |
| Notify Employer | `notify` | employee/mini |
| Notify Family | `notify` | helmet/mini, senior/mini |
| Notify Guardians | `notify` | child/mini |
| Notify Owner | `notify` | nfc/mini, pet/mini, luggage/mini, travel/mini, wallet/mini, keychain/mini |
| Notify Resident | `notify` | door/mini |
| Notify Residents | `notify` | home/mini |
| Notify Society | `notify` | apartment/mini |
| Notify the employer | `notify` | employee/hero |
| Notify the owner | `notify` | nfc/hero, pet/hero, luggage/hero, travel/hero, wallet/hero, keychain/hero |
| Notify the resident | `notify` | door/hero |
| Reply on WhatsApp | `notify` | nfc/Owner’s Note, wallet/Owner’s Note |
| Reply to the owner | `write` | luggage/Owner's Note, wallet/Owner’s Note, keychain/Owner's Note |
| Request Ambulance | `call` | car/mini, bike/mini, bicycle/mini, helmet/mini, home/mini, apartment/mini, child/mini, senior/mini, wristband/mini |
| Ring the resident now | `notify` | door/Knock Digitally |
| Say exactly what I am holding | `write` | travel/Documents Inside |
| Say where I found it | `write` | helmet/Helmet Found |
| Say who I am | `write` | home/Visitor, door/Knock Digitally, door/Visitor, apartment/Visitor / Guest |
| Send my pickup address | `pin` | luggage/Courier Return, travel/Courier Return, wallet/Courier Return, keychain/Courier Return |
| Send our exact location | `pin` | bicycle/Rider Down, helmet/Ambulance, employee/Medical Emergency, nfc/Emergency, child/Ambulance, senior/Ambulance, wristband/Ambulance |
| Send where the bike is | `pin` | bike/Theft Alert, bike/Fuel Delivery |
| Send where the car is | `pin` | car/Fuel Delivery |
| Send where the cycle is | `pin` | bicycle/Theft Alert |
| Send where the pet is | `pin` | pet/Animal Helpline |
| Send where we are | `pin` | child/Childline 1098, senior/Elderline 14567 |
| Share Live Location | `pin` | car/mini, bike/mini, bicycle/mini, helmet/mini, home/mini, door/mini, apartment/mini, employee/mini, nfc/mini, child/mini, senior/mini, wristband/mini, pet/mini, luggage/mini, travel/mini, wallet/mini, keychain/mini |
| Share my live location | `pin` | car/Towing, bike/Bike Towing |
| Share that I am at the door | `pin` | door/Knock Digitally |
| Share where I am | `pin` | keychain/Drop Point |
| Share where I am standing | `pin` | home/Delivery |
| Share where we are | `pin` | helmet/Do Not Remove, wristband/Seizure First Aid, pet/Food & Water |
| Share where we are waiting | `pin` | child/What To Do, child/Stay Visible, senior/Seems Confused, senior/Stay With Them |
| Share which building I am in | `pin` | employee/Drop It Off |
| Share which gate I am at | `pin` | apartment/Delivery |
| Share which terminal I am in | `pin` | luggage/Lost & Found |
| Tell the flat I am here | `notify` | apartment/Delivery |
| Tell the owner I have it | `notify` | helmet/Helmet Found, travel/Documents Inside |
| Tell the owner it is here | `notify` | bicycle/Abandoned Cycle |
| Tell the resident I am here | `notify` | door/Delivery |
| Tell the residents I am here | `notify` | home/Delivery |
| Tell them to freeze the cards | `notify` | wallet/Block the Cards |
| Write a Message | `write` | nfc/mini |
| Write a message instead | `write` | car/Wrong Parking, bike/Parking Issue, bicycle/Blocking a Path, helmet/Notify Family, home/Water Leak, door/Leak / Damage, employee/Notify Employer, employee/Block Access, nfc/Notify Owner, wristband/Notify Contacts, pet/Notify Owner, pet/Pet Profile, luggage/Notify Owner, travel/Notify Owner, wallet/Notify Owner, wallet/Block the Cards, keychain/Notify Owner |
| Write a reply | `write` | nfc/Owner’s Note |

## Appendix B — every phone number referenced

| Number | Who | via | Real? | Used in |
| --- | --- | --- | --- | --- |
| `1800 200 4004` | Towing partner | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | car/Towing |
| `1800 200 4004` | Mechanic desk | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | car/Mechanic, bike/Mechanic |
| `1800 200 4004` | Tyre assistance | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | car/Puncture |
| `1800 200 4004` | Fuel delivery | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | car/Fuel Delivery, bike/Fuel Delivery |
| `1800 200 4004` | Bike towing | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | bike/Bike Towing |
| `1800 200 4004` | Puncture help | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | bike/Puncture, bicycle/Puncture |
| `1800 200 4004` | Cycle mechanic | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | bicycle/Roadside Fix |
| `1800 200 4004` | Plumber on call | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | home/Water Leak, door/Leak / Damage |
| `1800 200 4004` | Lift technician | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | apartment/Trapped in Lift |
| `1800 200 4004` | Courier pickup | `partner` | no — placeholder, replaced by the admin-configured provider at runtime | nfc/Return the Item, luggage/Courier Return, travel/Courier Return, wallet/Courier Return, keychain/Courier Return |
| `100` | Police | `public` | yes — dialled as printed | car/Accident Report, helmet/Accident Report, home/Security Alert, apartment/Security Alert |
| `101` | Fire services | `public` | yes — dialled as printed | home/Fire Emergency, door/Emergency, apartment/Fire Emergency |
| `104` | Health helpline | `public` | yes — dialled as printed | wristband/Health Helpline |
| `108` | Ambulance | `public` | yes — dialled as printed | car/mini, bike/mini, bicycle/mini, bicycle/Rider Down, helmet/mini, helmet/Ambulance, helmet/Do Not Remove, helmet/Medical Info, home/mini, apartment/mini, employee/Medical Emergency, nfc/Emergency, child/mini, child/Medical Info, child/Ambulance, senior/mini, senior/Medical Info, senior/Ambulance, wristband/mini, wristband/Ambulance, wristband/Seizure First Aid, wristband/Medical ID, wristband/Nearest Hospital |
| `1098` | Childline | `public` | yes — dialled as printed | child/Childline 1098 |
| `112` | Emergency (all services) | `public` | yes — dialled as printed | car/Accident Report, bike/Theft Alert, bicycle/Rider Down, bicycle/Theft Alert, helmet/Ambulance, helmet/Accident Report, home/Fire Emergency, home/Gas Leak, home/Security Alert, door/Emergency, door/Report Issue, apartment/Fire Emergency, apartment/Trapped in Lift, apartment/Gas Leak, apartment/Security Alert, employee/Nearest Police, nfc/Emergency, nfc/Report Misuse, child/Nearest Police, child/Ambulance, senior/Ambulance, senior/Nearest Police, wristband/Ambulance, luggage/Nearest Police, travel/Nearest Police, wallet/Fraud Helpline, wallet/Nearest Police, keychain/Nearest Police, keychain/Report Issue |
| `1363` | Tourist helpline | `public` | yes — dialled as printed | travel/Tourist Helpline |
| `139` | Railway helpline | `public` | yes — dialled as printed | travel/Tourist Helpline |
| `14416` | Tele-MANAS | `public` | yes — dialled as printed | wristband/Health Helpline |
| `14567` | Elderline | `public` | yes — dialled as printed | senior/Elderline 14567 |
| `1906` | LPG / gas leak helpline | `public` | yes — dialled as printed | home/Gas Leak, apartment/Gas Leak |
| `1930` | Cyber fraud helpline | `public` | yes — dialled as printed | wallet/mini, wallet/Fraud Helpline |
| `1962` | Animal helpline | `public` | yes — dialled as printed | pet/Nearest Vet, pet/Animal Helpline, pet/Shelter Drop |
| `1800 123 4567` | RepiQR support | `support` | no — placeholder, replaced by the admin-configured provider at runtime | bicycle/Abandoned Cycle, door/Report Issue, employee/Block Access, nfc/Report Misuse, nfc/How This Works, luggage/Airline Desk, travel/Airline Desk, keychain/Report Issue |
| `1800 123 4567` | Company reception | `support` | no — placeholder, replaced by the admin-configured provider at runtime | employee/Company Desk |

## Appendix C — counts per category

| Category | Buttons total | call/public | call/partner+support | notify | maps | pin | write | ask |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `car` | 23 | 3 | 4 | 8 | 2 | 4 | 1 | 1 |
| `bike` | 23 | 2 | 4 | 8 | 2 | 5 | 1 | 1 |
| `bicycle` | 23 | 4 | 3 | 7 | 2 | 4 | 2 | 1 |
| `helmet` | 23 | 7 | 0 | 6 | 1 | 4 | 2 | 3 |
| `home` | 23 | 7 | 1 | 8 | 0 | 2 | 3 | 2 |
| `door` | 23 | 3 | 2 | 7 | 0 | 2 | 6 | 3 |
| `apartment` | 23 | 8 | 1 | 8 | 0 | 2 | 2 | 2 |
| `employee` | 23 | 2 | 2 | 8 | 3 | 4 | 2 | 2 |
| `nfc` | 23 | 3 | 3 | 6 | 1 | 3 | 4 | 3 |
| `child` | 23 | 6 | 0 | 7 | 2 | 5 | 0 | 3 |
| `senior` | 23 | 6 | 0 | 7 | 2 | 5 | 0 | 3 |
| `wristband` | 23 | 8 | 0 | 6 | 1 | 4 | 1 | 3 |
| `pet` | 23 | 3 | 0 | 8 | 3 | 4 | 2 | 3 |
| `luggage` | 23 | 1 | 2 | 8 | 4 | 4 | 2 | 2 |
| `travel` | 23 | 3 | 2 | 8 | 3 | 3 | 2 | 2 |
| `wallet` | 23 | 4 | 1 | 8 | 1 | 3 | 3 | 3 |
| `keychain` | 23 | 2 | 2 | 7 | 3 | 4 | 3 | 2 |
| **all** | **391** | 72 | 27 | 125 | 30 | 62 | 36 | 39 |

## Appendix D — the bespoke `car` / `bike` screen (ScanPage.tsx)

`car` and `bike` are in `BESPOKE_CATEGORIES`, so their entries in sections 1 and 2
above are **dead data**. What a visitor actually sees is hard-coded JSX in
`src/components/scan/ScanPage.tsx` (lines ~1718–2730). Both categories share one screen —
there is no bike-specific copy. Extracted by hand; re-check against the source if it moves.

### D.1 Main menu (`activeSubMenu === "none"`)

Red hero card — title "This is Emergency or an accident", sub "We've detected an emergency or accident".

| Element | Type | Action |
| --- | --- | --- |
| **Share Live / Location** | ⚠️ static `<div>`, **not a button** | none — in `CategoryScanView` the same three are real buttons |
| **Notify / Contacts** | ⚠️ static `<div>`, **not a button** | none |
| **Request / Ambulance** | ⚠️ static `<div>`, **not a button** | none |
| **Get Help** | button (white pill) | opens the `emergency-main` sub-menu — ⚠️ does **not** send an alert, unlike the `CategoryScanView` hero CTA |

Quick Actions grid — 6 tiles, each only opens a sub-menu (no alert fires on the tile itself):

| # | Tile | Sub-label | Opens |
| --- | --- | --- | --- |
| 1 | **Tow Truck** | Roadside recovery | `towing` |
| 2 | **Mechanic** | On-site repair | `mechanical` |
| 3 | **Parking Issue** | first admin *Parking* helpline label, else "Blocking path" | `parking` |
| 4 | **Flat Tyre** | Tyre assistance | `flat-tire` |
| 5 | **Theft Alert** | first admin *Theft* helpline label, else "Report and alert" | `theft` |
| 6 | **Headlights** | first admin *Headlights* helpline label, else "are on" | `headlights` |

Below the grid:

| Button | Action |
| --- | --- |
| **RapiQR AI Assistant** (CHAT) | opens the assistant sheet |
| **Message Owner** | `openChatWithMessage("Hi, I scanned your vehicle's RapiQR code and need to contact you.")` — opens RepiChat and sends that line. **No SMS fan-out**, despite the card copy saying "The owner receives an SMS alert automatically" (the owner is SMS'd by the chat backend on first message instead). |
| *You're Protected / 24/7 Support strip* | ⚠️ static, not buttons |

Plus a floating FAB **Ask Assistant** (bottom-right, present for every category on the emergency phase).

### D.2 `emergency-main` — "Emergency Options"

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| **Request Ambulance** (one row per admin *Ambulance* helpline) | ⚠️ **disabled — "Soon"**. Empty state: "No ambulance provider configured". |
| **Call Family Members** | opens the `family` sub-menu (only rendered when family contacts exist) |
| **Share Location** | `handleShareLocation()` — opens Maps **and** posts an `emergency` alert to owner + emergency contacts |

### D.3 `family` — "Family Contacts"

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| **Share My Live Location** | `handleShareLocation()` |
| Owner's emergency-contact rows | number hidden, ⚠️ **disabled — "Soon"** |
| Admin *Family* helpline rows | label + phone shown, ⚠️ **disabled — "Soon"** |

### D.4 Service sub-menus — all six share one shape

Each is: Back · a tinted card with one RepiChat button · a masked "Vehicle Owner Call" row (disabled, "Soon") · the admin helplines for that category (label + phone, disabled, "Soon").

| Sub-menu | Card heading | Button label | `sendQuickIssueAlert` type | Message sent |
| --- | --- | --- | --- | --- |
| `towing` | Towing / Breakdown Recovery? | **Alert Owner via RepiChat** | `Towing Service Needed` | "Roadside breakdown / towing assistance requested for your vehicle." |
| `mechanical` | Need Mechanic Assistance? | **Alert Owner via RepiChat** | `Mechanic Needed` | "Vehicle mechanical issue reported. Mechanic assistance requested." |
| `parking` | Vehicle Blocking Path? | **Alert Owner via RepiChat** | `Parking Issue` | "Hi, your vehicle is blocking a path/driveway. Please move it as soon as possible." |
| `flat-tire` | Flat Tyre Detected? | **Alert Owner via RepiChat** | `Flat Tyre` | "Hi, noticed a flat tyre on your vehicle. Please check it." |
| `theft` | Suspicious Activity / Tampering? | **Send Emergency RepiChat Alert** | `Theft Alert` | "EMERGENCY: Someone reported suspicious activity or potential theft regarding your vehicle." |
| `headlights` | Headlights Left On? | **Alert Owner via RepiChat** | `Headlights On` | "Hi, your vehicle's headlights are left turned on. Please check them." |

Admin helpline category read by each: `towing`→Towing, `mechanical`→Mechanic, `parking`→Parking,
`flat-tire`→**Flat Tire** (note the US spelling in the admin list vs. "Tyre" in the UI copy),
`theft`→Theft, `headlights`→Headlights.

`sendQuickIssueAlert` posts a backend alert (SMS fan-out to owner + emergency contacts,
prefixed `RapiQR Alert: <type>` with the vehicle and a Maps pin) **and** opens RepiChat.

`flat-tire` has two extra buttons: **Take Photo** and **Upload Picture** (then **Change Photo**).
⚠️ The photo is only held in component state for preview — it is never attached to the alert or uploaded.

### D.5 `medical` — "Medical Options" (⚠️ dead code)

The block exists but **nothing sets `activeSubMenu` to `"medical"`**, so it is unreachable.

| Button | Action |
| --- | --- |
| **Back** | returns to main menu |
| Admin *Ambulance* helpline rows | ⚠️ disabled — "Soon" |
| **First Aid Guide** | `alert()` popup with static first-aid text |
| **Nearby Hospital** | Google Maps search for hospitals around the visitor |

### D.6 Gaps vs. `CategoryScanView`

1. The three hero mini-stats are inert here, real buttons everywhere else.
2. **Get Help** only navigates; the variant hero CTA sends the owner alert.
3. Every call button on this screen is **disabled ("Soon")** — the Cloudshope masked-call bridge is wired up in `openMaskedCall`/`fetchMaskedCallNumber` but nothing on the car screen calls it.
4. Admin helpline numbers are printed in plain text here; `CategoryScanView` never shows a partner number, it only dials the resolved one.
5. The flat-tyre photo is captured but discarded.

### D.7 Admin helpline categories (Communication page)

`Ambulance` · `Towing` · `Mechanic` · `Flat Tire` · `Battery` · `Fuel` · `Parking` · `Police` · `Theft` · `Headlights` · `Family`

⚠️ `Battery`, `Fuel` and `Police` can be configured by the admin but no scan screen currently reads them.

