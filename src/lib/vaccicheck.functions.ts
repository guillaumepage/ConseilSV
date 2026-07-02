import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Issues a short-lived signed token (HMAC-SHA256) that authorizes the current
 * ConseilSV user to open VacciCheck. VacciCheck verifies the token server-side
 * using the shared VACCICHECK_GATE_SECRET.
 *
 * Token format: base64url(payload).base64url(signature)
 * Payload: { sub, email, iat, exp }  (exp = 5 minutes)
 */
export const issueVacciCheckToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = process.env.VACCICHECK_GATE_SECRET;
    if (!secret) throw new Error("VACCICHECK_GATE_SECRET not configured");

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: context.userId,
      email: (context.claims as { email?: string } | undefined)?.email ?? null,
      iat: now,
      exp: now + 60 * 5,
    };

    const payloadB64 = base64url(JSON.stringify(payload));
    const sig = createHmac("sha256", secret).update(payloadB64).digest();
    const sigB64 = base64url(sig);

    return { token: `${payloadB64}.${sigB64}` };
  });
