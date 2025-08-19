import { z } from "zod";
export const usernameValidationSchema = z
  .string()
  .min(2, "username must be at least 2 characters long")
  .max(20, "username must be no more than 20 characters long")
  .trim()
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "username can only contain letters, numbers, and underscores not special character"
  );

export const signUpSchema = z.object({
  username: usernameValidationSchema,
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" })
});
