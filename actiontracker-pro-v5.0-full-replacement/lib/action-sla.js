export const URGENCY_SLA = {
  critical: { days: 1,  label: "Critical", description: "Immediate business / safety / delivery exposure" },
  high:     { days: 3,  label: "High",     description: "Material impact requiring rapid response" },
  medium:   { days: 7,  label: "Medium",   description: "Normal management action" },
  low:      { days: 14, label: "Low",      description: "Limited impact, planned follow-up" },
  routine:  { days: 30, label: "Routine",  description: "Administrative / non-urgent follow-up" }
};

export function addCalendarDaysISO(baseDate, days) {
  const d = baseDate ? new Date(`${baseDate}T12:00:00`) : new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export function dueDateForUrgency(urgency, assignedDate) {
  const config = URGENCY_SLA[urgency] || URGENCY_SLA.medium;
  return addCalendarDaysISO(assignedDate, config.days);
}
