import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { reminders } from "./reminder";

export const categories = pgTable('category', {
  id: integer('id_category').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name_category').notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  reminders: many(reminders),
}));

