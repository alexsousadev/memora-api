import { z } from "zod";

export const reminderSchema = z.object({
    name: z.string(),
    date: z.string(),
    time: z.string(),
    repeat: z.boolean().optional(),
    repeatDays: z.string().optional().nullable(),
    userId: z.number().optional(),
});

export type Reminder = z.infer<typeof reminderSchema>;
