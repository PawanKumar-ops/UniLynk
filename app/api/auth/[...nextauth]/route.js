import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export const authOptions = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    // 🔹 Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 10000, // prevents timeout issue
      },
    }),

    // 🔹 GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),

    // 🔹 Credentials (Email + Password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();

        const email = credentials.email.toLowerCase().trim();
        const user = await User.findOne({ email });

        if (!user) throw new Error("User not found");
        if (!user.password) throw new Error("No password set");

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) throw new Error("Wrong password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || "",
          image: user.img || "",
        };
      },
    }),
  ],

  callbacks: {
    // 🔐 SIGN IN CALLBACK (MERGED LOGIC)
    async signIn({ user, account }) {
  try {
    await connectDB();

    if (!user?.email) return false;

    const email = user.email.toLowerCase().trim();
    const nitDomain = "@nitkkr.ac.in";

    const rollNumber = email.endsWith(nitDomain)
      ? email.replace(nitDomain, "")
      : null;

    await User.findOneAndUpdate(
      { email },
      {
        email,
        name: user.name || "",
        img: user.image || "",
        provider: account?.provider || "credentials",
        rollNumber, // ✅ ALWAYS set it
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return true;
  } catch (error) {
    console.error("SIGN IN ERROR:", error);
    return false;
  }
}

  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
