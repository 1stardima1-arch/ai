import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Yandex from "next-auth/providers/yandex";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import VKId from "@/lib/vk-provider";

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
  providers.push(
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID,
      clientSecret: process.env.YANDEX_CLIENT_SECRET,
    })
  );
}

if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET) {
  providers.push(
    VKId({
      clientId: process.env.VK_CLIENT_ID,
      clientSecret: process.env.VK_CLIENT_SECRET,
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
