// Admin isn't a stored DB flag — it's derived from the logged-in email
// matching ADMIN_EMAILS, so granting/revoking access is a one-line env var
// change (no migration, no manual DB edit) rather than something that can
// get out of sync with who actually owns the inbox.
const DEFAULT_ADMIN_EMAILS = "dimitrystaristenko@gmail.com";

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
