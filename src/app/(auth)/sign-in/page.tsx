"use client";

import { doCredentialLogin } from "@/actions/controller";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // 👈 important


const SignInForm = () => {
  const router = useRouter();
  const { update } = useSession(); // 👈 gives you the update() function

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
        toast.success(response?.message || "Login successful!");

        // 🔑 Refresh session immediately so Navbar updates
        await update();

        // Then redirect
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Email/Username Input */}
          <div className="relative">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-700 sr-only"
            >
              Email or Username
            </label>

            <input
              id="email"
              name="email"
              type="text"
              autoComplete="email"
              required
              disabled={loading}
              onChange={handleInputChange}
              className="text-black/60 w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="Email or Username"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-700 sr-only"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              onChange={handleInputChange}
              className="text-black/60 w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              placeholder="Password"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-sm text-right">
            <a
              href="#"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </a>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <p className="text-sm text-center text-gray-600">
          Not a member?{" "}
          <a
            href="/sign-up"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up now
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
