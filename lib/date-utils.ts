// French date formatting utilities

/**
 * Format a date to French locale format
 */
export function formatDateFrench(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a time to French 24-hour format
 */
export function formatTimeFrench(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a date in DD/MM/YYYY format
 */
export function formatDateShortFrench(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Gets the first day of the week based on French convention (Monday)
 */
export function getFirstDayOfWeek(): number {
  return 1; // Monday is 1, Sunday is 0
}

/**
 * Format a date and time for display in French format
 */
export function formatDateTimeForDisplay(date: Date): string {
  return `${formatDateFrench(date)} à ${formatTimeFrench(date)}`;
}

/**
 * Configures calendar with French settings
 */
export function getFrenchCalendarConfig() {
  return {
    weekStartsOn: 1, // Monday
    locale: "fr-FR",
    formatters: {
      formatDate: formatDateFrench,
      formatTime: formatTimeFrench,
    },
  };
}
