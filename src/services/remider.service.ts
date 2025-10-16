import { Reminder } from "../schemas/reminder";
import { db } from "../database/db";
import { reminders, scheduleDayWeeks } from "../database/schema";
import { eq } from "drizzle-orm";
import reminderMapper from "../helpers/reminder-mapper.ts";

class ReminderService {
    private static instance: ReminderService;

    private constructor(){
    }

    public static getInstance(): ReminderService {
        if (!ReminderService.instance) {
            ReminderService.instance = new ReminderService();
        }
        return ReminderService.instance;
    }

    async addReminder(reminder: Reminder, weekDays?: string[]){
        // Insert reminder
        const newReminder = await db.insert(reminders).values(reminder).returning();
        const createdReminder = newReminder[0];

        // If weekly reminder and has week days, create relations
        if (weekDays && weekDays.length > 0) {
            const schedulePromises = weekDays.map(async (dayName) => {
                const dayId = await reminderMapper.getDayId(dayName);
                if (dayId) {
                    return db.insert(scheduleDayWeeks).values({
                        dayId: dayId,
                        scheduleId: createdReminder.id
                    });
                }
            });

            await Promise.all(schedulePromises);
        }

        return createdReminder;
    }

    async getReminderById(id: number){
        const reminder = await db.select().from(reminders).where(eq(reminders.id, id));
        return reminder;
    }

    async getAllReminders(){
        const allReminders = await db.select().from(reminders);
        return allReminders;
    }
}

export default ReminderService.getInstance();