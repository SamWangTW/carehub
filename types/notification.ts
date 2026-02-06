import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(["appointment", "patient_alert", "message"]),
  title: z.string(),
  body: z.string().optional(),
  createdAt: z.string(),
  href: z.string().optional(),
  readAt: z.string().nullable().optional(),
});

export const notificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
