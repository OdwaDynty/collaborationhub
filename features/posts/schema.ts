import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content can't be empty.")
    .max(2000, "Posts can't exceed 2000 characters."),
  scope: z.enum(["organization", "department"]),
});