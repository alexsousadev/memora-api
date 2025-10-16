import { db } from "../database/db";
import { typeReminders, categories, dayWeeks } from "../database/schema";
import { eq } from "drizzle-orm";

class ReminderMapper {
    private static instance: ReminderMapper;
    private typeCache: Map<string, number> = new Map();
    private categoryCache: Map<string, number> = new Map();
    private dayCache: Map<string, number> = new Map();

    private constructor() {}

    public static getInstance(): ReminderMapper {
        if (!ReminderMapper.instance) {
            ReminderMapper.instance = new ReminderMapper();
        }
        return ReminderMapper.instance;
    }

    async getTypeId(typeName: string): Promise<number | null> {
        if (this.typeCache.has(typeName)) {
            return this.typeCache.get(typeName)!;
        }

        const result = await db
            .select()
            .from(typeReminders)
            .where(eq(typeReminders.name, typeName))
            .limit(1);

        if (result.length > 0) {
            this.typeCache.set(typeName, result[0].id);
            return result[0].id;
        }

        return null;
    }

    async getCategoryId(categoryName: string): Promise<number | null> {
        if (this.categoryCache.has(categoryName)) {
            return this.categoryCache.get(categoryName)!;
        }

        const result = await db
            .select()
            .from(categories)
            .where(eq(categories.name, categoryName))
            .limit(1);

        if (result.length > 0) {
            this.categoryCache.set(categoryName, result[0].id);
            return result[0].id;
        }

        return null;
    }

    async getDayId(dayName: string): Promise<number | null> {
        if (this.dayCache.has(dayName)) {
            return this.dayCache.get(dayName)!;
        }

        const result = await db
            .select()
            .from(dayWeeks)
            .where(eq(dayWeeks.name, dayName))
            .limit(1);

        if (result.length > 0) {
            this.dayCache.set(dayName, result[0].id);
            return result[0].id;
        }

        return null;
    }
}

export default ReminderMapper.getInstance();


