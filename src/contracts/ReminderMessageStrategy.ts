export interface ReminderMessageContext {
    habitName: string;
    messageTemplate: string;
    streak?: number;
    timeToComplete?: number;
}

export interface ReminderMessageStrategy {
    buildMessage(context: ReminderMessageContext): string;
}