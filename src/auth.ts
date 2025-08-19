// Import the main NextAuth library to set up authentication.
import NextAuth from "next-auth";

// Import the Credentials provider, which allows users to log in with an email and password.
import Credentials from "next-auth/providers/credentials";


// Import bcrypt for securely comparing the user's password with the hashed password in the database.
import bcrypt from "bcrypt";

// Import the base configuration file. This file is "Edge-safe," meaning it doesn't
// contain any code that relies on the Node.js environment. It's used by the middleware.

import authConfig from "./auth.config";
import connectToDatabase from "./lib/dbConnection";
import UserModel from "./models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Start with the base configuration from auth.config.ts.
  // This ensures any settings there (like custom pages or providers safe for the Edge) are included.
  ...authConfig,

  // Define the session strategy. 'jwt' (JSON Web Token) is a stateless method
  // where the user's session data is stored in a self-contained token, not in a database.
  session: { strategy: "jwt" },

  // Add the authentication providers. This array is where all providers that
  // depend on the Node.js environment (like database access) should go.
  providers: [
    // Include any providers that might have been defined in the base authConfig.
    ...authConfig.providers,

    // Set up the Credentials provider for traditional email and password login.
    Credentials({
      // The input field on the form is still 'email', but we'll treat it
      // as either an email or a username on the backend
      credentials: {
        email: {},
        password: {},
      },

      // This is the core function where you verify the user's credentials against your database.
      // It runs ONLY on the server when a user tries to sign in with this provider.
      async authorize(credentials) {
        if (credentials === null) return null;

        // 1. We'll call the input 'identifier' to make it clear it can be an email or username.
        const { email: identifier, password } = credentials;

        await connectToDatabase();

        try {
          // 2. Use the '$or' operator to find a user where EITHER the email OR the username matches the identifier.
          const user = await UserModel.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          });

          if (!user) {
            // Use a more generic error message now.
            throw new Error("No user found with this email or username");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your account before logging in");
          }

          const isPasswordCorrect = await bcrypt.compare(
            password as string,
            user.password
          );

          if (isPasswordCorrect) {
            return user;
          } else {
            throw new Error("Incorrect password");
          }
        } catch (error: any) {
          throw new Error(
            error.message || "An error occurred during authentication."
          );
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString(); // Convert ObjectId to string
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
      }
      return session;
    },
  },
});
