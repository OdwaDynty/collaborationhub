import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  content: z.string().trim().min(1, "Content is required.").max(5000),
  scope: z.enum(["organization", "department"]),
  department_id: z.string().uuid().optional(),
});

export const createAnnouncementCommentSchema = z.object({
  announcementId: z.string().uuid(),
  content: z.string().trim().min(1, "Comment can't be empty.").max(1000),
});