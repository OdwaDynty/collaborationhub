import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1, "Comment can't be empty.").max(1000),
});