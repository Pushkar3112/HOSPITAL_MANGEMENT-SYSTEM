/**
 * Quick script to seed doctor availability data
 * Run: node seed-availability.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const DoctorProfile = require("./src/models/DoctorProfile");

const seedAvailability = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Update all doctors with availability data if not already set
    const doctors = await DoctorProfile.find();
    console.log(`Found ${doctors.length} doctors`);

    let updated = 0;
    for (const doctor of doctors) {
      if (!doctor.availableDays || doctor.availableDays.length === 0) {
        doctor.availableDays = [1, 2, 3, 4, 5]; // Mon-Fri
        doctor.dailyStartTime = "09:00";
        doctor.dailyEndTime = "17:00";
        doctor.slotDurationMinutes = 30;
        doctor.customBreaks = [
          {
            startTime: "12:00",
            endTime: "13:00",
            reason: "Lunch Break",
          },
        ];
        await doctor.save();
        updated++;
        console.log(`✓ Updated ${doctor.userId.toString()}`);
      } else {
        console.log(`✓ Already has availability - ${doctor.userId.toString()}`);
      }
    }

    console.log(
      `\n✓ Successfully updated ${updated} doctors with availability data`
    );
    console.log("\nAvailability Settings:");
    console.log("  • Available Days: Monday-Friday (1-5)");
    console.log("  • Start Time: 09:00");
    console.log("  • End Time: 17:00");
    console.log("  • Slot Duration: 30 minutes");
    console.log("  • Custom Break: 12:00-13:00 (Lunch)");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding availability:", error.message);
    process.exit(1);
  }
};

seedAvailability();
