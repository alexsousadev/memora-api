import { integer, pgTable, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { reminders } from "./reminder";

export const users = pgTable('user', {
  id: integer('id_user').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name_user').notNull(),
  birthdate: date('birthdate_user'),
  photoUri: varchar('photo_uri'),
});

export const usersRelations = relations(users, ({ many }) => ({
  reminders: many(reminders),
}));
