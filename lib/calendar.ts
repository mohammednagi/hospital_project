export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
}

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateICSContent(event: CalendarEventData): string {
  const dtStamp = formatDateToICS(new Date());
  const dtStart = formatDateToICS(event.startsAt);
  const dtEnd = formatDateToICS(event.endsAt);
  const uid = `smartgov-${Date.now()}@hospital.gov.eg`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartGov Egypt//Hospital Appointment//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:تذكير بموعد العيادة الحكومية",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
