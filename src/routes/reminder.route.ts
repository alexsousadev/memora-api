import { Router } from "express";
import { 
    createReminder, 
    getReminderById, 
    getAllReminders, 
    searchReminders, 
    updateReminder, 
    updateReminderByName, 
    deleteReminder 
} from "../controllers/reminder.controller";

const reminderRouter = Router();

// Specific routes first
reminderRouter.post("/", createReminder);
reminderRouter.get("/search", searchReminders);
reminderRouter.put("/by-name", updateReminderByName);
reminderRouter.put("/:id", updateReminder);
reminderRouter.delete("/", deleteReminder);

// General routes (root or param based)
reminderRouter.get("/", getAllReminders);
reminderRouter.get("/:reminderId", getReminderById);

export default reminderRouter;
