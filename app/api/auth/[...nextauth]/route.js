import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user.js";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      const existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account.provider, // github
        });
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };
