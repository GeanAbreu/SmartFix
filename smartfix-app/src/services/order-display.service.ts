const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function collectionScheduleLabel(
  scheduledDate: unknown,
  schedulePeriod: unknown,
) {
  if (typeof scheduledDate !== "string") return "Coleta a agendar";

  const match = ISO_DATE.exec(scheduledDate.trim());
  if (!match) return "Coleta a agendar";

  const period = schedulePeriod === "morning"
    ? "Manhã"
    : schedulePeriod === "afternoon"
      ? "Tarde"
      : "Turno a definir";

  return `${match[3]}/${match[2]}/${match[1]} · ${period}`;
}
