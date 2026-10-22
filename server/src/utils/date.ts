/**
 * Checks whether a given due date is strictly in the past relative to the start of today
 * in the configured timezone (Asia/Kolkata).
 * A loan due today is NOT overdue until the next day begins.
 */
export function isLoanOverdue(dueDate: Date | string, tz: string = 'Asia/Kolkata'): boolean {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;

  // Get current date string in the target timezone: YYYY-MM-DD
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now); // e.g. "2026-10-22"

  const dueStr = formatter.format(due);

  // If due date string is strictly less than today's date string, it's overdue
  return dueStr < todayStr;
}

/**
 * Returns number of days a loan is overdue (0 if not overdue)
 */
export function getOverdueDays(dueDate: Date | string, tz: string = 'Asia/Kolkata'): number {
  if (!isLoanOverdue(dueDate, tz)) return 0;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayDate = new Date(`${formatter.format(now)}T00:00:00Z`);
  const dueDateOnly = new Date(`${formatter.format(due)}T00:00:00Z`);

  const diffMs = todayDate.getTime() - dueDateOnly.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
