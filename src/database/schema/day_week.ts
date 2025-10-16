import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { scheduleDayWeeks } from "./schedule_day_week";

export const dayWeeks = pgTable('day_week', {
  id: integer('id_day').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name_day').notNull(),
});

export const dayWeeksRelations = relations(dayWeeks, ({ many }) => ({
  scheduleDayWeeks: many(scheduleDayWeeks),
}));

