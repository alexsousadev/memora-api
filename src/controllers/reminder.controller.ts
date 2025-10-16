import { Request, Response } from "express";
import { reminderSchema } from "../schemas/reminder";
import reminderService from "../services/remider.service";
import audioService from "../services/audio.service";
import reminderMapper from "../helpers/reminder-mapper.ts";

// Create reminder
export const createReminder = async (req: Request, res: Response) => {
    try {
        const audioFile = req.file;
        
        if (!audioFile) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "Audio file (MP3 or WAV) is required. Ensure the field name is 'audio'."
            });
        }

        const pathFile = audioFile.path
        const mimeType = audioFile.mimetype;

        const intentAudioJson = await audioService.transcribeAudio(pathFile, mimeType);
        const jsonString = intentAudioJson?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || '{}';
        const extractedData = JSON.parse(jsonString);

        // Resolve type and category IDs
        const typeId = await reminderMapper.getTypeId(extractedData.type || "one_time");
        const categoryId = await reminderMapper.getCategoryId(extractedData.category || "medication");

        if (!typeId || !categoryId) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "Invalid type or category. Please run the database seed."
            });
        }

        // Build payload for schema
        const reminderData = {
            title: extractedData.title || "Untitled",
            typeReminderId: typeId,
            categoryId: categoryId,
            initialDate: extractedData.initialDate || new Date().toISOString().split('T')[0],
            endDate: extractedData.endDate,
            timeDay: extractedData.timeDay || "00:00",
            userId: 1 // TODO: get from authenticated user
        };

        // Validate with zod
        const validatedData = reminderSchema.parse(reminderData);
        
        const reminder = await reminderService.addReminder(validatedData, extractedData.weekDays);

        if (!reminder) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "Failed to create reminder."
            });
        }
        
        res.status(201).json({
            "error": null,
            "message": "Reminder created successfully.",
            "data": {
                ...reminder,
                audioFile: {
                    filename: audioFile.filename,
                    originalname: audioFile.originalname,
                    mimetype: audioFile.mimetype,
                    size: audioFile.size,
                    path: audioFile.path
                }
            }
        });
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An error occurred while creating the reminder.",
            "details": error instanceof Error ? error.message : "Unknown error"
        });
    }
}

// Get reminder by ID
export const getReminderById = async (req: Request, res: Response) => {
    try {
        const reminderId = parseInt(req.params.reminderId);

        if (isNaN(reminderId)) {
            return res.status(400).json({
                "error": "BAD_REQUEST",
                "message": "Invalid reminder ID."
            });
        }

        const reminder = await reminderService.getReminderById(reminderId);

        if (!reminder || reminder.length === 0) {
            return res.status(404).json({
                "error": "NOT_FOUND",
                "message": "Reminder not found."
            });
        }

        res.status(200).json({
            "error": "SUCCESS",
            "message": "Reminder fetched successfully.",
            "data": reminder
        });

    } catch (error) {
        res.status(500).json({
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An error occurred while fetching the reminder."
        });
    }
}

// Get all reminders
export const getAllReminders = async (req: Request, res: Response) => {
    try {
      const reminders = await reminderService.getAllReminders();
  
      if (!reminders || reminders.length === 0) {
        return res.status(404).json({
          error: "NOT_FOUND",
          message: "No reminders found.",
        });
      }
  
      return res.status(200).json({
        error: null,
        message: "Reminders fetched successfully.",
        data: reminders,
      });
    } catch (error) {
      console.error("Error fetching reminders:", error);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching reminders.",
      });
    }
  };