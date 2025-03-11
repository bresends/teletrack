// Check if a habit has been completed today
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { habitLogs } from "../../db/schema.ts";


export async function checkHabitCompletedToday(habitId: number): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );
    const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
    );

    const completedLogs = await db
        .select()
        .from(habitLogs)
        .where(
            and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.done, true),
                gte(habitLogs.createdAt, startOfDay),
                lte(habitLogs.createdAt, endOfDay),
            ),
        );

    return completedLogs.length > 0;
}