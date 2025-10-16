import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { reminders } from "./reminder";

export const soundReminders = pgTable('sound_reminder', {
  id: integer('id_sound_reminder').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name_sound_reminder').notNull(),
  uri: varchar('uri_sound_reminder').notNull(),
});

export const soundRemindersRelations = relations(soundReminders, ({ many }) => ({
  reminders: many(reminders),
}));

