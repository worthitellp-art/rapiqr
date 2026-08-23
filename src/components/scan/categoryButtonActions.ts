/**
 * The single entry point every category scan-page button goes through.
 *
 * `tileActions.ts` decides WHICH buttons a tile shows; this decides what
 * pressing one does. Both exist so a new category needs a config entry, not new
 * handler code.
 *
 * Nothing here talks to a phone network or a database directly — it reuses the
 * routes the app already has:
 *   SERVICE_PROVIDER → the admin helpline directory already preloaded by ScanPage
 *   SEND_SMS         → POST /api/alerts (with notifyContacts:false → owner only)
 *   CHAT_OWNER       → the existing RepiChat panel, via the caller's openChat
 */

import { apiClient } from "../../lib/apiClient";
import { resolveServiceProviders, type CategoryActionType, type ServiceProvider } from "./tileActions";

/** Matches the generic shape asked for in task.md. */
export interface CategoryActionParams {
  actionType: CategoryActionType;
  tagId: string;
  category: string;
  serviceType?: string;
  message?: string;
  /** Stable id for this issue — becomes the alert `type` in the admin feed. */
  issue?: string;
}

/** Everything the handler needs from the surrounding scan page. */
export interface CategoryActionDeps {
  /** Active providers, already fetched once by ScanPage on mount. */
  providers: ServiceProvider[];
  location?: { lat: number; lng: number; accuracy: number } | null;
  qrUrl?: string;
  tagName?: string;
  tagNumber?: string;
  /** Ties the alert to the visitor's RepiChat thread so it lands in the owner's inbox. */
  customerToken?: string;
  visitorName?: string;
  /** Opens the RepiChat panel, optionally pre-filling the first message. */
  openChat: (message?: string) => void;
  /** Reveals the resolved provider list inside the open tile sheet. */
  showProviders: (result: { serviceType: string; providers: ServiceProvider[] }) => void;
}

/* Discriminated on `kind` rather than a boolean `ok`: this tsconfig runs without
   `strict`, where boolean-literal discriminants don't narrow reliably. */
export type CategoryActionResult =
  | { kind: "providers"; providers: ServiceProvider[] }
  | { kind: "sms"; ownerNotified: boolean; simulated: boolean; message: string }
  | { kind: "chat" }
  | { kind: "error"; message: string };

export const NO_PROVIDER_MESSAGE = "No service provider is currently available.";

/**
 * Run one button.
 *
 * SERVICE_PROVIDER → match an active provider for this service type + sticker
 *                    category, then show its name and number to call.
 * SEND_SMS         → resolve the owner from the scanned tag server-side and SMS
 *                    them this button's message. Never the contact list, never
 *                    exposing either number.
 * CHAT_OWNER       → open or resume the RepiChat thread for this tag.
 */
export async function handleCategoryButtonAction(
  params: CategoryActionParams,
  deps: CategoryActionDeps
): Promise<CategoryActionResult> {
  const { actionType, tagId, category, serviceType, message, issue } = params;

  switch (actionType) {
    case "SERVICE_PROVIDER": {
      if (!serviceType) return { kind: "error", message: NO_PROVIDER_MESSAGE };

      const providers = resolveServiceProviders(deps.providers, serviceType, category);
      if (providers.length === 0) return { kind: "error", message: NO_PROVIDER_MESSAGE };

      deps.showProviders({ serviceType, providers });
      return { kind: "providers", providers };
    }

    case "SEND_SMS": {
      if (!tagId) return { kind: "error", message: "This tag couldn't be identified — try scanning again." };

      const body = (message || "").trim();
      if (!body) return { kind: "error", message: "This button has no message configured." };

      try {
        const res = await apiClient.alerts.createAlert({
          qrId: tagId,
          qrUrl: deps.qrUrl,
          latitude: deps.location?.lat || 0,
          longitude: deps.location?.lng || 0,
          accuracy: deps.location?.accuracy || 0,
          deviceId: navigator.userAgent.slice(0, 40),
          timestamp: new Date().toISOString(),
          message: body,
          vehicleName: deps.tagName,
          vehicleNumber: deps.tagNumber,
          customerName: deps.visitorName,
          // Puts the same text into the visitor's thread, so the chat link in
          // the owner's SMS opens onto the message rather than an empty room.
          customerToken: deps.customerToken,
          type: issue || "contact_owner",
          // The whole point of SEND_SMS: the owner, and nobody else.
          notifyContacts: false,
        });

        return {
          kind: "sms",
          ownerNotified: Boolean(res.smsResult?.sent),
          simulated: Boolean(res.smsResult?.simulated),
          message: body,
        };
      } catch {
        return { kind: "error", message: "Couldn't reach the server — the owner was not notified. Try again." };
      }
    }

    case "CHAT_OWNER": {
      if (!tagId) return { kind: "error", message: "This tag couldn't be identified — try scanning again." };
      deps.openChat(message);
      return { kind: "chat" };
    }

    default:
      return { kind: "error", message: "Unsupported action." };
  }
}
