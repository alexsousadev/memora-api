import express, { Request, Response } from "express";
import reminderRouter from "./routes/reminder.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Memora API");
});

app.use("/reminders", reminderRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;