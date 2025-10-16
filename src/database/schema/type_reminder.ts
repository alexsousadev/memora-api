import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { reminders } from "./reminder";

export const typeReminders = pgTable('type_reminder', {
  id: integer('id_type_reminder').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name_type_reminder').notNull(),
});

export const typeRemindersRelations = relations(typeReminders, ({ many }) => ({
  reminders: many(reminders),
}));

