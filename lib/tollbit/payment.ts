import { randomUUID } from "node:crypto";
import { VERSION } from "./contracts";
export class FunctionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type RuntimeConfig = { orgId?: string; redeemUrl?: string };
export function runtimeConfig(): RuntimeConfig {
  return {
    orgId: process.env.TOLLBIT_AGENT_FUNCTION_ORG_ID,
    redeemUrl: process.env.TOLLBIT_PAYMENT_TOKEN_REDEEM_URL,
  };
}
export async function redeem(
  request: Request,
  slug: string,
  operationId: string,
  config: RuntimeConfig,
  fetcher: typeof fetch = fetch,
  version: string = VERSION,
) {
  const token = request.headers.get("x-tollbit-agent-payment-token")?.trim();
  if (!token)
    throw new FunctionError(
      402,
      "A TollBit payment token is required, including for free calls.",
    );
  let rid: unknown;
  try {
    const parts = token.split(".");
    if (
      parts.length !== 3 ||
      parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
    )
      throw new Error();
    rid = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))?.payee
      ?.rid;
    if (typeof rid !== "string" || !rid.trim()) throw new Error();
  } catch {
    throw new FunctionError(401, "Malformed TollBit payment token.");
  }
  if (!config.orgId || !config.redeemUrl)
    throw new FunctionError(
      503,
      "TollBit payment runtime is not configured. Run tollbit dev functions scaffold-info and configure the service.",
    );
  const expected = `${config.orgId}/${slug}/${version}/${operationId}`;
  if (rid !== expected)
    throw new FunctionError(
      403,
      "The payment token does not authorize this function version and operation.",
    );
  // Decoding claims is only a routing check. TollBit verifies authenticity and
  // single-use redemption; no capability executes based on decoded claims alone.
  let response: Response;
  try {
    response = await fetcher(config.redeemUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        rid: expected,
        idempotencyKey: randomUUID(),
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    throw new FunctionError(502, "TollBit payment redemption is unavailable.");
  }
  if (!response.ok) {
    if (response.status === 403)
      throw new FunctionError(403, "TollBit did not authorize this operation.");
    if ([400, 401, 402, 404, 409, 422].includes(response.status))
      throw new FunctionError(401, "TollBit rejected the payment token.");
    throw new FunctionError(502, "TollBit payment redemption failed.");
  }
  try {
    const receipt = await response.json();
    if (
      response.status !== 200 ||
      receipt?.status !== "redeemed" ||
      !["standard", "waived", "none"].includes(receipt.settlement)
    )
      throw new Error();
  } catch {
    throw new FunctionError(
      502,
      "TollBit returned an unexpected redemption response.",
    );
  }
}
