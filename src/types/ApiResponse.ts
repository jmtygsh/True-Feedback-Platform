// this file work for only to check types not a real reponse
import { Message } from "@/models/User";

export interface ApiResponse {
  success: boolean;
  message: string;
  isAcceptingMessages?: boolean;
  messages?: Array<Message>
}
