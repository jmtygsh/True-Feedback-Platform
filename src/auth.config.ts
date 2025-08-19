import type { NextAuthConfig } from "next-auth";

// ✅ bcrypt and a database connection, which are NOT Edge-compatible.
// database is mongoDB, so we need to use Node.js runtime
// Edge-Safe can be used with other providers like Google, GitHub, etc.

export default {
  providers: [],
  pages: {
    signIn: "/sign-in", 
  },
} satisfies NextAuthConfig;
