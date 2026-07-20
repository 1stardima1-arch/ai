// RP ID must be the bare domain (no protocol/port) the site is actually
// served from — derived from NEXTAUTH_URL so this stays correct across
// local dev / preview / production without a separate env var to keep in
// sync. Passkeys are origin-bound: registering on one domain and later
// serving from a different one invalidates them.
function rpConfig() {
  const url = new URL(process.env.NEXTAUTH_URL || "http://localhost:3000");
  return { rpID: url.hostname, rpName: "Балл", origin: url.origin };
}

export const { rpID, rpName, origin } = rpConfig();

export function toBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

export function fromBase64Url(s: string) {
  return new Uint8Array(Buffer.from(s, "base64url"));
}
