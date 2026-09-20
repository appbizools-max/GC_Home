export interface AvailableDate {
  dateString: string; // YYYY-MM-DD
  dayName: string; // "Sun", "Mon", etc.
  dayNumber: string; // "26", "27", etc.
  monthName: string; // "Apr", "May"
  isToday: boolean;
  isTomorrow: boolean;
  displayLabel: string; // "Today 26 Apr" or "Sun 27 Apr"
  isAvailable: boolean;
}

export interface AvailableSlot {
  slotId: string;
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  displayRange: string; // "9:00 AM - 11:00 AM"
  isAvailable: boolean;
  isPast: boolean;
  isFull: boolean;
  cutoffPassed: boolean;
  capacityLeft: number;
}

const STANDARD_SLOTS = [
  { id: 'slot_9_11', start: 9, end: 11, label: '9:00 AM – 11:00 AM' },
  { id: 'slot_11_13', start: 11, end: 13, label: '11:00 AM – 1:00 PM' },
  { id: 'slot_14_16', start: 14, end: 16, label: '2:00 PM – 4:00 PM' },
  { id: 'slot_16_18', start: 16, end: 18, label: '4:00 PM – 6:00 PM' },
  { id: 'slot_18_20', start: 18, end: 20, label: '6:00 PM – 8:00 PM' },
];

/**
 * Returns the current date/time in IST (Indian Standard Time, UTC+5:30)
 */
export const getNowInIST = (): Date => {
  const now = new Date();
  // IST offset is +330 minutes (+5.5 hours)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 330 * 60000);
};

/**
 * Generates the upcoming 7-14 booking days dynamically starting from today.
 */
export const generateAvailableDates = (daysCount: number = 7): AvailableDate[] => {
  const nowIST = getNowInIST();
  const dates: AvailableDate[] = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(nowIST);
    d.setDate(nowIST.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const isToday = i === 0;
    const isTomorrow = i === 1;

    const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayNames[d.getDay()];
    const dayNumber = String(d.getDate());
    const monthName = monthNames[d.getMonth()];

    dates.push({
      dateString,
      dayName: isToday ? 'Today' : dayNames[d.getDay()],
      dayNumber,
      monthName,
      isToday,
      isTomorrow,
      displayLabel: isToday ? `Today\n${dayNumber} ${monthName}` : `${dayNames[d.getDay()]}\n${dayNumber} ${monthName}`,
      isAvailable: true,
    });
  }

  return dates;
};

/**
 * Generates and validates time slots for a given date string (YYYY-MM-DD).
 * If the selected date is today, automatically marks slots that have already started
 * or are within the 45-minute booking cutoff window as unavailable/past.
 */
export const getAvailableSlotsForDate = (
  dateString: string,
  bookingLeadMinutes: number = 45
): AvailableSlot[] => {
  const nowIST = getNowInIST();
  const currentYear = nowIST.getFullYear();
  const currentMonth = String(nowIST.getMonth() + 1).padStart(2, '0');
  const currentDay = String(nowIST.getDate()).padStart(2, '0');
  const todayString = `${currentYear}-${currentMonth}-${currentDay}`;

  const isToday = dateString === todayString;
  const currentHour = nowIST.getHours();
  const currentMinute = nowIST.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  return STANDARD_SLOTS.map((slotDef, index) => {
    const slotStartMinutes = slotDef.start * 60;
    let isPast = false;
    let cutoffPassed = false;
    let isFull = false;

    if (isToday) {
      if (currentTimeInMinutes >= slotStartMinutes) {
        isPast = true;
      } else if (currentTimeInMinutes + bookingLeadMinutes >= slotStartMinutes) {
        cutoffPassed = true;
      }
    }

    // Example simulated capacity per slot
    const capacityLeft = isPast || cutoffPassed ? 0 : index === 2 ? 1 : index === 3 ? 3 : 5;
    if (capacityLeft === 0 && !isPast && !cutoffPassed) {
      isFull = true;
    }

    const isAvailable = !isPast && !cutoffPassed && !isFull;

    return {
      slotId: slotDef.id,
      startTime: `${String(slotDef.start).padStart(2, '0')}:00`,
      endTime: `${String(slotDef.end).padStart(2, '0')}:00`,
      displayRange: slotDef.label,
      isAvailable,
      isPast,
      isFull,
      cutoffPassed,
      capacityLeft,
    };
  });
};
