import { Reminder } from "../schemas/reminder";
import { db } from "../database/db";
import { reminders } from "../database/schema/reminder";
import { eq, ilike } from "drizzle-orm";

class ReminderService {
    constructor(){

    }

    async addReminder(reminder: Reminder){
        // Remove userId if not provided to avoid null constraint issues
        const reminderData: any = { ...reminder };
        if (!reminderData.userId) {
            delete reminderData.userId;
        }
        
        const newReminder = await db.insert(reminders).values(reminderData).returning();
        return newReminder[0];
    }

    async getReminderById(id: number){
        const reminder = await db.select().from(reminders).where(eq(reminders.id, id));
        return reminder[0];
    }

    async getAllReminders(){
        const allReminders = await db.select().from(reminders);
        return allReminders;
    }

    async searchRemindersByName(name: string) {
        const foundReminders = await db.select().from(reminders).where(ilike(reminders.name, `%${name}%`));
        return foundReminders;
    }

    async updateReminder(id: number, data: Partial<Reminder>) {
        const updatedReminder = await db.update(reminders)
            .set(data)
            .where(eq(reminders.id, id))
            .returning();
        return updatedReminder[0];
    }

    async updateReminderByName(oldName: string, data: Partial<Reminder>) {
        const updatedReminder = await db.update(reminders)
            .set(data)
            .where(eq(reminders.name, oldName))
            .returning();
        return updatedReminder[0];
    }

    async deleteReminderByName(name: string) {
        const deletedReminder = await db.delete(reminders)
            .where(eq(reminders.name, name))
            .returning();
        return deletedReminder[0];
    }
}

export default new ReminderService();
