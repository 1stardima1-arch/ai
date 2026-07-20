import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verificationEmailHtml, verificationEmailText } from "@/lib/verification-email";

const providers: NextAuthConfig["providers"] = [];

// Passwordless email login: entering an email and clicking the link that
// arrives is both "sign in by email" and "email verification" in one step —
// no password to store/reset, no separate verified-email flag to track.
if (process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || "Балл <onboarding@resend.dev>",
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: "Вход в Балл",
            html: verificationEmailHtml(url),
            text: verificationEmailText(url),
          }),
        });
        if (!res.ok) {
          throw new Error("Resend error: " + JSON.stringify(await res.json()));
        }
      },
    })
  );
}

if (process.env.ENABLE_DEMO_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "demo",
      name: "Демо-вход",
      credentials: {
        name: { label: "Имя", type: "text" },
      },
      async authorize(credentials) {
        const name = (credentials?.name as string)?.trim() || "Гость";
        const email = `demo-${name.toLowerCase().replace(/\s+/g, "-")}@demo.local`;

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name, image: null },
        });

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
});
