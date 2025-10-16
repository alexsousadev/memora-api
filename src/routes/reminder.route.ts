import { Router } from "express";
import { createReminder, getReminderById, getAllReminders } from "../controllers/reminder.controller";
import { upload } from "../config/multer";

const reminderRouter = Router();

reminderRouter.post("/", upload.single('audio'), createReminder);
reminderRouter.get("/:reminderId", getReminderById);
reminderRouter.get("/", getAllReminders);

export default reminderRouter;