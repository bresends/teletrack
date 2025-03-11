export interface ReminderMessageContext {
    habitName: string;
    messageTemplate: string;
    currentStreak?: number;
    longestStreak?: number;
    timeToComplete?: number;
}

export interface ReminderMessageStrategy {
    buildMessage(context: ReminderMessageContext): string;
}