import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (middleware).
 * Prisma / bcrypt yalnızca auth.ts içinde.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.companyId = user.companyId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roles =
          (token.roles as typeof session.user.roles) ?? [];
        session.user.permissions =
          (token.permissions as typeof session.user.permissions) ?? [];
        session.user.companyId =
          (token.companyId as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
