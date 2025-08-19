import { Resend } from "resend";

export const resendLib = new Resend(process.env.RESEND_API_KEY);

