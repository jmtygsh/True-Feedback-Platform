import { z } from "zod";

export const signInSchema = z.object({
  content: z
    .string() 
    .min(10, { message: "Content must be at least 10 characters long" })
    .max(300, { message: "Content must be no more than 300 characters long" }),
});
