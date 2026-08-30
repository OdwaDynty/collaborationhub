import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(2000, "Messages can't exceed 2000 characters."),
  parent_message_id: z.string().uuid().optional(),
});