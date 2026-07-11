const generateAvailableSlots = (doctor, dateStr, existingAppointments) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday ...

    if (!doctor.availableDays.includes(dayOfWeek)) {
        return [];
    }

    const slots = [];
    const [startH, startM] = doctor.dailyStartTime.split(':').map(Number);
    const [endH, endM] = doctor.dailyEndTime.split(':').map(Number);
    const duration = doctor.slotDurationMinutes || 30;

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
        const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((current + duration) / 60)).padStart(2, '0')}:${String((current + duration) % 60).padStart(2, '0')}`;

        // Check if in custom break
        const inBreak = doctor.customBreaks?.some(brk => {
            const brkStart = brk.startTime.split(':').map(Number);
            const brkEnd = brk.endTime.split(':').map(Number);
            const brkStartMin = brkStart[0] * 60 + brkStart[1];
            const brkEndMin = brkEnd[0] * 60 + brkEnd[1];
            return current >= brkStartMin && current < brkEndMin;
        });

        if (!inBreak) {
            // Check existing appointments
            const dateStr2 = date.toISOString().split('T')[0];
            const booked = existingAppointments.filter(apt => {
                const aptDate = new Date(apt.date).toISOString().split('T')[0];
                return aptDate === dateStr2
                    && apt.startTime === slotStart
                    && !['CANCELLED', 'NO_SHOW'].includes(apt.status);
            });

            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                available: booked.length < (doctor.maxPatientsPerSlot || 1),
                isAvailable: booked.length < (doctor.maxPatientsPerSlot || 1),
                bookedCount: booked.length,
                maxSlots: doctor.maxPatientsPerSlot || 1,
            });
        }

        current += duration;
    }

    return slots;
};

module.exports = { generateAvailableSlots };
