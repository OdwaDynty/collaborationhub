import { z } from "zod";

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Channel name can't be empty.")
    .max(80, "Channel name can't exceed 80 characters."),
  description: z.string().trim().max(300).optional(),
  visibility: z.enum(["public", "private"]),
});

export const postChannelMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(2000, "Messages can't exceed 2000 characters."),
  parent_message_id: z.string().uuid().optional(),
});