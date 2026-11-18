export const DIAGNOSIS_RESPONSE_MS = 60 * 60 * 1000;

export function diagnosisDeadline(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + DIAGNOSIS_RESPONSE_MS);
}

export function diagnosisDeadlineLabel(createdAt: string, now = Date.now()) {
  const deadline = diagnosisDeadline(createdAt);
  return {
    deadline,
    overdue: now > deadline.getTime(),
    formatted: deadline.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
  };
}
