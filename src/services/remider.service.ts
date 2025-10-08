import { Reminder } from "../schemas/reminder";
import { db } from "../database/db";
import { reminders } from "../database/schema/reminder";
import { eq } from "drizzle-orm";

class ReminderService {
    constructor(){

    }

    async addReminder(reminder: Reminder){
        const newReminder = await db.insert(reminders).values(reminder).returning();
        const { id, userId, ...reminderData } = newReminder[0];
        return reminderData;
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

export default new ReminderService();