/**
 * Format date to readable format
 */
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time
 */
export const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

/**
 * Format date and time
 */
export const formatDateTime = (date, time) => {
  return `${formatDate(date)} at ${formatTime(time)}`;
};

/**
 * Calculate days until appointment
 */
export const daysUntilAppointment = (appointmentDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointment = new Date(appointmentDate);
  appointment.setHours(0, 0, 0, 0);

  const diffTime = appointment - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if appointment is cancelable
 */
export const isCancelable = (appointmentDate, appointmentTime) => {
  const now = new Date();
  const appointment = new Date(appointmentDate);
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  appointment.setHours(hours, minutes, 0, 0);

  const diffTime = appointment - now;
  const diffHours = diffTime / (1000 * 60 * 60);

  return diffHours >= 2;
};
