import { Router } from "express";
import { createReminder, getReminderById, getAllReminders } from "../controllers/reminder.controller";

const reminderRouter = Router();

reminderRouter.post("/", createReminder);
reminderRouter.get("/:reminderId", getReminderById);
reminderRouter.get("/", getAllReminders);

export default reminderRouter;