"use server";

import { signIn, signOut } from "@/auth";

// logout
export async function doLogout() {
  await signOut({ redirectTo: "/" });
}

// login with email and password
export async function doCredentialLogin(formData: FormData) {
  console.log("formData", formData);

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
