require("dotenv").config();
const mongoose = require("mongoose");
const { hashPassword } = require("../src/utils/passwordUtils");
const User = require("../src/models/User");
const PatientProfile = require("../src/models/PatientProfile");
const DoctorProfile = require("../src/models/DoctorProfile");
const Appointment = require("../src/models/Appointment");

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await PatientProfile.deleteMany({});
    await DoctorProfile.deleteMany({});
    await Appointment.deleteMany({});
    console.log("✓ Cleared all existing data");

    // Create admin
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@hms.com",
      phone: "9876543210",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
      isActive: true,
    });
    console.log("✓ Admin created:", adminUser.email);

    // Create doctors
    const doctorData = [
      {
        name: "Dr. Rajesh Kumar",
        email: "rajesh@hms.com",
        phone: "9876543201",
        specialization: "Cardiology",
        qualifications: ["MBBS", "MD Cardiology"],
        yearsOfExperience: 10,
        hospitalName: "Apollo Hospital",
        consultationFee: 500,
      },
      {
        name: "Dr. Priya Sharma",
        email: "priya@hms.com",
        phone: "9876543202",
        specialization: "Orthopedics",
        qualifications: ["MBBS", "MS Orthopedics"],
        yearsOfExperience: 8,
        hospitalName: "Max Healthcare",
        consultationFee: 400,
      },
      {
        name: "Dr. Amit Patel",
        email: "amit@hms.com",
        phone: "9876543203",
        specialization: "Dermatology",
        qualifications: ["MBBS", "MD Dermatology"],
        yearsOfExperience: 6,
        hospitalName: "Fortis Hospital",
        consultationFee: 300,
      },
    ];

    const doctors = [];
    for (const doc of doctorData) {
      const user = await User.create({
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: await hashPassword("doctor123"),
        role: "DOCTOR",
        isActive: true,
      });

      const profile = await DoctorProfile.create({
        userId: user._id,
        specialization: doc.specialization,
        qualifications: doc.qualifications,
        yearsOfExperience: doc.yearsOfExperience,
        hospitalName: doc.hospitalName,
        consultationFee: doc.consultationFee,
        isVerified: true, // Auto-verify for testing
        availableDays: [1, 2, 3, 4, 5], // Mon-Fri
        dailyStartTime: "09:00",
        dailyEndTime: "17:00",
        slotDurationMinutes: 30,
      });

      doctors.push({ user, profile });
      console.log("✓ Doctor created:", user.email);
    }

    // Create patients
    const patientData = [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543204",
        gender: "MALE",
        bloodGroup: "O+",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "9876543205",
        gender: "FEMALE",
        bloodGroup: "A+",
      },
      {
        name: "Mike Johnson",
        email: "mike@example.com",
        phone: "9876543206",
        gender: "MALE",
        bloodGroup: "B+",
      },
    ];

    for (const pat of patientData) {
      const user = await User.create({
        name: pat.name,
        email: pat.email,
        phone: pat.phone,
        passwordHash: await hashPassword("patient123"),
        role: "PATIENT",
        isActive: true,
      });

      await PatientProfile.create({
        userId: user._id,
        gender: pat.gender,
        bloodGroup: pat.bloodGroup,
      });

      console.log("✓ Patient created:", user.email);
    }

    console.log("\n✓ Database seeded successfully!");
    console.log("\nTest Credentials:");
    console.log("Admin: admin@hms.com / admin123");
    console.log("Doctor: rajesh@hms.com / doctor123");
    console.log("Patient: john@example.com / patient123");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
