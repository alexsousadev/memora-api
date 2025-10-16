import { integer, pgTable, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { typeReminders } from "./type_reminder";
import { categories } from "./category";
import { soundReminders } from "./sound_reminder";
import { scheduleDayWeeks } from "./schedule_day_week";

export const reminders = pgTable('reminder', {
  id: integer('id_reminder').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('id_user').references(() => users.id, { onDelete: 'cascade' }),
  typeReminderId: integer('id_type_reminder').notNull().references(() => typeReminders.id, { onDelete: 'cascade' }),
  categoryId: integer('id_category').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  soundReminderId: integer('id_sound_reminder').references(() => soundReminders.id, { onDelete: 'set null' }),
  title: varchar('title_reminder').notNull(),
  initialDate: date('initial_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  timeDay: varchar('time_day'),
});

export const remindersRelations = relations(reminders, ({ one, many }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  typeReminder: one(typeReminders, {
    fields: [reminders.typeReminderId],
    references: [typeReminders.id],
  }),
  category: one(categories, {
    fields: [reminders.categoryId],
    references: [categories.id],
  }),
  soundReminder: one(soundReminders, {
    fields: [reminders.soundReminderId],
    references: [soundReminders.id],
  }),
  scheduleDayWeeks: many(scheduleDayWeeks),
}));
