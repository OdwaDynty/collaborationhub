import { z } from "zod";

export const uploadFileSchema = z.object({
  channelId: z.string().uuid("Select a channel."),
});

export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB