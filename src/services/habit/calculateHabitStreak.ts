import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { habitLogs } from "../../db/schema.ts";

type StreakInfo = {
	currentStreak: number;
	longestStreak: number;
	lastCompletionDate: Date | null;
};

export async function calculateHabitStreak(
	habitId: number,
): Promise<StreakInfo> {
	try {
		// Fetch all completions for this habit, sorted by date
		const completions = await db
			.select({
				createdAt: habitLogs.createdAt,
			})
			.from(habitLogs)
			.where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.done, true)))
			.orderBy(habitLogs.createdAt);

		if (!completions.length) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				lastCompletionDate: null,
			};
		}

		// Get array of completion dates (just the date part, not time)
		const completionDates = completions.map((c) => {
			const date = new Date(c.createdAt);
			return new Date(date.getFullYear(), date.getMonth(), date.getDate());
		});

		let currentStreak = 1;
		let longestStreak = 1;
		let streakStart = completionDates[0];

		// Calculate streaks by checking for consecutive days
		for (let i = 1; i < completionDates.length; i++) {
			const prevDate = completionDates[i - 1];
			const currDate = completionDates[i];

			if (!prevDate || !currDate) continue;

			// Check if dates are consecutive (accounting for same-day multiple completions)
			const dayDiff = Math.floor(
				(currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000),
			);

			if (dayDiff === 1) {
				// Consecutive day, increase streak
				currentStreak++;
				if (currentStreak > longestStreak) {
					longestStreak = currentStreak;
				}
			} else {
				// Streak broken
				currentStreak = 1;
				streakStart = currDate;
			}
		}

		// Check if current streak is still active by comparing last completion with today
		const lastCompletionDate = completionDates[completionDates.length - 1];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const daysSinceLastCompletion = Math.floor(
			(today.getTime() - lastCompletionDate.getTime()) / (24 * 60 * 60 * 1000),
		);

		// If more than 1 day has passed since the last completion, the streak is broken
		if (daysSinceLastCompletion > 1) {
			currentStreak = 0;
		}

		return {
			currentStreak,
			longestStreak,
			lastCompletionDate: completions[completions.length - 1].createdAt,
		};
	} catch (error) {
		console.error("Error calculating habit streak:", error);
		return {
			currentStreak: 0,
			longestStreak: 0,
			lastCompletionDate: null,
		};
	}
}
