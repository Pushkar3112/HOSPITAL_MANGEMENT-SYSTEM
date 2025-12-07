/**
 * Test script to check if slots API is working
 * Run: node test-slots.js
 */

require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const DoctorProfile = require("./src/models/DoctorProfile");

const testSlotsAPI = async () => {
  try {
    // Connect to MongoDB to get a real doctor ID
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    // Get first doctor
    const doctor = await DoctorProfile.findOne();
    if (!doctor) {
      console.log("✗ No doctors found in database");
      process.exit(1);
    }

    console.log("Doctor found:");
    console.log(`  ID: ${doctor._id}`);
    console.log(`  UserID: ${doctor.userId}`);
    console.log(`  Name: ${doctor.userId}`);
    console.log(`  Available Days: ${doctor.availableDays}`);
    console.log(`  Hours: ${doctor.dailyStartTime} - ${doctor.dailyEndTime}\n`);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const dayOfWeek = tomorrow.getDay();

    console.log(`Testing date: ${dateStr} (Day of week: ${dayOfWeek})\n`);

    // Test API call
    const apiUrl = `http://localhost:5000/api/doctor-search/${doctor._id}/slots?date=${dateStr}`;
    console.log(`Calling: ${apiUrl}\n`);

    const response = await axios.get(apiUrl);

    console.log("Response:");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.data?.slots && response.data.data.slots.length > 0) {
      console.log(`\n✓ SUCCESS! Got ${response.data.data.slots.length} slots`);
    } else {
      console.log("\n⚠ Got response but no slots returned");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    if (error.response?.data) {
      console.error("Response:", error.response.data);
    }
    process.exit(1);
  }
};

testSlotsAPI();
