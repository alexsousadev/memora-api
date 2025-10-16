import { z } from "zod";

export const reminderSchema = z.object({
    userId: z.number().optional(),
    typeReminderId: z.number(),
    categoryId: z.number(),
    soundReminderId: z.number().optional(),
    title: z.string(),
    initialDate: z.string().optional(),
    endDate: z.string().optional(),
    timeDay: z.string(),
});

export type Reminder = z.infer<typeof reminderSchema>;