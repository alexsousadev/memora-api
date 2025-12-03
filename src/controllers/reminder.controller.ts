import { Request, Response } from "express";
import { reminderSchema } from "../schemas/reminder";
import reminderService from "../services/reminder.service";

// CREATE REMINDER
export const createReminder = async (req: Request, res: Response) => {
    try {
        const dataReminder = reminderSchema.parse(req.body);
        const reminder = await reminderService.addReminder(dataReminder);

        if (!reminder) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "Erro ao criar lembrete"
            });
        }
        
        res.status(201).json(reminder);
    } catch (error: any) {
        console.error("Erro ao criar lembrete:", error);
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Erro ao criar lembrete",
            "details": error.message
        });
    }
}

// GET ALL REMINDERS
export const getAllReminders = async (req: Request, res: Response) => {
    try {
      const reminders = await reminderService.getAllReminders();
  
      return res.status(200).json(reminders);
    } catch (error) {
      console.error("Erro ao buscar lembretes:", error);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro ao buscar os lembretes.",
      });
    }
  };

// GET REMINDER BY ID
export const getReminderById = async (req: Request, res: Response) => {
    try {
        const reminderId = parseInt(req.params.reminderId);

        if (isNaN(reminderId)) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "ID do lembrete inválido"
            });
        }

        const reminder = await reminderService.getReminderById(reminderId);

        if (!reminder) {
            return res.status(404).json({
                "error": "NOT_FOUND",
                "message": "Lembrete não encontrado"
            });
        }

        res.status(200).json(reminder);

    } catch (error) {
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Erro ao buscar lembrete"
        });
    }
}

// SEARCH REMINDER
export const searchReminders = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== 'string') {
             return res.status(400).json({ message: "Nome é obrigatório na busca" });
        }
        const reminders = await reminderService.searchRemindersByName(name);
        return res.status(200).json(reminders);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao buscar lembretes" });
    }
}

// UPDATE REMINDER (BY ID)
export const updateReminder = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });
        
        const reminder = await reminderService.updateReminder(id, req.body);
        if (!reminder) return res.status(404).json({ message: "Lembrete não encontrado" });
        
        return res.status(200).json(reminder);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao atualizar lembrete" });
    }
}

// UPDATE REMINDER BY NAME
export const updateReminderByName = async (req: Request, res: Response) => {
    try {
        const { oldName, newName, newTime } = req.body;
        if (!oldName) return res.status(400).json({ message: "oldName é obrigatório" });
        
        const updateData: any = {};
        if (newName) updateData.name = newName;
        if (newTime) updateData.time = newTime;
        
        const reminder = await reminderService.updateReminderByName(oldName, updateData);
        if (!reminder) return res.status(404).json({ message: "Lembrete não encontrado" });
        
        return res.status(200).json(reminder);
    } catch (error) {
         return res.status(500).json({ error: "Erro ao atualizar lembrete" });
    }
}

// DELETE REMINDER
export const deleteReminder = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Nome é obrigatório" });
        
        const deleted = await reminderService.deleteReminderByName(name);
        if (!deleted) return res.status(404).json({ message: "Lembrete não encontrado" });
        
        return res.status(200).json({ message: "Lembrete excluído com sucesso" });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao excluir lembrete" });
    }
}
