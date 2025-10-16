import { db } from "../db";
import { typeReminders, categories, dayWeeks } from "../schema";

export async function seedInitialData() {
  console.log("🌱 Iniciando seed dos dados iniciais...");

  try {
    // Seed TYPE_REMINDER
    const existingTypes = await db.select().from(typeReminders);
    if (existingTypes.length === 0) {
      await db.insert(typeReminders).values([
        { name: "one_time" },
        { name: "daily" },
        { name: "weekly" },
        { name: "custom" },
      ]);
      console.log("✅ Tipos de lembrete criados");
    } else {
      console.log("ℹ️  Tipos de lembrete já existem");
    }

    // Seed CATEGORY
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { name: "medication" },
        { name: "meal" },
        { name: "exercise" },
        { name: "sleep" },
      ]);
      console.log("✅ Categorias criadas");
    } else {
      console.log("ℹ️  Categorias já existem");
    }

    // Seed DAY_WEEK
    const existingDays = await db.select().from(dayWeeks);
    if (existingDays.length === 0) {
      await db.insert(dayWeeks).values([
        { name: "monday" },
        { name: "tuesday" },
        { name: "wednesday" },
        { name: "thursday" },
        { name: "friday" },
        { name: "saturday" },
        { name: "sunday" },
      ]);
      console.log("✅ Dias da semana criados");
    } else {
      console.log("ℹ️  Dias da semana já existem");
    }

    console.log("✨ Seed concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  }
}

// Executar seed quando o arquivo for chamado diretamente
if (require.main === module) {
  seedInitialData();
}

