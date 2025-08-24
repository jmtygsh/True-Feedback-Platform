"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="text-white">
      {session ? (
        <>
          <p>Welcome back, {user.username || user.email}!</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Logout
          </button>
        </>
      ) : (
        <Link
          href="/sign-in"
          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Login
        </Link>
      )}
    </div>
  );
}
