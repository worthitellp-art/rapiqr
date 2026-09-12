/**
 * Category scan-page variants — one entry per sticker category the admin can
 * mint a QR for. Generated from the `repiqr-scan-page-variants.html` prototype,
 * which is the design source of truth for the copy, the six quick-action tiles
 * and the buttons inside each tile's sheet.
 *
 * The data is deliberately declarative: every button is a `VariantAction`, and
 * `CategoryScanView` is what turns one into a real dial / RepiChat alert /
 * Maps search / GPS share. Adding a category here gives it a working scan page
 * without touching the renderer.
 */

import type { ProductCategory } from "../../types";

/** Where a phone number should be routed. */
export type CallVia =
  | "public"    /* 108, 112, 101 ... dialled straight from the handset */
  | "partner"   /* admin-configured service provider — masked call bridge */
  | "support";  /* the RepiQR support desk — masked call bridge */

export type VariantAction =
  | { kind: "call"; number: string; who: string; via: CallVia }
  | { kind: "notify"; text?: string }   /* alert the owner (SMS fan-out + RepiChat) */
  | { kind: "maps"; query: string }     /* nearby search around the visitor */
  | { kind: "pin" }                     /* share live GPS with the owner */
  | { kind: "write" }                   /* open the free-text composer */
  | { kind: "ask" };                    /* open the assistant */

export type ActionStyle = "primary" | "wa" | "blue" | "ghost";
export type TileTint = "rose" | "blue" | "cream" | "violet" | "amber" | "sky" | "mint" | "peach";
export type Tone = "red" | "calm";

export interface VariantButton {
  label: string;
  style: ActionStyle;
  action: VariantAction;
}

/** One of the three stats under the hero headline. */
export interface VariantMini {
  icon: string;
  line1: string;
  line2: string;
  action: VariantAction;
}

/** One of the six quick-action tiles, plus the sheet it opens. */
export interface VariantTile {
  icon: string;
  title: string;
  sub: string;
  tint: TileTint;
  lead: string;
  bullets: string[];
  actions: VariantButton[];
}

export interface CategoryVariant {
  label: string;
  module: string;
  tone: Tone;
  heroIcon: string;
  beacon: string;
  title: string;
  sub: string;
  tagline: string;
  cta: string;
  /** Default owner alert sent when the hero CTA fires. */
  alert: string;
  mini: VariantMini[];
  tiles: VariantTile[];
  owner: string;
  ownerSub: string;
  placeholder: string;
  aiHello: string;
  ai: [string, string][];
}

/* Typed as an exhaustive map, so a category the admin can mint but that has no
   scan page here is a compile error rather than a blank screen for a visitor. */
