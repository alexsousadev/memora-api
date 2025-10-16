import { integer, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { dayWeeks } from "./day_week";
import { reminders } from "./reminder";

export const scheduleDayWeeks = pgTable('schedule_day_week', {
  id: integer('id_schedule_day_week').primaryKey().generatedAlwaysAsIdentity(),
  dayId: integer('id_day').notNull().references(() => dayWeeks.id, { onDelete: 'cascade' }),
  scheduleId: integer('id_schedule').notNull().references(() => reminders.id, { onDelete: 'cascade' }),
});

export const scheduleDayWeeksRelations = relations(scheduleDayWeeks, ({ one }) => ({
  day: one(dayWeeks, {
    fields: [scheduleDayWeeks.dayId],
    references: [dayWeeks.id],
  }),
  reminder: one(reminders, {
    fields: [scheduleDayWeeks.scheduleId],
    references: [reminders.id],
  }),
}));

