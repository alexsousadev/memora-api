import { Request, Response } from "express";
import { reminderSchema } from "../schemas/reminder";
import reminderService from "../services/remider.service";

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
        
        res.status(201).json({
            "error": "SUCCESS",
            "message": "Lembrete criado com sucesso",
            "data": reminder
        });
    } catch (error) {
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Erro ao criar lembrete"
        });
    }
}

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

        if (!reminder || reminder.length === 0) {
            return res.status(404).json({
                "error": "NOT_FOUND",
                "message": "Lembrete não encontrado"
            });
        }

        res.status(200).json({
            "error": "SUCCESS",
            "message": "Lembrete encontrado com sucesso",
            "data": reminder
        });

    } catch (error) {
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Erro ao buscar lembrete"
        });
    }
}

// GET ALL REMINDERS
export const getAllReminders = async (req: Request, res: Response) => {
    try {
      const reminders = await reminderService.getAllReminders();
  
      if (!reminders || reminders.length === 0) {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: "Nenhum lembrete encontrado",
        });
      }
  
      return res.status(200).json({
        error: null,
        message: "Lembretes encontrados com sucesso",
        data: reminders,
      });
    } catch (error) {
      console.error("Erro ao buscar lembretes:", error);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro ao buscar os lembretes.",
      });
    }
  };
  