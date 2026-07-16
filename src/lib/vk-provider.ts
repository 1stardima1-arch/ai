import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import type {
  TokenEndpointHandler,
  UserinfoEndpointHandler,
} from "@auth/core/providers/oauth";

/**
 * Custom VK ID (id.vk.com) OAuth 2.1 + PKCE provider for Auth.js.
 *
 * VK retired the old oauth.vk.com flow in favour of VK ID. The new flow
 * requires PKCE and echoes a `device_id` back on the callback that must be
 * replayed to the token endpoint — neither of those are handled by generic
 * OAuth defaults, so this provider is written by hand against VK ID's docs
 * (https://id.vk.com/business/go/docs/vkid/latest/methods-reference/auth/auth-oauth2).
 * Verify against a real VK ID app before relying on it in production; VK
 * occasionally adjusts field names on this endpoint.
 */
export interface VKProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  email?: string;
}

export default function VKId(
  config: OAuthUserConfig<VKProfile>
): OAuthConfig<VKProfile> {
  return {
    id: "vk",
    name: "VK",
    type: "oauth",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    checks: ["pkce", "state"],
    authorization: {
      url: "https://id.vk.com/authorize",
      params: { response_type: "code", scope: "email" },
    },
    token: {
      url: "https://id.vk.com/oauth2/auth",
      async request({ params, provider, checks }: Parameters<NonNullable<TokenEndpointHandler["request"]>>[0]) {
        const p = params as Record<string, string | undefined>;
        const c = checks as { code_verifier?: string };
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          code: String(p.code ?? ""),
          client_id: String(provider.clientId ?? ""),
          client_secret: String(provider.clientSecret ?? ""),
          redirect_uri: String(provider.callbackUrl ?? ""),
          code_verifier: String(c.code_verifier ?? ""),
          device_id: String(p.device_id ?? ""),
          state: String(p.state ?? ""),
        });

        const res = await fetch("https://id.vk.com/oauth2/auth", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (!res.ok) {
          throw new Error(`VK ID token exchange failed: ${res.status} ${await res.text()}`);
        }

        const tokens = await res.json();
        return { tokens };
      },
    },
    userinfo: {
      url: "https://id.vk.com/oauth2/user_info",
      async request({ tokens, provider }: Parameters<NonNullable<UserinfoEndpointHandler["request"]>>[0]) {
        const body = new URLSearchParams({
          access_token: String(tokens.access_token ?? ""),
          client_id: String(provider.clientId ?? ""),
        });
        const res = await fetch("https://id.vk.com/oauth2/user_info", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const data = await res.json();
        return data.user as VKProfile;
      },
    },
    profile(profile) {
      return {
        id: profile.user_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        email: profile.email ?? null,
        image: profile.avatar ?? null,
      };
    },
    style: { bg: "#0077FF", text: "#fff" },
  };
}
