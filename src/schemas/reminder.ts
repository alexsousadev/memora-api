import { z } from "zod";

export const reminderSchema = z.object({
    title: z.string(),
    content: z.string(),
    date: z.string(),
    hour: z.string(),
    userId: z.number(),
});

export type Reminder = z.infer<typeof reminderSchema>;