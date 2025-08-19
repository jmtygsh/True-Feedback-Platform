import { z } from "zod";

export const signInSchema = z.object({
  username: z.string(),
  Password: z.string(),
});
