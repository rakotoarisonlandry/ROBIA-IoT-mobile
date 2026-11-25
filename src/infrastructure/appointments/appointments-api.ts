import type {
  RemoteAppointment,
  LiveEvent,
  RemoteBookingInput,
  RemoteShop,
  RemoteSlot,
} from "../../application/booking/remote-appointments";
import { deviceToken } from "./device-token";

export type { LiveEvent };

/** Parses one Server-Sent Events block (`event:` and `data:` lines). */
export function parseSseBlock(block: string): LiveEvent | null {
  let type = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) type = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  try {
    return { type, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

const decoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
/** Event payloads are ASCII JSON, so a byte-wise fallback is enough without TextDecoder. */
function decodeChunk(value: Uint8Array | undefined) {
  if (!value) return "";
  return decoder ? decoder.decode(value, { stream: true }) : String.fromCharCode(...value);
}

export class AppointmentsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function createAppointmentsApi(
  baseUrl: string | undefined,
  store = deviceToken,
  request: typeof fetch = fetch,
) {
  const url = baseUrl?.trim().replace(/\/+$/, "") ?? "";
  let identityPending: Promise<string> | null = null;
  const call = async <T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> => {
    if (
      !url ||
      (!url.startsWith("https://") &&
        !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url))
    )
      throw new AppointmentsApiError(
        0,
        "Le service de rendez-vous n’est pas configuré.",
      );
    let response: Response;
    try {
      response = await request(`${url}/appointments${path}`, options);
    } catch {
      throw new AppointmentsApiError(
        0,
        "Connexion au service de rendez-vous impossible.",
      );
    }
    if (!response.ok)
      throw new AppointmentsApiError(
        response.status,
        response.status === 409
          ? "Ce créneau n’est plus disponible."
          : response.status === 401
          ? "Votre accès a expiré. Récupérez votre accès par e-mail."
          : "Le service de rendez-vous est indisponible.",
      );
    try {
      return (await response.json()) as T;
    } catch {
      throw new AppointmentsApiError(0, "Réponse du serveur invalide.");
    }
  };
  const json = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const identity = async () => {
    const existing = await store.get();
    if (existing) return existing;
    if (!identityPending)
      identityPending = (async () => {
        const created = await call<{ token: string }>("/devices", {
          method: "POST",
        });
        if (!/^[A-Za-z0-9_-]{43}$/.test(created.token))
          throw new AppointmentsApiError(0, "Réponse du serveur invalide.");
        await store.save(created.token);
        return created.token;
      })().finally(() => {
        identityPending = null;
      });
    return identityPending;
  };
  const authorized = async <T>(path: string, options: RequestInit = {}) => {
    const token = await identity();
    return call<T>(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  };
  /**
   * Live stream of the customer's booking changes and public availability.
   * Reconnects with backoff; returns a function that stops it.
   * On Android and iOS the global fetch is expo/fetch, which streams bodies.
   */
  const subscribe = (
    onEvent: (event: LiveEvent) => void,
    onStatus?: (live: boolean) => void,
  ) => {
    let stopped = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const loop = async () => {
      while (!stopped) {
        try {
          const token = await identity();
          controller = new AbortController();
          const response = await request(`${url}/appointments/events`, {
            headers: { Accept: "text/event-stream", Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
          attempt = 0;
          onStatus?.(true);
          const reader = response.body.getReader();
          let buffer = "";
          for (;;) {
            const { value, done } = await reader.read();
            if (done || stopped) break;
            buffer = (buffer + decodeChunk(value)).replace(/\r\n/g, "\n");
            let end: number;
            while ((end = buffer.indexOf("\n\n")) >= 0) {
              const event = parseSseBlock(buffer.slice(0, end));
              buffer = buffer.slice(end + 2);
              if (event && event.type !== "ping") onEvent(event);
            }
          }
        } catch {
          /* Network drop, background or server restart: retry below. */
        }
        onStatus?.(false);
        if (stopped) break;
        attempt += 1;
        await new Promise((resolve) => {
          timer = setTimeout(resolve, Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)));
        });
      }
    };
    if (url) void loop();
    return () => {
      stopped = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  };
  return {
    configured: !!url,
    subscribe,
    shops: () => call<RemoteShop[]>("/shops"),
    slots: (shopId: string) =>
      call<RemoteSlot[]>(`/shops/${encodeURIComponent(shopId)}/slots`),
    list: () => authorized<RemoteAppointment[]>("/mine"),
    registerPushToken: (token: string) =>
      authorized<{ registered: boolean }>(
        "/devices/push-token",
        json({ token }),
      ),
    removePushToken: () =>
      authorized<{ removed: boolean }>("/devices/push-token", {
        method: "DELETE",
      }),
    createAssistedRecovery: (locationId: string) =>
      authorized<{ id: string; expiresAt: string }>(
        "/recovery/assisted",
        json({ locationId }),
      ),
    assistedRecoveryStatus: (id: string) =>
      authorized<{ status: "pending" | "completed" | "expired" }>(
        `/recovery/assisted/${encodeURIComponent(id)}`,
      ),
    book: async (input: RemoteBookingInput) => {
      const choice = JSON.stringify([
        input.slotId,
        input.customerName,
        input.phone ?? "",
        input.serviceIds,
      ]);
      const stored = await store.pending();
      let prior: { choice: string; key: string } | null = null;
      if (stored) {
        try {
          prior = JSON.parse(stored);
        } catch {
          throw new AppointmentsApiError(
            0,
            "Impossible de vérifier la demande précédente.",
          );
        }
      }
      const key =
        prior?.choice === choice && typeof prior.key === "string"
          ? prior.key
          : input.idempotencyKey;
      await store.savePending(JSON.stringify({ choice, key }));
      const result = await authorized<RemoteAppointment>(
        "",
        json({ ...input, idempotencyKey: key }),
      );
      await store.clearPending().catch(() => {});
      return result;
    },
    cancel: (id: string) =>
      authorized<{ id: string; status: string }>(
        `/${encodeURIComponent(id)}/cancel`,
        { method: "POST" },
      ),
    requestEmailVerification: (email: string) =>
      authorized<{ message: string }>("/email/verify/request", json({ email })),
    verifyEmail: (email: string, code: string) =>
      authorized<{ verified: boolean }>("/email/verify", json({ email, code })),
    requestRecovery: (email: string) =>
      call<{ message: string }>("/email/recover/request", json({ email })),
    recover: async (email: string, code: string) => {
      const result = await call<{ token: string }>(
        "/email/recover",
        json({ email, code }),
      );
      if (!/^[A-Za-z0-9_-]{43}$/.test(result.token))
        throw new AppointmentsApiError(0, "Réponse du serveur invalide.");
      await store.save(result.token);
    },
  };
}
