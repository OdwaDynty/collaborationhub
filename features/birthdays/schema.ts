import { z } from "zod";

export const createBirthdayWishSchema = z.object({
  profileId: z.string().uuid(),
  content: z.string().trim().min(1, "Message can't be empty.").max(500),
});