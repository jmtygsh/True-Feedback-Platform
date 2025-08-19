
# Next.js, MongoDB & Auth.js Authentication Guide

This guide provides a comprehensive walkthrough for setting up a modern, secure authentication system in a **Next.js 15+ (App Router)** project using **MongoDB** and **Auth.js (v5)**.

The architecture separates concerns between the server (Node.js runtime), the edge (Middleware), and the client, following the latest best practices.


## 🚀 Prerequisites

Before you begin, ensure you have:
- A Next.js project initialized.
- A MongoDB database and its connection URI.
- Node.js installed on your machine.


## 📦 Installation

Install the necessary libraries for authentication, database connection, and password hashing.

```bash
npm install next-auth@beta mongoose bcrypt
npm install --save-dev @types/bcrypt

# Generate a strong secret of AUTH_SECRET
npx auth secret  

```

## 🔑 Environment Setup
Create a .env.local file in the root of your project. This file is for your secret keys and should never be committed to Git.

```bash
# .env.local

# Generate a strong secret with: openssl rand -base64 32
AUTH_SECRET="your-super-strong-secret-key"

# Your MongoDB connection string
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/your_db_name"
```

## 📁 Project Structure
This file structure keeps your authentication logic organized.

```bash
.
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── providers.tsx
│   └── layout.tsx
├── lib/
│   └── dbConnection.ts
├── models/
│   └── User.ts
├── types/
│   └── next-auth.d.ts
├── auth.config.ts
├── auth.ts
├── middleware.ts
└── .env.local

```

## ⚙️ Step-by-Step Configuration

Step 1: The Core Logic (auth.ts)

This is the main server-side configuration. It handles database connections, password verification, and enriching the session token with user data.

```bash TypeScript


// Import the main NextAuth library to set up authentication.
import NextAuth from "next-auth";  


// Import the Credentials provider, which allows users to log in with an email and password.
import Credentials from "next-auth/providers/credentials"; 


// Import bcrypt for securely comparing the user's password with the hashed password in the database.
import bcrypt from "bcrypt";


// Import the base configuration file. This file is "Edge-safe," meaning it doesn't
// contain any code that relies on the Node.js environment. It's used by the middleware.

// this is need to add more providers  
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


``` 

Step 2: The Edge-Safe Config (auth.config.ts)

This is a lightweight version of your config, safe to run in the middleware's Edge runtime. It cannot contain any Node.js-specific code.

``` bash TypeScript
// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [], // The Credentials provider is in auth.ts
  pages: {
    signIn: "/sign-in", // Your custom login page URL
  },
} satisfies NextAuthConfig;

```

Step 3: The Bouncer (middleware.ts)

This file protects your routes. It checks if a user is logged in and redirects them accordingly.

``` bash TypeScript
// perfectly safe for the Edge environment

import NextAuth from "next-auth";
import authConfig from "./auth.config";
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute =
    nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up") ||
    nextUrl.pathname.startsWith("/verify") ||
    nextUrl.pathname === "/";

  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");

  // Logic 1: If the user is logged in, redirect them from auth routes to the dashboard.
  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Logic 2: If the user is not logged in, redirect them from protected routes to the sign-in page.
  if (!isLoggedIn && isProtectedRoute) {
    return Response.redirect(new URL("/sign-in", nextUrl));
  }

  // If neither of the above conditions is met, allow the request to proceed.
  return;
});

// This config applies the middleware to the specified routes.
export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/", "/verify/:path*"],
};

```

Step 4: The Client Helper (app/providers.tsx)

To use the useSession() hook in your client components, you must wrap your app in a SessionProvider.

``` bash
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

```


Now, use it in your main layout:

``` bash
import Providers from "@/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

Step 5: The API Mailbox (app/api/auth/[...nextauth]/route.ts)

This simple file creates the API endpoint that Auth.js uses for all its background operations.

``` bash
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```


Step 6: Login / Register

I have use another folder controller controller.ts

``` bash

"use server";

import { signIn, signOut } from "@/auth";

// logout
export async function doLogout() {
  await signOut({ redirectTo: "/" });
}

// login with email and password
export async function doCredentialLogin(formData: FormData) {
  try {
    const response = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return response;
  } catch (err) {
    throw err;
    
  }
}

```

Now, login page

``` bash
"use client";

import { doCredentialLogin } from "@/actions/controller";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SignInForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = () => {
    if (error) setError("");
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const response = await doCredentialLogin(formData);

      if (response?.error) {
        setError(response.error.message || "An unknown error occurred.");
      } else {
        router.push("/dashboard");
      }
    } catch (e: any) {
      console.error(e);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Welcome Back!</h1>
      <p>Sign in to continue to your account.</p>

      {error && <div role="alert">{error}</div>}

      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">Email or Username</label>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            required
            disabled={loading}
            onChange={handleInputChange}
            placeholder="Email or Username"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
            onChange={handleInputChange}
            placeholder="Password"
          />
        </div>

     
        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Sign In"}
          </button>
        </div>
      </form>

   
    </div>
  );
};

export default SignInForm;
```


















