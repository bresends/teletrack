export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function combineDateAndTime(date: Date, timeStr: string): Date {
	const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
	const newDate = new Date(date);
	newDate.setHours(hours, minutes, 0, 0);
	return newDate;
}

export function addMonths(
	date: Date,
	months: number,
	dayOfMonth?: number,
): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);

	if (dayOfMonth) {
		const lastDay = new Date(
			result.getFullYear(),
			result.getMonth() + 1,
			0,
		).getDate();
		result.setDate(Math.min(dayOfMonth, lastDay));
	}
	return result;
}

export function addYears(date: Date, years: number): Date {
	const result = new Date(date);
	result.setFullYear(result.getFullYear() + years);
	return result;
}

export function getNextWeeklyDate(baseDate: Date, daysOfWeek: number[]): Date {
	const currentDay = baseDate.getDay();
	const sortedDays = [...new Set(daysOfWeek)].sort((a, b) => a - b);

	for (const day of sortedDays) {
		if (day > currentDay) {
			return addDays(baseDate, day - currentDay);
		}
	}

	const daysToAdd = 7 - currentDay + sortedDays[0];
	return addDays(baseDate, daysToAdd);
}
