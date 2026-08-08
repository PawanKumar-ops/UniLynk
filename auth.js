import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "@/auth.config";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

async function hydrateTokenFromDb(token) {
  if (!token?.email) return token;
  try {
    await connectDB();
    const dbUser = await User.findOne({ email: token.email }).lean();
    if (dbUser) {
      token.name = dbUser.name || token.name || "";
      token.picture = dbUser.img || token.picture || "";
      token.year = dbUser.year || token.year || "";
    }
  } catch (error) {
    console.error("JWT HYDRATE ERROR:", error);
  }
  return token;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        await connectDB();
        const user = await User.findOne({ email });
        if (!user?.password || !(await bcrypt.compare(password, user.password))) return null;
        return { id: user._id.toString(), email: user.email, name: user.name || "", image: user.img || "" };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      try {
        if (!user?.email) return false;
        await connectDB();
        const email = user.email.toLowerCase().trim();
        const nitDomain = "@nitkkr.ac.in";
        const rollNumber = email.endsWith(nitDomain) ? email.replace(nitDomain, "") : null;
        await User.findOneAndUpdate(
          { email },
          { email, name: user.name || "", img: user.image || "", provider: account?.provider || "credentials", rollNumber },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        return true;
      } catch (error) {
        console.error("SIGN IN ERROR:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/Onboarding`;
    },
    async jwt({ token }) {
      return hydrateTokenFromDb(token);
    },
    async session({ session, token }) {
      session.user ??= {};
      session.user.name = token.name || session.user.name || "";
      session.user.email = token.email || session.user.email || "";
      session.user.image = token.picture || session.user.image || "";
      session.user.year = token.year || session.user.year || "";
      return session;
    },
  },
});