export const CATEGORY_VARIANTS: Record<ProductCategory, CategoryVariant> = {
  car: {
    label: "Car",
    module: "Vehicle module",
    tone: "red",
    heroIcon: "alert",
    beacon: "siren",
    title: "This is an emergency or an accident",
    sub: "We've detected an emergency or accident",
    tagline: "Car tag · GJ 01 XX 0000",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag on your car — there is an emergency at the vehicle.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "phone", line1: "Notify", line2: "Contacts", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "tow",
        title: "Towing",
        sub: "Roadside recovery",
        tint: "rose",
        lead: "Get the car lifted to the nearest garage.",
        bullets: [
          "The closest RepiQR towing partner is called for you",
          "The owner gets the request with your GPS pin",
        ],
        actions: [
          { label: "Call Towing partner · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Towing partner", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your car needs towing — I am with the vehicle now." } },
          { label: "Share my live location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "park",
        title: "Wrong Parking",
        sub: "Blocking the way",
        tint: "blue",
        lead: "Ask the owner to move the car — without ever seeing their number.",
        bullets: [
          "One tap sends a polite move-your-car alert",
          "Adding your pin tells them exactly which car it is",
        ],
        actions: [
          { label: "Ask the owner to move it", style: "wa", action: { kind: "notify", text: "Your car is blocking my way. Could you move it when you can?" } },
          { label: "Attach the exact spot", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "wrench",
        title: "Mechanic",
        sub: "On-site repair",
        tint: "cream",
        lead: "A mechanic comes to the car instead of the car going to them.",
        bullets: [
          "Partner mechanics cover most city pin codes",
          "The owner is told what was reported and by whom",
        ],
        actions: [
          { label: "Call Mechanic desk · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Mechanic desk", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your car has a breakdown — I have called a mechanic to the spot." } },
          { label: "Find garages near me", style: "blue", action: { kind: "maps", query: "car repair near me" } },
        ],
      },
      {
        icon: "tyre",
        title: "Puncture",
        sub: "Tyre assistance",
        tint: "violet",
        lead: "Flat tyre help, brought to the roadside.",
        bullets: [
          "Puncture kit or spare-fitting at the vehicle",
          "No number is exchanged with the owner",
        ],
        actions: [
          { label: "Call Tyre assistance · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Tyre assistance", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your car has a flat tyre. Tyre assistance has been requested." } },
          { label: "Find a tyre shop nearby", style: "blue", action: { kind: "maps", query: "tyre shop near me" } },
        ],
      },
      {
        icon: "fuel",
        title: "Fuel Delivery",
        sub: "Tank ran dry",
        tint: "amber",
        lead: "Five litres delivered to wherever the car has stopped.",
        bullets: [
          "Petrol or diesel, delivered to your pin",
          "Payment is settled by the owner in the app",
        ],
        actions: [
          { label: "Call Fuel delivery · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Fuel delivery", via: "partner" } },
          { label: "Send where the car is", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your car has run out of fuel — a delivery has been requested." } },
        ],
      },
      {
        icon: "police",
        title: "Accident Report",
        sub: "Police & insurance",
        tint: "rose",
        lead: "Report a crash and pull the owner into the loop instantly.",
        bullets: [
          "112 reaches police, fire and ambulance together",
          "The owner receives the alert with the time and place",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Police · 100", style: "ghost", action: { kind: "call", number: "100", who: "Police", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There has been an accident involving your car. Emergency services have been informed." } },
        ],
      },
    ],
    owner: "Message Car Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Your car is blocked in at the mall parking...",
    aiHello: "I can help you handle this car. What is happening?",
    ai: [
      ["Car is blocking me", "Tap Wrong Parking, then \"Ask the owner to move it\". The owner gets a WhatsApp alert with your pin and neither number is shown."],
      ["There has been a crash", "Dial 112 first — it covers police, fire and ambulance. Then tap Notify Contacts so the owner and their emergency contacts get your live pin."],
      ["Car will not start", "Use Mechanic for on-site repair, or Fuel Delivery if the tank is empty. Both reach the owner as a logged request."],
      ["Is the owner told?", "Yes. Every action here writes an alert into the owner’s RepiQR dashboard with the time, the place and what you reported."],
    ],
  },
  bike: {
    label: "Bike",
    module: "Vehicle module",
    tone: "red",
    heroIcon: "alert",
    beacon: "siren",
    title: "This is Emergency or an accident",
    sub: "We've detected an emergency or accident",
    tagline: "Bike tag · GJ 01 AB 1234",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag on your bike — there is an emergency at the vehicle.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "phone", line1: "Notify", line2: "Contacts", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "tow",
        title: "Bike Towing",
        sub: "Roadside recovery",
        tint: "rose",
        lead: "A two-wheeler recovery van comes to the bike.",
        bullets: [
          "Partner van carries a ramp for two-wheelers",
          "The owner gets the request with your GPS pin",
        ],
        actions: [
          { label: "Call Bike towing · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Bike towing", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bike needs towing — I am with it now." } },
          { label: "Share my live location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "wrench",
        title: "Mechanic",
        sub: "On-site repair",
        tint: "cream",
        lead: "On-spot repair for a bike that will not move.",
        bullets: [
          "Chain, clutch, plug and battery jobs on the roadside",
          "The owner sees what was reported",
        ],
        actions: [
          { label: "Call Mechanic desk · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Mechanic desk", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bike has broken down — a mechanic has been called to the spot." } },
          { label: "Find mechanics near me", style: "blue", action: { kind: "maps", query: "two wheeler mechanic near me" } },
        ],
      },
      {
        icon: "park",
        title: "Parking Issue",
        sub: "Blocking path",
        tint: "blue",
        lead: "Ask the rider to move the bike, anonymously.",
        bullets: [
          "One tap sends a polite move-your-bike alert",
          "Your pin tells them exactly which bike it is",
        ],
        actions: [
          { label: "Ask the rider to move it", style: "wa", action: { kind: "notify", text: "Your bike is blocking the path. Could you move it when you can?" } },
          { label: "Attach the exact spot", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "tyre",
        title: "Puncture",
        sub: "Tyre assistance",
        tint: "violet",
        lead: "Puncture help without pushing the bike anywhere.",
        bullets: [
          "Tube repair or replacement at the roadside",
          "Works for scooters and motorcycles",
        ],
        actions: [
          { label: "Call Puncture help · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Puncture help", via: "partner" } },
          { label: "Find puncture shops nearby", style: "blue", action: { kind: "maps", query: "puncture repair near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bike has a puncture. Roadside tyre help has been requested." } },
        ],
      },
      {
        icon: "theft",
        title: "Theft Alert",
        sub: "Report and alert",
        tint: "rose",
        lead: "Flag a bike that looks stolen or tampered with.",
        bullets: [
          "The owner is alerted the moment you send it",
          "Police can be reached on 112 in the same flow",
        ],
        actions: [
          { label: "Alert the owner now", style: "wa", action: { kind: "notify", text: "I think your bike is being tampered with or has been moved without you." } },
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send where the bike is", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "fuel",
        title: "Fuel Delivery",
        sub: "Tank ran dry",
        tint: "amber",
        lead: "Fuel brought to the bike, no jerrycan hunt.",
        bullets: [
          "Two to five litres delivered to your pin",
          "Settled by the owner inside RepiQR",
        ],
        actions: [
          { label: "Call Fuel delivery · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Fuel delivery", via: "partner" } },
          { label: "Send where the bike is", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bike has run out of fuel — a delivery has been requested." } },
        ],
      },
    ],
    owner: "Message Bike Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "Type your message here...",
    aiHello: "I can help with this bike. What do you need?",
    ai: [
      ["Bike is blocking me", "Tap Parking Issue and send the move-it alert. The rider gets a WhatsApp ping with your pin — no numbers are shown to either of you."],
      ["The rider is hurt", "Dial 108 for an ambulance, then tap Notify Contacts so the family stored on this tag is alerted with your location."],
      ["I think it is stolen", "Use Theft Alert. The owner is notified instantly, and you can reach 112 from the same sheet."],
      ["Do I pay for towing?", "No. Roadside charges are billed to the owner’s RepiQR account, not to the person who scanned."],
    ],
  },
  bicycle: {
    label: "Bicycle",
    module: "Vehicle module",
    tone: "red",
    heroIcon: "alert",
    beacon: "cycle",
    title: "This cyclist may need help",
    sub: "We've detected an emergency or accident",
    tagline: "Bicycle tag · Frame no. BC-4471",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag on your bicycle — there is an emergency at the cycle.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "phone", line1: "Notify", line2: "Contacts", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "ambulance",
        title: "Rider Down",
        sub: "Cyclist is hurt",
        tint: "rose",
        lead: "A cyclist on the ground needs a medical team before anything else.",
        bullets: [
          "108 is the free ambulance line in most states",
          "Do not lift the rider — wait with them and keep them warm",
          "The contacts on this tag get the alert with your pin",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "theft",
        title: "Theft Alert",
        sub: "Cut lock or moved",
        tint: "violet",
        lead: "Flag a cycle that looks stolen, cut loose or dumped.",
        bullets: [
          "The owner is alerted the second you send it",
          "Police are one tap away on 112 in the same sheet",
        ],
        actions: [
          { label: "Alert the owner now", style: "wa", action: { kind: "notify", text: "I think your bicycle has been stolen or moved without you." } },
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send where the cycle is", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "wrench",
        title: "Roadside Fix",
        sub: "Chain, brakes, gears",
        tint: "cream",
        lead: "The small repairs that get a cycle rolling again.",
        bullets: [
          "Chain, brake and gear jobs are done on the spot",
          "The owner sees what was reported and when",
        ],
        actions: [
          { label: "Call Cycle mechanic · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Cycle mechanic", via: "partner" } },
          { label: "Find a cycle shop nearby", style: "blue", action: { kind: "maps", query: "bicycle repair shop near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bicycle has broken down — I have called for roadside help." } },
        ],
      },
      {
        icon: "tyre",
        title: "Puncture",
        sub: "Tube repair",
        tint: "blue",
        lead: "Flat tube help, so nobody has to walk the cycle home.",
        bullets: [
          "Patch or tube replacement at the roadside",
          "Works for cycles and e-bikes alike",
        ],
        actions: [
          { label: "Call Puncture help · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Puncture help", via: "partner" } },
          { label: "Find a puncture shop nearby", style: "blue", action: { kind: "maps", query: "cycle puncture repair near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bicycle has a puncture. Roadside help has been requested." } },
        ],
      },
      {
        icon: "park",
        title: "Blocking a Path",
        sub: "Chained in the way",
        tint: "sky",
        lead: "Ask the owner to move it — without ever seeing their number.",
        bullets: [
          "One tap sends a polite move-your-cycle alert",
          "Your pin tells them exactly which cycle it is",
        ],
        actions: [
          { label: "Ask the owner to move it", style: "wa", action: { kind: "notify", text: "Your bicycle is chained across the path. Could you move it when you can?" } },
          { label: "Attach the exact spot", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "flag",
        title: "Abandoned Cycle",
        sub: "Standing for days",
        tint: "mint",
        lead: "A cycle that has not moved in a week is usually a lost one.",
        bullets: [
          "The owner is told where it stands and since when",
          "Support chases the owner if they never reply",
        ],
        actions: [
          { label: "Tell the owner it is here", style: "wa", action: { kind: "notify", text: "Your bicycle has been standing in the same spot for days — is it lost?" } },
          { label: "Add what you can see", style: "ghost", action: { kind: "write" } },
          { label: "Call RepiQR support · 1800 123 4567", style: "ghost", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
        ],
      },
    ],
    owner: "Message Cycle Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Cycle is lying near the flyover...",
    aiHello: "I can help with this bicycle. What do you see?",
    ai: [
      ["The rider has fallen", "Call 108 first, then tap Notify Contacts. Do not lift them — a fall that struck the helmet needs paramedics, not a lift."],
      ["I think it is stolen", "Use Theft Alert. The owner is notified instantly, and 112 sits in the same sheet if someone is still with the cycle."],
      ["It has been here for days", "Tap Abandoned Cycle. The owner gets the spot and the date, and support follows up if they go quiet."],
      ["Who pays for the repair?", "Roadside charges are billed to the owner’s RepiQR account, never to the person who scanned the tag."],
    ],
  },
  helmet: {
    label: "Helmet",
    module: "Vehicle module",
    tone: "red",
    heroIcon: "alert",
    beacon: "helmet",
    title: "This rider needs help",
    sub: "You've scanned a helmet safety tag — stay with them",
    tagline: "Helmet tag · Blood group B+ · Rider",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag inside your helmet — the rider needs help right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "people", line1: "Notify", line2: "Family", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "ambulance",
        title: "Ambulance",
        sub: "Rider is injured",
        tint: "rose",
        lead: "Get a medical team moving before anything else.",
        bullets: [
          "108 is the free ambulance number in most states",
          "112 reaches police, fire and ambulance together",
          "Family on this tag is alerted with your live pin",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "guide",
        title: "Do Not Remove",
        sub: "Helmet first aid",
        tint: "violet",
        lead: "The three minutes before the ambulance arrives.",
        bullets: [
          "Leave the helmet on unless they have stopped breathing",
          "Do not turn the head or neck — support it as it lies",
          "Keep talking to them and note the time of the crash",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
          { label: "Share where we are", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "medical",
        title: "Medical Info",
        sub: "Blood group, allergies",
        tint: "peach",
        lead: "What a paramedic asks for, without exposing an identity.",
        bullets: [
          "Blood group B+ · allergic to sulfa drugs",
          "On blood-pressure medication, no known heart condition",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "The rider is being treated — please share their medical history with the paramedic." } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "police",
        title: "Accident Report",
        sub: "Police & insurance",
        tint: "blue",
        lead: "Report the crash and pull the family into the loop instantly.",
        bullets: [
          "112 reaches police, fire and ambulance together",
          "The family receives the alert with the time and place",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Police · 100", style: "ghost", action: { kind: "call", number: "100", who: "Police", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There has been an accident involving the rider of this helmet. Emergency services have been informed." } },
        ],
      },
      {
        icon: "people",
        title: "Notify Family",
        sub: "Emergency contacts",
        tint: "mint",
        lead: "One tap reaches everyone stored on this tag.",
        bullets: [
          "Push, SMS and WhatsApp go out together",
          "Your number is never shown to any of them",
        ],
        actions: [
          { label: "Alert the family now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where we are", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "bag",
        title: "Helmet Found",
        sub: "Nobody around",
        tint: "cream",
        lead: "A helmet lying alone is usually just lost, not a crash.",
        bullets: [
          "The owner is told where it was found and when",
          "A police station is the safest handover if you cannot wait",
        ],
        actions: [
          { label: "Tell the owner I have it", style: "wa", action: { kind: "notify", text: "I have found your helmet and it is safe with me right now." } },
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Say where I found it", style: "ghost", action: { kind: "write" } },
        ],
      },
    ],
    owner: "Message Rider’s Family",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Rider is conscious, ambulance called...",
    aiHello: "You stopped — that is the important part. What is happening?",
    ai: [
      ["Should I take the helmet off?", "No. Leave it on unless they have stopped breathing. Removing it twists the neck, which is the injury you are trying to avoid."],
      ["The rider is unconscious", "Call 108 immediately, then Notify Family. Do not move them; support the head as it lies and stay until the ambulance arrives."],
      ["I only found the helmet", "Tap Helmet Found. The owner is told where it turned up, and you can hand it to a police station instead of carrying it around."],
      ["What can I see about them?", "Only what helps a paramedic: blood group, allergies and current medication. Name, address and phone number stay hidden."],
    ],
  },
  home: {
    label: "Home Gate",
    module: "Home / Office module",
    tone: "red",
    heroIcon: "alert",
    beacon: "siren",
    title: "Emergency at this property",
    sub: "Fire, gas leak, medical or security emergency",
    tagline: "Home gate tag · Block C, Flat 402",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag at your gate — something needs your attention at the property.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "phone", line1: "Notify", line2: "Residents", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "fire",
        title: "Fire Emergency",
        sub: "Call 101",
        tint: "rose",
        lead: "Fire services first, residents a second later.",
        bullets: [
          "101 is the national fire line; 112 also routes to it",
          "Residents get an alert with the gate address",
        ],
        actions: [
          { label: "Call Fire services · 101", style: "primary", action: { kind: "call", number: "101", who: "Fire services", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There is a fire emergency at your property. Fire services have been called." } },
        ],
      },
      {
        icon: "gas",
        title: "Gas Leak",
        sub: "Urgent hazard",
        tint: "amber",
        lead: "Smell of gas at the gate or in the corridor.",
        bullets: [
          "Do not ring bells or switch anything on or off",
          "Residents are alerted so they can shut the valve",
        ],
        actions: [
          { label: "Call LPG / gas leak helpline · 1906", style: "primary", action: { kind: "call", number: "1906", who: "LPG / gas leak helpline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There is a gas smell at your property — please shut the cylinder valve and ventilate." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "water",
        title: "Water Leak",
        sub: "Plumbing issue",
        tint: "sky",
        lead: "Overflowing tank, burst line or a flooded porch.",
        bullets: [
          "Residents get a photo-ready alert with the time",
          "A partner plumber can be dispatched to the gate",
        ],
        actions: [
          { label: "Alert the residents", style: "wa", action: { kind: "notify", text: "Water is leaking at your property — it looks like a burst line or an overflowing tank." } },
          { label: "Call Plumber on call · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Plumber on call", via: "partner" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "parcel",
        title: "Delivery",
        sub: "Parcel at the gate",
        tint: "cream",
        lead: "Courier at the gate with nobody home.",
        bullets: [
          "Residents are pinged instantly with your note",
          "Leave the drop instructions they reply with",
        ],
        actions: [
          { label: "Tell the residents I am here", style: "wa", action: { kind: "notify", text: "I have a delivery for you at the gate. Where should I leave it?" } },
          { label: "Add a note about the parcel", style: "ghost", action: { kind: "write" } },
          { label: "Share where I am standing", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "visitor",
        title: "Visitor",
        sub: "Someone is at the gate",
        tint: "blue",
        lead: "Announce yourself without shouting or calling.",
        bullets: [
          "Residents see who is at the gate and when",
          "They can reply on WhatsApp without sharing a number",
        ],
        actions: [
          { label: "Announce me at the gate", style: "wa", action: { kind: "notify", text: "I am at your gate — could you let me in?" } },
          { label: "Say who I am", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "cctv",
        title: "Security Alert",
        sub: "Suspicious activity",
        tint: "violet",
        lead: "Report someone or something that looks wrong.",
        bullets: [
          "Residents are alerted with the time and place",
          "Police are one tap away on 100 or 112",
        ],
        actions: [
          { label: "Alert the residents", style: "wa", action: { kind: "notify", text: "There is suspicious activity at your property — please check your cameras." } },
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Police · 100", style: "ghost", action: { kind: "call", number: "100", who: "Police", via: "public" } },
        ],
      },
    ],
    owner: "Message Home Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "Type your message here...",
    aiHello: "I can help you reach the people inside. What is going on?",
    ai: [
      ["Nobody is answering", "Tap Visitor or Delivery — the alert lands on the resident’s phone even if the doorbell is not heard, and they can reply straight back."],
      ["I smell gas", "Do not ring the bell or flip switches. Tap Gas Leak, call 1906, and move away from the door before you wait."],
      ["There is a fire", "Call 101 or 112 first, then send the residents alert so anyone inside knows to leave."],
      ["Is my number shown?", "No. Residents only see the alert and, if you share it, your map pin. Your phone number is never revealed by the tag."],
    ],
  },
  door: {
    label: "Door Tag",
    module: "Home / Office module",
    tone: "calm",
    heroIcon: "door",
    beacon: "bell",
    title: "You are at this door",
    sub: "Reach the resident without knowing their number",
    tagline: "Door tag · Flat 402, Block C",
    cta: "Notify the resident",
    alert: "I am at your door and nobody is answering.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Resident", action: { kind: "notify", text: undefined } },
      { icon: "parcel", line1: "Leave a", line2: "Parcel note", action: { kind: "write" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Knock Digitally",
        sub: "Instant ping",
        tint: "amber",
        lead: "The alert lands on their phone even when the bell is not heard.",
        bullets: [
          "Push, SMS and WhatsApp go out together",
          "They can reply without either number being shown",
        ],
        actions: [
          { label: "Ring the resident now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Say who I am", style: "ghost", action: { kind: "write" } },
          { label: "Share that I am at the door", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "parcel",
        title: "Delivery",
        sub: "Parcel at the door",
        tint: "cream",
        lead: "Courier at the door with nobody home.",
        bullets: [
          "Residents are pinged instantly with your note",
          "Follow the drop instructions they reply with",
        ],
        actions: [
          { label: "Tell the resident I am here", style: "wa", action: { kind: "notify", text: "I have a delivery for you at the door. Where should I leave it?" } },
          { label: "Add a note about the parcel", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "visitor",
        title: "Visitor",
        sub: "Announce yourself",
        tint: "blue",
        lead: "Say who you are without shouting through the door.",
        bullets: [
          "The resident sees who is outside and when",
          "Useful when the bell is broken or the flat is empty",
        ],
        actions: [
          { label: "Announce me at the door", style: "wa", action: { kind: "notify", text: "I am at your door — could you let me in?" } },
          { label: "Say who I am", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "fire",
        title: "Emergency",
        sub: "Fire, gas or medical",
        tint: "rose",
        lead: "Something is wrong inside and nobody is opening.",
        bullets: [
          "112 reaches police, fire and ambulance together",
          "101 goes straight to fire services",
          "The resident is alerted with the time and the flat",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Fire services · 101", style: "ghost", action: { kind: "call", number: "101", who: "Fire services", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There is an emergency at your door — emergency services have been called." } },
        ],
      },
      {
        icon: "water",
        title: "Leak / Damage",
        sub: "Water at the door",
        tint: "sky",
        lead: "Seepage in the corridor usually starts behind a closed door.",
        bullets: [
          "The resident gets a timestamped alert",
          "A partner plumber can be sent to the flat",
        ],
        actions: [
          { label: "Alert the resident", style: "wa", action: { kind: "notify", text: "Water is leaking from your flat into the corridor." } },
          { label: "Call Plumber on call · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Plumber on call", via: "partner" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "flag",
        title: "Report Issue",
        sub: "Wrong details or misuse",
        tint: "violet",
        lead: "Damaged tag, wrong flat number or a tag used to harass.",
        bullets: [
          "Support reviews the tag and contacts the owner",
          "Use 112 instead if anyone is in danger",
        ],
        actions: [
          { label: "Call RepiQR support · 1800 123 4567", style: "primary", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
          { label: "Describe the problem", style: "ghost", action: { kind: "write" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
    ],
    owner: "Message the Resident",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Delivery at the door, nobody is answering...",
    aiHello: "I can reach the person inside. What do you need?",
    ai: [
      ["Nobody is answering", "Tap Knock Digitally. The alert reaches their phone even if the bell is broken, and they can reply straight back."],
      ["I have a parcel", "Use Delivery and ask where to leave it. Their reply is the drop instruction — no calling, no waiting."],
      ["Is my number shown?", "No. WhatsApp opens a draft on your own phone. The resident sees your message and nothing else."],
      ["Something is wrong inside", "Call 112 from the Emergency tile. The resident is alerted at the same time with the flat number and the time."],
    ],
  },
  apartment: {
    label: "Apartment",
    module: "Home / Office module",
    tone: "red",
    heroIcon: "alert",
    beacon: "building",
    title: "Emergency in this building",
    sub: "Fire, lift entrapment, gas or medical emergency",
    tagline: "Apartment gate tag · Tower B · Security desk",
    cta: "Get Help",
    alert: "I scanned the RepiQR tag at your society gate — there is an emergency in the building.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "people", line1: "Notify", line2: "Society", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "fire",
        title: "Fire Emergency",
        sub: "Call 101",
        tint: "rose",
        lead: "Fire services first, the society committee a second later.",
        bullets: [
          "101 is the national fire line; 112 also routes to it",
          "Use the stairs, never the lift",
          "The committee and security are alerted with the tower name",
        ],
        actions: [
          { label: "Call Fire services · 101", style: "primary", action: { kind: "call", number: "101", who: "Fire services", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There is a fire in the building. Fire services have been called." } },
        ],
      },
      {
        icon: "lift",
        title: "Trapped in Lift",
        sub: "Someone is stuck",
        tint: "amber",
        lead: "Get the technician moving and the trapped person talking.",
        bullets: [
          "Stay outside the doors and keep speaking to them",
          "Never force a lift door open yourself",
          "Security is alerted with the tower and floor",
        ],
        actions: [
          { label: "Call Lift technician · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Lift technician", via: "partner" } },
          { label: "Alert security now", style: "wa", action: { kind: "notify", text: "Someone is trapped in the lift — please send the technician and security now." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "gas",
        title: "Gas Leak",
        sub: "Urgent hazard",
        tint: "peach",
        lead: "Smell of gas in a corridor or a stairwell.",
        bullets: [
          "Do not ring bells or switch anything on or off",
          "Residents are alerted so they can shut the valve",
        ],
        actions: [
          { label: "Call LPG / gas leak helpline · 1906", style: "primary", action: { kind: "call", number: "1906", who: "LPG / gas leak helpline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There is a gas smell in the building — please shut the cylinder valves and ventilate." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "visitor",
        title: "Visitor / Guest",
        sub: "Announce at the gate",
        tint: "blue",
        lead: "Get in without arguing with the intercom.",
        bullets: [
          "The flat is pinged directly with your name",
          "They can approve you without sharing a number",
        ],
        actions: [
          { label: "Announce me at the gate", style: "wa", action: { kind: "notify", text: "I am at your society gate — could you approve my entry?" } },
          { label: "Say who I am", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "parcel",
        title: "Delivery",
        sub: "Courier at the gate",
        tint: "cream",
        lead: "Security will not accept it and nobody is picking up.",
        bullets: [
          "The flat gets your note with the time",
          "Leave the parcel exactly where they reply",
        ],
        actions: [
          { label: "Tell the flat I am here", style: "wa", action: { kind: "notify", text: "I have a delivery at the society gate. Where should I leave it?" } },
          { label: "Add a note about the parcel", style: "ghost", action: { kind: "write" } },
          { label: "Share which gate I am at", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "cctv",
        title: "Security Alert",
        sub: "Suspicious activity",
        tint: "violet",
        lead: "Report someone or something that looks wrong on the premises.",
        bullets: [
          "Security and the committee are alerted with the time",
          "Police are one tap away on 100 or 112",
        ],
        actions: [
          { label: "Alert security", style: "wa", action: { kind: "notify", text: "There is suspicious activity in the building — please check the cameras." } },
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Police · 100", style: "ghost", action: { kind: "call", number: "100", who: "Police", via: "public" } },
        ],
      },
    ],
    owner: "Message the Society",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Lift stuck between 4th and 5th floor...",
    aiHello: "I can reach the society desk. What is happening?",
    ai: [
      ["Someone is stuck in the lift", "Tap Trapped in Lift. It calls the technician and alerts security together — keep talking to the person inside and never pry the doors."],
      ["There is a fire", "Call 101 or 112 first, then send the society alert. Take the stairs, not the lift."],
      ["I smell gas", "Do not ring any bell or flip a switch. Call 1906 from the Gas Leak tile and move outside before you wait."],
      ["Security will not let me in", "Use Visitor and ping the flat directly. Their approval reaches the desk without you sharing a number."],
    ],
  },
  employee: {
    label: "Employee ID",
    module: "Home / Office module",
    tone: "calm",
    heroIcon: "badge",
    beacon: "badge",
    title: "You found someone's ID card",
    sub: "Thanks for stopping — let’s get it back to them",
    tagline: "Employee tag · Card EMP-2214 · access enabled",
    cta: "Notify the employer",
    alert: "I have found your employee ID card and it is safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Employer", action: { kind: "notify", text: undefined } },
      { icon: "box", line1: "Nearest", line2: "Drop Point", action: { kind: "maps", query: "lost and found counter near me" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Employer",
        sub: "Instant alert",
        tint: "amber",
        lead: "The card holder and their admin desk are told together.",
        bullets: [
          "They see your pin, never your phone number",
          "The alert is timestamped in the RepiQR log",
        ],
        actions: [
          { label: "Alert them now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found it", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "shield",
        title: "Block Access",
        sub: "The card opens doors",
        tint: "rose",
        lead: "An access card in a stranger’s hands is a building risk.",
        bullets: [
          "Ask them to deactivate the card before anything else",
          "A replacement is issued once the old card is blocked",
        ],
        actions: [
          { label: "Ask them to block the card", style: "wa", action: { kind: "notify", text: "I have your access card — please deactivate it now, I will return the card itself." } },
          { label: "Call RepiQR support · 1800 123 4567", style: "primary", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "headset",
        title: "Company Desk",
        sub: "Call reception",
        tint: "blue",
        lead: "The reception desk can page the person in minutes.",
        bullets: [
          "Quote the card number printed on the tag",
          "Reception logs the handover against the employee",
        ],
        actions: [
          { label: "Call Company reception · 1800 123 4567", style: "primary", action: { kind: "call", number: "1800 123 4567", who: "Company reception", via: "support" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I found an employee card of yours. How should I return it?" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "box",
        title: "Drop It Off",
        sub: "Counter or desk",
        tint: "cream",
        lead: "A staffed counter is safer than your pocket.",
        bullets: [
          "Quote the tag code when you hand it over",
          "The employer is told exactly which counter holds it",
        ],
        actions: [
          { label: "Find the nearest counter", style: "blue", action: { kind: "maps", query: "lost and found counter near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I am leaving your ID card at the lost and found counter here." } },
          { label: "Share which building I am in", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "medical",
        title: "Medical Emergency",
        sub: "The holder is unwell",
        tint: "peach",
        lead: "The card holder is the one who needs help, not the card.",
        bullets: [
          "108 is the free ambulance number in most states",
          "The employer and emergency contacts are alerted at once",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your employee has collapsed and needs medical help — an ambulance has been called." } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Hand over safely",
        tint: "mint",
        lead: "The safest handover when nobody replies.",
        bullets: [
          "Stations log found property against the tag code",
          "The employer is told which station holds the card",
        ],
        actions: [
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody replied, so I am depositing your ID card at the nearest police station." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
    ],
    owner: "Message the Employer",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found the card outside the metro gate...",
    aiHello: "Thanks for picking it up. Where did you find the card?",
    ai: [
      ["Why block the card?", "Because it opens doors. Ask them to deactivate it first, then return the plastic — that order costs them nothing and protects the building."],
      ["I cannot carry it around", "Use Drop It Off for a staffed counter, or the nearest police station. Both are logged against the tag code."],
      ["Nobody is replying", "Try Company Desk — reception can page the person even when their own phone is lost with the card."],
      ["Is there a reward?", "Rewards are arranged inside RepiQR by the owner, so no cash or bank details change hands."],
    ],
  },
  nfc: {
    label: "NFC Tag",
    module: "Home / Office module",
    tone: "calm",
    heroIcon: "nfc",
    beacon: "nfc",
    title: "You tapped a RepiQR smart tag",
    sub: "Reach the owner without either number being shown",
    tagline: "NFC tag · universal · tap or scan",
    cta: "Notify the owner",
    alert: "I tapped your RepiQR smart tag — I have the item it is stuck to.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "chat", line1: "Write a", line2: "Message", action: { kind: "write" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "One tap tells the owner their tag has been read.",
        bullets: [
          "Push, SMS and WhatsApp go out together",
          "They see your pin, never your phone number",
        ],
        actions: [
          { label: "Alert the owner now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I am", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "note",
        title: "Owner’s Note",
        sub: "Left on this tag",
        tint: "violet",
        lead: "Written by the owner for whoever taps it.",
        bullets: [
          "\"Thanks for stopping — please just message me here.\"",
          "\"A reward is arranged through RepiQR, no cash needed.\"",
        ],
        actions: [
          { label: "Reply on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Write a reply", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "box",
        title: "Return the Item",
        sub: "Drop point or courier",
        tint: "cream",
        lead: "Two ways to hand it back without meeting a stranger.",
        bullets: [
          "Partner shops and desks hold items until collection",
          "Courier pickup and shipping are paid by the owner",
        ],
        actions: [
          { label: "Find a drop point near me", style: "blue", action: { kind: "maps", query: "safe drop point near me" } },
          { label: "Call Courier pickup · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Courier pickup", via: "partner" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I can drop your item at a RepiQR point or hand it to a courier — which do you prefer?" } },
        ],
      },
      {
        icon: "alert",
        title: "Emergency",
        sub: "Someone needs help",
        tint: "rose",
        lead: "If the tag is worn on a person and something is wrong.",
        bullets: [
          "112 reaches police, fire and ambulance together",
          "The owner’s contacts are alerted with your pin",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Call Ambulance · 108", style: "ghost", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "flag",
        title: "Report Misuse",
        sub: "Tag looks wrong",
        tint: "sky",
        lead: "A cloned, damaged or misused tag should not stay live.",
        bullets: [
          "Support reviews the tag and contacts the owner",
          "A misused tag can be disabled within the hour",
        ],
        actions: [
          { label: "Call RepiQR support · 1800 123 4567", style: "primary", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
          { label: "Describe the problem", style: "ghost", action: { kind: "write" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "shield",
        title: "How This Works",
        sub: "Privacy & scans",
        tint: "mint",
        lead: "What a tap does, and what it never does.",
        bullets: [
          "No number, address or full name is shown to you",
          "The owner does not get your number either",
          "Every tap is logged with the time, for the owner alone",
        ],
        actions: [
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
          { label: "Message the owner", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Call RepiQR support · 1800 123 4567", style: "ghost", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
        ],
      },
    ],
    owner: "Message the Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Tapped this tag on a laptop sleeve...",
    aiHello: "This is a universal RepiQR tag. What is it stuck to?",
    ai: [
      ["What is this tag on?", "A universal tag goes on whatever the owner chose — a laptop, a cycle, a toolbox. Tell them what you are holding and they will recognise it instantly."],
      ["How do I return it?", "Tap Return the Item. A drop point costs you a short walk; a courier costs you nothing and is paid by the owner."],
      ["Can they see my number?", "No. WhatsApp opens a draft on your own phone, and you choose whether to send it. The tag never reveals either number."],
      ["The tag looks fake", "Use Report Misuse. Support can disable a cloned or damaged tag within the hour."],
    ],
  },
  child: {
    label: "Kids",
    module: "Kids & Seniors module",
    tone: "red",
    heroIcon: "alert",
    beacon: "siren",
    title: "This child needs help",
    sub: "You've scanned a child safety tag — stay with them",
    tagline: "School-bag tag · Age 7 · Blood group O+",
    cta: "Get Help",
    alert: "I have found your child and I am with them right now. They are safe.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "people", line1: "Notify", line2: "Guardians", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "helpline",
        title: "Childline 1098",
        sub: "Govt. helpline",
        tint: "sky",
        lead: "India's 24x7 free helpline for children in distress.",
        bullets: [
          "1098 is toll-free from any phone, day or night",
          "Use it if no guardian answers within a few minutes",
        ],
        actions: [
          { label: "Call Childline · 1098", style: "primary", action: { kind: "call", number: "1098", who: "Childline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I have found your child and I am with them. Please call back through RepiQR." } },
          { label: "Send where we are", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Report a found child",
        tint: "blue",
        lead: "Hand the child over to a station if no one can be reached.",
        bullets: [
          "Stay with the child until an officer arrives",
          "The guardian gets a copy of everything you report",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody answered, so I am taking your child to the nearest police station." } },
        ],
      },
      {
        icon: "medical",
        title: "Medical Info",
        sub: "Blood group, allergies",
        tint: "rose",
        lead: "The details a paramedic would ask for, without exposing identity.",
        bullets: [
          "Blood group O+ · allergic to penicillin",
          "Asthma inhaler carried in the front pocket",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your child is being treated — please share their medical history with the paramedic." } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "ambulance",
        title: "Ambulance",
        sub: "Medical emergency",
        tint: "peach",
        lead: "Get a medical team moving before anything else.",
        bullets: [
          "108 is the free ambulance number in most states",
          "Guardians are alerted with your live pin",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "guide",
        title: "What To Do",
        sub: "Step-by-step guide",
        tint: "violet",
        lead: "A short script for the next five minutes.",
        bullets: [
          "Stay where you are — lost children are found where they stopped",
          "Notify the guardian, then wait in a visible, public spot",
          "Do not put the child in a vehicle; let the adult come to you",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Share where we are waiting", style: "blue", action: { kind: "pin" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "people",
        title: "Stay Visible",
        sub: "Wait in a safe spot",
        tint: "mint",
        lead: "Pick somewhere staffed and public, then hold there.",
        bullets: [
          "A shop counter, security desk or ticket window works best",
          "Send the pin so the guardian walks straight to you",
        ],
        actions: [
          { label: "Share where we are waiting", style: "blue", action: { kind: "pin" } },
          { label: "Find a staffed safe point", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "We are waiting in a safe public spot — here is where to find us." } },
        ],
      },
    ],
    owner: "Message Parent or Guardian",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Child is safe with me near...",
    aiHello: "You are doing the right thing by stopping. What do you need?",
    ai: [
      ["No one is answering", "Give it two minutes, then call Childline on 1098. They take over and stay on the line with you."],
      ["Should I move the child?", "No. Stay where the child is, in a public and visible spot. The guardian gets your pin and comes to you."],
      ["The child is hurt", "Call 108 for an ambulance, then open Medical Info — blood group and allergies are on this tag for the paramedic."],
      ["What can I see about them?", "Only what helps: first name, age, blood group and allergies. The address and the guardian’s number stay hidden."],
    ],
  },
  senior: {
    label: "Senior",
    module: "Kids & Seniors module",
    tone: "red",
    heroIcon: "alert",
    beacon: "senior",
    title: "This senior citizen needs help",
    sub: "You've scanned a senior safety tag — stay with them",
    tagline: "Senior keychain · Age 74 · Blood group A+",
    cta: "Get Help",
    alert: "I have found your family member and I am with them right now. They are safe.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "people", line1: "Notify", line2: "Family", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "helpline",
        title: "Elderline 14567",
        sub: "Govt. helpline",
        tint: "sky",
        lead: "India’s national helpline for senior citizens, free and 24x7.",
        bullets: [
          "14567 is toll-free from any phone, day or night",
          "Use it if no family member answers within a few minutes",
        ],
        actions: [
          { label: "Call Elderline · 14567", style: "primary", action: { kind: "call", number: "14567", who: "Elderline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I have found your family member and I am with them. Please call back through RepiQR." } },
          { label: "Send where we are", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "medical",
        title: "Medical Info",
        sub: "Conditions & medicines",
        tint: "rose",
        lead: "What a paramedic asks for, without exposing an address.",
        bullets: [
          "Blood group A+ · diabetic, on insulin twice a day",
          "On a blood thinner — tell any doctor before treatment",
          "Pacemaker fitted in 2019",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your family member is being treated — please share their medical history with the paramedic." } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "ambulance",
        title: "Ambulance",
        sub: "Medical emergency",
        tint: "peach",
        lead: "Get a medical team moving before anything else.",
        bullets: [
          "108 is the free ambulance number in most states",
          "Family is alerted with your live pin at the same time",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "guide",
        title: "Seems Confused",
        sub: "Memory loss guide",
        tint: "violet",
        lead: "A short script for the next five minutes.",
        bullets: [
          "Speak slowly, use their name, do not argue with them",
          "Stay where you are — do not walk them to a new place",
          "Do not put them in a vehicle; let the family come to you",
        ],
        actions: [
          { label: "Alert the family now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Share where we are waiting", style: "blue", action: { kind: "pin" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "If nobody answers",
        tint: "blue",
        lead: "A station is a safe place to wait when calls go unanswered.",
        bullets: [
          "Stay with them until an officer takes over",
          "The family gets a copy of everything you report",
        ],
        actions: [
          { label: "Call Emergency (all services) · 112", style: "primary", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody answered, so I am taking your family member to the nearest police station." } },
        ],
      },
      {
        icon: "people",
        title: "Stay With Them",
        sub: "Wait in a safe spot",
        tint: "mint",
        lead: "Pick somewhere staffed, shaded and public, then hold there.",
        bullets: [
          "A shop counter, pharmacy or clinic works best",
          "Send the pin so the family walks straight to you",
        ],
        actions: [
          { label: "Share where we are waiting", style: "blue", action: { kind: "pin" } },
          { label: "Find a staffed safe point", style: "blue", action: { kind: "maps", query: "pharmacy near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "We are waiting in a safe public spot — here is where to find us." } },
        ],
      },
    ],
    owner: "Message the Family",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found near the temple gate, they are calm...",
    aiHello: "You are doing the right thing by stopping. What do you need?",
    ai: [
      ["They seem confused", "Stay put and keep it calm — do not argue or walk them anywhere. Send the family your pin; they come to you."],
      ["Nobody is answering", "Give it two minutes, then call Elderline on 14567. They take over and stay on the line with you."],
      ["They have collapsed", "Call 108 for an ambulance, then open Medical Info — the blood thinner and the pacemaker are what a doctor needs to know first."],
      ["What can I see about them?", "Only what helps: first name, age, blood group and conditions. The address and the family’s number stay hidden."],
    ],
  },
  wristband: {
    label: "Wristband",
    module: "Kids & Seniors module",
    tone: "red",
    heroIcon: "alert",
    beacon: "band",
    title: "This person needs medical help",
    sub: "You've scanned a medical ID wristband",
    tagline: "Wristband · Epilepsy · Blood group O−",
    cta: "Get Help",
    alert: "I scanned the RepiQR medical wristband — the wearer needs help right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "people", line1: "Notify", line2: "Contacts", action: { kind: "notify", text: undefined } },
      { icon: "ambulance", line1: "Request", line2: "Ambulance", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
    ],
    tiles: [
      {
        icon: "ambulance",
        title: "Ambulance",
        sub: "Call 108 now",
        tint: "rose",
        lead: "A medical team first, everything else after.",
        bullets: [
          "108 is the free ambulance number in most states",
          "112 reaches police, fire and ambulance together",
          "Contacts on this tag are alerted with your pin",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
          { label: "Send our exact location", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "guide",
        title: "Seizure First Aid",
        sub: "What to do right now",
        tint: "violet",
        lead: "The four things that matter while you wait.",
        bullets: [
          "Turn them on their side and cushion the head",
          "Never hold them down or put anything in the mouth",
          "Time it — past five minutes, call 108 immediately",
          "Stay until they are awake and know where they are",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
          { label: "Share where we are", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "medical",
        title: "Medical ID",
        sub: "Condition & medicines",
        tint: "peach",
        lead: "What the wearer needs a stranger to know.",
        bullets: [
          "Blood group O− · epilepsy, on levetiracetam",
          "Allergic to penicillin — tell any doctor first",
          "Rescue medicine carried in the right jacket pocket",
        ],
        actions: [
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "The wearer of this wristband is being treated — please share their medical history." } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "hospital",
        title: "Nearest Hospital",
        sub: "Get them seen",
        tint: "blue",
        lead: "When they can walk but should still be checked.",
        bullets: [
          "Emergency departments run 24x7 in every district",
          "Contacts are told which hospital you went to",
        ],
        actions: [
          { label: "Find a hospital near me", style: "blue", action: { kind: "maps", query: "hospital emergency near me" } },
          { label: "Call Ambulance · 108", style: "primary", action: { kind: "call", number: "108", who: "Ambulance", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I am taking the wearer of this wristband to the nearest hospital." } },
        ],
      },
      {
        icon: "people",
        title: "Notify Contacts",
        sub: "Family & doctor",
        tint: "mint",
        lead: "One tap reaches everyone stored on this band.",
        bullets: [
          "Push, SMS and WhatsApp go out together",
          "Your number is never shown to any of them",
        ],
        actions: [
          { label: "Alert the contacts now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where we are", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "helpline",
        title: "Health Helpline",
        sub: "104 and 14416",
        tint: "sky",
        lead: "A doctor on the phone when it is not yet an ambulance.",
        bullets: [
          "104 is the free state health advice line",
          "14416 is Tele-MANAS, for a mental health crisis",
        ],
        actions: [
          { label: "Call Health helpline · 104", style: "primary", action: { kind: "call", number: "104", who: "Health helpline", via: "public" } },
          { label: "Call Tele-MANAS · 14416", style: "ghost", action: { kind: "call", number: "14416", who: "Tele-MANAS", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I am with the wearer of this wristband and have called the health helpline." } },
        ],
      },
    ],
    owner: "Message Their Contacts",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. They had a seizure, now resting...",
    aiHello: "Stay calm and stay with them. What is happening?",
    ai: [
      ["They are having a seizure", "Turn them on their side, cushion the head, and time it. Do not hold them down or put anything in their mouth. Past five minutes, call 108."],
      ["Should I give them medicine?", "Only the rescue medicine named on this tag, and only the way it says. Never give anything else — the allergy list here exists for a reason."],
      ["They seem fine now", "Stay until they know where they are, then use Notify Contacts. A first episode should still be seen at a hospital."],
      ["What can I see about them?", "Only the medical facts: blood group, condition, medicines and allergies. Name, address and numbers stay hidden."],
    ],
  },
  pet: {
    label: "Pet",
    module: "Luggage & Travel module",
    tone: "calm",
    heroIcon: "paw",
    beacon: "paw",
    title: "You found someone's pet",
    sub: "Thanks for stopping — let's get them home",
    tagline: "Pet tag · Indie · 4 yrs · friendly",
    cta: "Notify the owner",
    alert: "I have found your pet and they are safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "medical", line1: "Nearest", line2: "Vet", action: { kind: "maps", query: "veterinary clinic near me" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "The owner gets a push, an SMS and a WhatsApp alert at once.",
        bullets: [
          "They see your pin, never your phone number",
          "Most owners reply within a couple of minutes",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found them", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "medical",
        title: "Nearest Vet",
        sub: "If the pet is hurt",
        tint: "rose",
        lead: "Injured or limping — a clinic comes first, paperwork later.",
        bullets: [
          "Treatment costs are settled by the owner in RepiQR",
          "The owner is told which clinic you went to",
        ],
        actions: [
          { label: "Find a vet near me", style: "blue", action: { kind: "maps", query: "veterinary clinic near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your pet is hurt — I am taking them to the nearest vet." } },
          { label: "Call Animal helpline · 1962", style: "primary", action: { kind: "call", number: "1962", who: "Animal helpline", via: "public" } },
        ],
      },
      {
        icon: "helpline",
        title: "Animal Helpline",
        sub: "Rescue on 1962",
        tint: "sky",
        lead: "Government animal ambulance and rescue line.",
        bullets: [
          "1962 covers most Indian states for animal rescue",
          "Use it when the pet cannot be moved safely",
        ],
        actions: [
          { label: "Call Animal helpline · 1962", style: "primary", action: { kind: "call", number: "1962", who: "Animal helpline", via: "public" } },
          { label: "Send where the pet is", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your pet needs rescue help — I have called the animal helpline." } },
        ],
      },
      {
        icon: "note",
        title: "Pet Profile",
        sub: "Name, diet, meds",
        tint: "violet",
        lead: "What this pet needs, in the owner’s own words.",
        bullets: [
          "Answers to \"Indie\" · food-motivated, no chicken",
          "On thyroid medicine every morning",
          "Nervous around other dogs — keep the leash short",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I have your pet. Anything I should know beyond the profile on the tag?" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "water",
        title: "Food & Water",
        sub: "Keep them calm",
        tint: "mint",
        lead: "Three things that settle a scared animal.",
        bullets: [
          "Water first, food only if the owner confirms the diet",
          "Sit at their level; do not chase or corner them",
          "Keep them leashed or in a closed room until pickup",
        ],
        actions: [
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your pet is calm and with me. Where should we meet?" } },
          { label: "Share where we are", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "box",
        title: "Shelter Drop",
        sub: "If you cannot wait",
        tint: "cream",
        lead: "A registered shelter is a safe handover point.",
        bullets: [
          "The owner is told exactly which shelter you chose",
          "Shelters log the tag number so the pet is traceable",
        ],
        actions: [
          { label: "Find a shelter near me", style: "blue", action: { kind: "maps", query: "animal shelter near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I cannot wait any longer — I am leaving your pet at a registered shelter." } },
          { label: "Call Animal helpline · 1962", style: "primary", action: { kind: "call", number: "1962", who: "Animal helpline", via: "public" } },
        ],
      },
    ],
    owner: "Message Pet Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found near the park gate, she is calm...",
    aiHello: "Thanks for helping. What is the pet like right now?",
    ai: [
      ["The pet is scared", "Sit down, avoid eye contact and offer water, not food. Send the owner your pin — most reunions happen within fifteen minutes."],
      ["The pet is injured", "Tap Nearest Vet, or call 1962 if they cannot be moved. Vet bills are settled by the owner through RepiQR."],
      ["Can I feed them?", "Water is always safe. Hold off on food until the owner confirms the diet — the tag notes no chicken and daily medicine."],
      ["Nobody replied yet", "Give it ten minutes, then use Shelter Drop. The owner is told exactly where their pet was left."],
    ],
  },
  luggage: {
    label: "Luggage",
    module: "Luggage & Travel module",
    tone: "calm",
    heroIcon: "bag",
    beacon: "bag",
    title: "You found someone's bag",
    sub: "Thanks for stopping — let's get it back to them",
    tagline: "Luggage tag · Cabin trolley · dark blue",
    cta: "Notify the owner",
    alert: "I have found your bag and it is safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "box", line1: "Lost &", line2: "Found", action: { kind: "maps", query: "lost and found counter near me" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "One tap tells the owner their bag has surfaced.",
        bullets: [
          "They see your pin, never your phone number",
          "The alert is timestamped in their RepiQR history",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found it", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "box",
        title: "Lost & Found",
        sub: "Nearest counter",
        tint: "cream",
        lead: "Airports, stations and malls all run a counter.",
        bullets: [
          "Hand it over and quote the tag code on the sticker",
          "The owner is told which counter holds the bag",
        ],
        actions: [
          { label: "Find the nearest counter", style: "blue", action: { kind: "maps", query: "lost and found counter near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I am handing your bag to the lost and found counter here." } },
          { label: "Share which terminal I am in", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "plane",
        title: "Airline Desk",
        sub: "Checked baggage",
        tint: "sky",
        lead: "Bags that came off a belt belong with the airline.",
        bullets: [
          "The baggage desk logs it against the flight",
          "RepiQR notifies the owner with the reference",
        ],
        actions: [
          { label: "Find the baggage desk", style: "blue", action: { kind: "maps", query: "airline baggage service desk" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your bag is at the airline baggage desk here — please claim it with your flight number." } },
          { label: "Call RepiQR support · 1800 123 4567", style: "ghost", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
        ],
      },
      {
        icon: "parcel",
        title: "Courier Return",
        sub: "Free pickup",
        tint: "blue",
        lead: "A courier collects the bag from wherever you are.",
        bullets: [
          "Pickup and return shipping are paid by the owner",
          "You get a receipt for the handover",
        ],
        actions: [
          { label: "Call Courier pickup · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Courier pickup", via: "partner" } },
          { label: "Send my pickup address", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I can hand your bag to a courier — send the pickup and I will keep it safe until then." } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Hand over safely",
        tint: "violet",
        lead: "The safest handover when the owner is unreachable.",
        bullets: [
          "Stations log found property against the tag code",
          "The owner is told which station has it",
        ],
        actions: [
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody replied, so I am depositing your bag at the nearest police station." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "note",
        title: "Owner's Note",
        sub: "Message left for you",
        tint: "mint",
        lead: "Left on the tag for whoever finds it.",
        bullets: [
          "\"Thank you for stopping — there are medicines inside.\"",
          "\"A reward is arranged through RepiQR, no cash needed.\"",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Reply to the owner", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
    ],
    owner: "Message Bag Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found at the airport carousel 4...",
    aiHello: "Thanks for picking it up. Where did you find the bag?",
    ai: [
      ["I am at an airport", "Use Airline Desk for anything off a belt, or Lost & Found for the terminal itself. Both notify the owner with the reference."],
      ["I cannot carry it around", "Tap Courier Return — pickup is paid by the owner — or drop it at the nearest police station."],
      ["Can I open the bag?", "No need. Everything RepiQR must know is on the tag, and opening it is what the owner is worried about."],
      ["Is there a reward?", "Rewards are arranged inside RepiQR by the owner. You never have to negotiate or share bank details with a stranger."],
    ],
  },
  travel: {
    label: "Travel Tag",
    module: "Luggage & Travel module",
    tone: "calm",
    heroIcon: "plane",
    beacon: "plane",
    title: "You found someone's travel pouch",
    sub: "Documents inside — let’s get them back fast",
    tagline: "Travel tag · passport pouch · navy",
    cta: "Notify the owner",
    alert: "I have found your travel pouch and it is safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "box", line1: "Lost &", line2: "Found", action: { kind: "maps", query: "lost and found counter near me" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "Someone mid-journey needs to hear this within minutes.",
        bullets: [
          "They see your pin, never your phone number",
          "The alert is timestamped in their RepiQR history",
        ],
        actions: [
          { label: "Alert the owner now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found it", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "note",
        title: "Documents Inside",
        sub: "Passport & tickets",
        tint: "violet",
        lead: "Handle a document pouch differently from a bag.",
        bullets: [
          "Do not photograph or post the documents anywhere",
          "Hand it to a counter, never to an individual who claims it",
          "The owner may be standing at an immigration desk right now",
        ],
        actions: [
          { label: "Tell the owner I have it", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Say exactly what I am holding", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "plane",
        title: "Airline Desk",
        sub: "At the airport",
        tint: "sky",
        lead: "Inside a terminal, the airline desk is the fastest route.",
        bullets: [
          "The desk logs it against the flight and the passenger",
          "RepiQR notifies the owner with the reference",
        ],
        actions: [
          { label: "Find the baggage desk", style: "blue", action: { kind: "maps", query: "airline baggage service desk" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Your travel pouch is at the airline desk here — please claim it with your flight number." } },
          { label: "Call RepiQR support · 1800 123 4567", style: "ghost", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
        ],
      },
      {
        icon: "helpline",
        title: "Tourist Helpline",
        sub: "1363, 24x7",
        tint: "blue",
        lead: "For a traveller far from home and out of options.",
        bullets: [
          "1363 is the national tourist helpline, free and multilingual",
          "139 covers Indian Railways enquiries and lost property",
        ],
        actions: [
          { label: "Call Tourist helpline · 1363", style: "primary", action: { kind: "call", number: "1363", who: "Tourist helpline", via: "public" } },
          { label: "Call Railway helpline · 139", style: "ghost", action: { kind: "call", number: "139", who: "Railway helpline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I have your travel pouch and have contacted the tourist helpline for you." } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Hand over safely",
        tint: "mint",
        lead: "The safest handover for documents when nobody replies.",
        bullets: [
          "Stations log found documents against the tag code",
          "The owner is told which station holds the pouch",
        ],
        actions: [
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody replied, so I am depositing your travel pouch at the nearest police station." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "parcel",
        title: "Courier Return",
        sub: "Owner pays pickup",
        tint: "cream",
        lead: "A courier collects the pouch from wherever you are.",
        bullets: [
          "Pickup and return shipping are paid by the owner",
          "You get a receipt for the handover",
        ],
        actions: [
          { label: "Call Courier pickup · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Courier pickup", via: "partner" } },
          { label: "Send my pickup address", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I can hand your travel pouch to a courier — send the pickup and I will keep it safe until then." } },
        ],
      },
    ],
    owner: "Message Pouch Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found at the station, platform 3...",
    aiHello: "Thanks for picking it up. Where did you find the pouch?",
    ai: [
      ["I am at an airport", "Use Airline Desk. It logs the pouch against the flight, which is the only route that reaches a passenger already past security."],
      ["Someone says it is theirs", "Do not hand it over. Send the owner an alert instead — a counter or a police station verifies identity, you should not have to."],
      ["They are a foreign tourist", "Call 1363. The national tourist helpline is free, multilingual, and can reach a traveller through their hotel or embassy."],
      ["Can I open the pouch?", "No need. Everything RepiQR must know is on the tag, and the documents inside are exactly what the owner is worried about."],
    ],
  },
  wallet: {
    label: "Wallet",
    module: "Luggage & Travel module",
    tone: "calm",
    heroIcon: "wallet",
    beacon: "wallet",
    title: "You found someone's wallet",
    sub: "Cards inside — the owner is probably panicking",
    tagline: "Wallet tag · brown leather · 4 cards",
    cta: "Notify the owner",
    alert: "I have found your wallet and it is safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "card", line1: "Fraud", line2: "Helpline", action: { kind: "call", number: "1930", who: "Cyber fraud helpline", via: "public" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "The fastest way to stop someone cancelling their whole day.",
        bullets: [
          "They see your pin, never your phone number",
          "Push, SMS and WhatsApp go out together",
        ],
        actions: [
          { label: "Alert the owner now", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found it", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "card",
        title: "Block the Cards",
        sub: "Freeze first, collect later",
        tint: "rose",
        lead: "Tell them to freeze the cards even though the wallet is safe.",
        bullets: [
          "Every bank app has an instant freeze that is reversible",
          "Freezing costs nothing and is undone on collection",
          "Never read the card numbers out to anyone, owner included",
        ],
        actions: [
          { label: "Tell them to freeze the cards", style: "wa", action: { kind: "notify", text: "Your wallet is safe with me — freeze your cards in your bank app anyway until you have it back." } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "shield",
        title: "Fraud Helpline",
        sub: "Cyber crime 1930",
        tint: "violet",
        lead: "If money has already moved, the first hour matters most.",
        bullets: [
          "1930 is the national cyber and financial fraud helpline",
          "Reporting inside 24 hours is what makes a reversal possible",
        ],
        actions: [
          { label: "Call Cyber fraud helpline · 1930", style: "primary", action: { kind: "call", number: "1930", who: "Cyber fraud helpline", via: "public" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "There may already be fraud on your cards — report it on 1930 straight away." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Hand over safely",
        tint: "blue",
        lead: "A wallet with cash inside is safest logged at a station.",
        bullets: [
          "Found property is recorded against the tag code",
          "The owner is told which station holds the wallet",
        ],
        actions: [
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody replied, so I am depositing your wallet at the nearest police station." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "parcel",
        title: "Courier Return",
        sub: "Owner pays pickup",
        tint: "cream",
        lead: "A courier collects the wallet from wherever you are.",
        bullets: [
          "Pickup and shipping are paid by the owner",
          "You get a receipt for the handover",
        ],
        actions: [
          { label: "Call Courier pickup · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Courier pickup", via: "partner" } },
          { label: "Send my pickup address", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I can hand your wallet to a courier — send the pickup and I will keep it safe." } },
        ],
      },
      {
        icon: "note",
        title: "Owner’s Note",
        sub: "Message left for you",
        tint: "mint",
        lead: "Left on the tag for whoever finds it.",
        bullets: [
          "\"Thank you for stopping — please just message me here.\"",
          "\"A reward is arranged through RepiQR, no cash needed.\"",
        ],
        actions: [
          { label: "Reply on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Reply to the owner", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
    ],
    owner: "Message Wallet Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found on the seat at the bus stand...",
    aiHello: "Thanks for stopping. Where did you find the wallet?",
    ai: [
      ["Should they block the cards?", "Yes, straight away. A freeze in the bank app is instant and reversible — it costs nothing and it is undone the moment they have the wallet back."],
      ["There is cash inside", "Do not count it out in public and do not remove anything. Hand the wallet in as it is, at a police station if you cannot wait."],
      ["Money has already been spent", "Tap Fraud Helpline and call 1930. Reporting inside the first 24 hours is what makes a reversal possible."],
      ["Is there a reward?", "Rewards are arranged inside RepiQR by the owner. You never have to negotiate or share bank details with a stranger."],
    ],
  },
  keychain: {
    label: "Keychain",
    module: "Luggage & Travel module",
    tone: "calm",
    heroIcon: "key",
    beacon: "key",
    title: "You found someone's keys",
    sub: "Thanks for stopping — let's get them back safely",
    tagline: "Keychain tag · 3 keys · blue fob",
    cta: "Notify the owner",
    alert: "I have found your keys and they are safe with me right now.",
    mini: [
      { icon: "pin", line1: "Share Live", line2: "Location", action: { kind: "pin" } },
      { icon: "bell", line1: "Notify", line2: "Owner", action: { kind: "notify", text: undefined } },
      { icon: "box", line1: "Nearest", line2: "Drop Point", action: { kind: "maps", query: "safe drop point near me" } },
    ],
    tiles: [
      {
        icon: "bell",
        title: "Notify Owner",
        sub: "Instant alert",
        tint: "amber",
        lead: "The owner learns their keys are found before they panic.",
        bullets: [
          "They see your pin, never your phone number",
          "Alerts go out by push, SMS and WhatsApp together",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Attach where I found them", style: "blue", action: { kind: "pin" } },
          { label: "Write a message instead", style: "ghost", action: { kind: "write" } },
        ],
      },
      {
        icon: "box",
        title: "Drop Point",
        sub: "Nearest safe spot",
        tint: "cream",
        lead: "Partner shops and desks hold keys until collection.",
        bullets: [
          "Quote the tag code when you hand them over",
          "The owner is told the exact drop point",
        ],
        actions: [
          { label: "Find a drop point near me", style: "blue", action: { kind: "maps", query: "safe drop point near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I am leaving your keys at a RepiQR drop point nearby." } },
          { label: "Share where I am", style: "blue", action: { kind: "pin" } },
        ],
      },
      {
        icon: "police",
        title: "Nearest Police",
        sub: "Hand over safely",
        tint: "blue",
        lead: "Always available, always logged.",
        bullets: [
          "Found property is recorded against the tag code",
          "The owner is told which station holds the keys",
        ],
        actions: [
          { label: "Find the nearest police station", style: "blue", action: { kind: "maps", query: "police station near me" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "Nobody replied, so I am depositing your keys at the nearest police station." } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
      {
        icon: "parcel",
        title: "Courier Return",
        sub: "Free pickup",
        tint: "sky",
        lead: "A courier collects the keys from you.",
        bullets: [
          "Pickup and shipping are paid by the owner",
          "You get a receipt for the handover",
        ],
        actions: [
          { label: "Call Courier pickup · 1800 200 4004", style: "primary", action: { kind: "call", number: "1800 200 4004", who: "Courier pickup", via: "partner" } },
          { label: "Send my pickup address", style: "blue", action: { kind: "pin" } },
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: "I can hand your keys to a courier — send the pickup and I will keep them safe." } },
        ],
      },
      {
        icon: "note",
        title: "Owner's Note",
        sub: "Message left for you",
        tint: "violet",
        lead: "Left on the tag for whoever finds it.",
        bullets: [
          "\"Thank you — the house key is on this ring, please do not delay.\"",
          "\"A reward is arranged through RepiQR, no cash needed.\"",
        ],
        actions: [
          { label: "Alert the owner on WhatsApp", style: "wa", action: { kind: "notify", text: undefined } },
          { label: "Reply to the owner", style: "ghost", action: { kind: "write" } },
          { label: "Ask the RepiQR assistant", style: "ghost", action: { kind: "ask" } },
        ],
      },
      {
        icon: "flag",
        title: "Report Issue",
        sub: "Something looks wrong",
        tint: "rose",
        lead: "Damaged tag, wrong details or a suspicious situation.",
        bullets: [
          "Support reviews the tag and contacts the owner",
          "Use 112 instead if anyone is in danger",
        ],
        actions: [
          { label: "Call RepiQR support · 1800 123 4567", style: "primary", action: { kind: "call", number: "1800 123 4567", who: "RepiQR support", via: "support" } },
          { label: "Describe the problem", style: "ghost", action: { kind: "write" } },
          { label: "Call Emergency (all services) · 112", style: "ghost", action: { kind: "call", number: "112", who: "Emergency (all services)", via: "public" } },
        ],
      },
    ],
    owner: "Message Key Owner",
    ownerSub: "Send a direct alert via WhatsApp",
    placeholder: "e.g. Found near Thangadh bus stand",
    aiHello: "Thanks for stopping. Where did you find the keys?",
    ai: [
      ["I cannot wait here", "Use Drop Point or Nearest Police. Either way the owner is told exactly where their keys are before you walk away."],
      ["Can they see my number?", "No. WhatsApp is opened on your phone with a draft — you choose whether to send it, and the owner never gets your number from the tag."],
      ["What if it is a house key?", "Do not hold on to it longer than you have to. A drop point or police station is safer for the owner than a stranger keeping it overnight."],
      ["Is there a reward?", "Rewards are arranged inside RepiQR by the owner, so no cash or bank details change hands."],
    ],
  },
};

/** Categories that already have their own bespoke screen inside ScanPage. */
export const BESPOKE_CATEGORIES = ["car", "bike"] as const;

/**
 * Resolve the variant for a QR's category. Unknown or missing categories fall
 * back to `car`, which is the one every legacy sticker was minted as.
 */
export function getCategoryVariant(category?: string | null): CategoryVariant {
  const key = (category || "").trim().toLowerCase();
  return byKey[key] || CATEGORY_VARIANTS.car;
}

export function hasCategoryVariant(category?: string | null): boolean {
  return Boolean(byKey[(category || "").trim().toLowerCase()]);
}

const byKey = CATEGORY_VARIANTS as Record<string, CategoryVariant | undefined>;
