/** Configuration safe for Next.js Proxy's Edge runtime. */
const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // Auth.js v5 expects this array during its Edge initialization.
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/LoginPage",
    error: "/LoginPage",
  },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth);
    },
  },
};

export default authConfig;
