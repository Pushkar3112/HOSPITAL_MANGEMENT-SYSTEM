/**
 * Helper functions for appointment slot calculations
 */

/**
 * Check if a time is within working hours
 */
const isWithinWorkingHours = (time, startTime, endTime) => {
  return time >= startTime && time < endTime;
};

/**
 * Check if a time is within a break
 */
const isWithinBreak = (time, breaks) => {
  return breaks.some((b) => time >= b.startTime && time < b.endTime);
};

/**
 * Generate available slots for a doctor on a specific date
 */
const generateAvailableSlots = (doctor, date, bookedAppointments) => {
  const slots = [];
  const dayOfWeek = new Date(date).getDay();

  console.log(
    `[generateSlots] Date: ${date}, Day of week: ${dayOfWeek}, Available days: ${doctor.availableDays}`
  );

  // Check if doctor works on this day
  if (!doctor.availableDays.includes(dayOfWeek)) {
    console.log(`[generateSlots] Doctor doesn't work on day ${dayOfWeek}`);
    return slots;
  }

  const slotDuration = doctor.slotDurationMinutes;
  const [startHour, startMin] = doctor.dailyStartTime.split(":").map(Number);
  const [endHour, endMin] = doctor.dailyEndTime.split(":").map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  console.log(
    `[generateSlots] Start: ${doctor.dailyStartTime}, End: ${doctor.dailyEndTime}, Duration: ${slotDuration}min`
  );

  const bookedTimes = bookedAppointments
    .filter((apt) => {
      const aptDate = new Date(apt.date);
      const compareDate = new Date(date);
      return (
        aptDate.toDateString() === compareDate.toDateString() &&
        ["PENDING", "CONFIRMED"].includes(apt.status)
      );
    })
    .map((apt) => ({
      startTime: apt.startTime,
      endTime: apt.endTime,
    }));

  console.log(
    `[generateSlots] Booked slots for this date: ${bookedTimes.length}`
  );

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const startTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;

    const nextMinutes = currentMinutes + slotDuration;
    const nextHours = Math.floor(nextMinutes / 60);
    const nextMins = nextMinutes % 60;
    const endTime = `${String(nextHours).padStart(2, "0")}:${String(
      nextMins
    ).padStart(2, "0")}`;

    // Check if slot is within break
    const isInBreak = doctor.customBreaks?.some(
      (b) => startTime >= b.startTime && startTime < b.endTime
    );

    // Check if slot is already booked
    const isBooked = bookedTimes.some((bt) => {
      return !(endTime <= bt.startTime || startTime >= bt.endTime);
    });

    if (!isInBreak && !isBooked) {
      slots.push({
        startTime,
        endTime,
        available: true,
      });
    }

    currentMinutes += slotDuration;
  }

  return slots;
};

/**
 * Convert time string to minutes
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

module.exports = {
  isWithinWorkingHours,
  isWithinBreak,
  generateAvailableSlots,
  timeToMinutes,
  minutesToTime,
};
