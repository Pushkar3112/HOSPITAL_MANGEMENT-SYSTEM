/**
 * Comprehensive Database Seed Script
 * Creates demo users (admin, doctors, patients) with full medical history,
 * appointments, prescriptions, invoices, and medical records.
 *
 * Demo Credentials:
 *   Admin:   admin@hms.com    / admin123
 *   Doctor:  dr.sharma@hms.com / doctor123
 *   Doctor:  dr.patel@hms.com  / doctor123
 *   Doctor:  dr.gupta@hms.com  / doctor123
 *   Patient: rahul@hms.com    / patient123
 *   Patient: priya@hms.com    / patient123
 *   Patient: amit@hms.com     / patient123
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hash(password) {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🗑️  Clearing existing data...');
    await prisma.invoice.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.patientProfile.deleteMany();
    await prisma.doctorProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Database cleared.\n');

    // ==================== ADMIN ====================
    console.log('👤 Creating Admin...');
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@hms.com',
            phone: '9000000001',
            passwordHash: await hash('admin123'),
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log(`   ✅ Admin: admin@hms.com / admin123\n`);

    // ==================== DOCTORS ====================
    console.log('🩺 Creating Doctors...');

    const drSharma = await prisma.user.create({
        data: {
            name: 'Dr. Rajesh Sharma',
            email: 'dr.sharma@hms.com',
            phone: '9000000010',
            passwordHash: await hash('doctor123'),
            role: 'DOCTOR',
            isActive: true,
            doctorProfile: {
                create: {
                    specialization: 'Cardiologist',
                    qualifications: ['MBBS', 'MD Cardiology', 'DM Cardiology'],
                    yearsOfExperience: 15,
                    hospitalName: 'City Heart Hospital',
                    consultationFee: 800,
                    availableDays: [1, 2, 3, 4, 5],
                    dailyStartTime: '09:00',
                    dailyEndTime: '17:00',
                    slotDurationMinutes: 30,
                    customBreaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }],
                    isVerified: true,
                    maxPatientsPerSlot: 1,
                    rating: 4.8,
                    totalRatings: 120,
                },
            },
        },
        include: { doctorProfile: true },
    });

    const drPatel = await prisma.user.create({
        data: {
            name: 'Dr. Sneha Patel',
            email: 'dr.patel@hms.com',
            phone: '9000000011',
            passwordHash: await hash('doctor123'),
            role: 'DOCTOR',
            isActive: true,
            doctorProfile: {
                create: {
                    specialization: 'Neurologist',
                    qualifications: ['MBBS', 'MD Neurology'],
                    yearsOfExperience: 10,
                    hospitalName: 'NeuroLife Clinic',
                    consultationFee: 1000,
                    availableDays: [1, 2, 3, 4, 5, 6],
                    dailyStartTime: '10:00',
                    dailyEndTime: '18:00',
                    slotDurationMinutes: 30,
                    customBreaks: [{ startTime: '13:00', endTime: '13:30', reason: 'Break' }],
                    isVerified: true,
                    maxPatientsPerSlot: 1,
                    rating: 4.6,
                    totalRatings: 85,
                },
            },
        },
        include: { doctorProfile: true },
    });

    const drGupta = await prisma.user.create({
        data: {
            name: 'Dr. Anil Gupta',
            email: 'dr.gupta@hms.com',
            phone: '9000000012',
            passwordHash: await hash('doctor123'),
            role: 'DOCTOR',
            isActive: true,
            doctorProfile: {
                create: {
                    specialization: 'Orthopedist',
                    qualifications: ['MBBS', 'MS Orthopedics'],
                    yearsOfExperience: 8,
                    hospitalName: 'BoneWell Hospital',
                    consultationFee: 600,
                    availableDays: [1, 3, 5],
                    dailyStartTime: '08:00',
                    dailyEndTime: '14:00',
                    slotDurationMinutes: 30,
                    customBreaks: [],
                    isVerified: true,
                    maxPatientsPerSlot: 1,
                    rating: 4.3,
                    totalRatings: 55,
                },
            },
        },
        include: { doctorProfile: true },
    });

    console.log('   ✅ Dr. Rajesh Sharma (Cardiologist) — dr.sharma@hms.com / doctor123');
    console.log('   ✅ Dr. Sneha Patel (Neurologist)    — dr.patel@hms.com  / doctor123');
    console.log('   ✅ Dr. Anil Gupta (Orthopedist)     — dr.gupta@hms.com  / doctor123\n');

    // ==================== PATIENTS ====================
    console.log('🧑 Creating Patients...');

    const rahul = await prisma.user.create({
        data: {
            name: 'Rahul Verma',
            email: 'rahul@hms.com',
            phone: '9000000020',
            passwordHash: await hash('patient123'),
            role: 'PATIENT',
            isActive: true,
            patientProfile: {
                create: {
                    gender: 'MALE',
                    dateOfBirth: new Date('1990-06-15'),
                    bloodGroup: 'O_PLUS',
                    address: { street: '45 MG Road', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' },
                    emergencyContact: { name: 'Sunita Verma', phone: '9876543001', relationship: 'Wife' },
                    allergies: ['Penicillin', 'Dust'],
                    chronicConditions: ['Mild Hypertension'],
                },
            },
        },
        include: { patientProfile: true },
    });

    const priya = await prisma.user.create({
        data: {
            name: 'Priya Singh',
            email: 'priya@hms.com',
            phone: '9000000021',
            passwordHash: await hash('patient123'),
            role: 'PATIENT',
            isActive: true,
            patientProfile: {
                create: {
                    gender: 'FEMALE',
                    dateOfBirth: new Date('1988-03-22'),
                    bloodGroup: 'B_PLUS',
                    address: { street: '12 Park Lane', city: 'Pune', state: 'Maharashtra', zipCode: '411001' },
                    emergencyContact: { name: 'Vikram Singh', phone: '9876543002', relationship: 'Husband' },
                    allergies: ['Sulfa drugs'],
                    chronicConditions: ['Asthma'],
                },
            },
        },
        include: { patientProfile: true },
    });

    const amit = await prisma.user.create({
        data: {
            name: 'Amit Deshmukh',
            email: 'amit@hms.com',
            phone: '9000000022',
            passwordHash: await hash('patient123'),
            role: 'PATIENT',
            isActive: true,
            patientProfile: {
                create: {
                    gender: 'MALE',
                    dateOfBirth: new Date('1995-11-08'),
                    bloodGroup: 'A_PLUS',
                    address: { street: '78 Station Rd', city: 'Nagpur', state: 'Maharashtra', zipCode: '440001' },
                    emergencyContact: { name: 'Kavita Deshmukh', phone: '9876543003', relationship: 'Mother' },
                    allergies: [],
                    chronicConditions: [],
                },
            },
        },
        include: { patientProfile: true },
    });

    console.log('   ✅ Rahul Verma   — rahul@hms.com / patient123');
    console.log('   ✅ Priya Singh   — priya@hms.com / patient123');
    console.log('   ✅ Amit Deshmukh — amit@hms.com  / patient123\n');

    // ==================== APPOINTMENTS ====================
    console.log('📅 Creating Appointments...');

    // Past completed appointments
    const apt1 = await prisma.appointment.create({
        data: {
            patientId: rahul.id,
            doctorId: drSharma.id,
            date: new Date('2025-12-10'),
            startTime: '10:00',
            endTime: '10:30',
            status: 'COMPLETED',
            visitType: 'OFFLINE',
            reasonForVisit: 'Chest pain and shortness of breath during exercise',
            notesFromDoctor: 'ECG normal. Advised lifestyle changes and follow-up in 3 months.',
            consultationFee: 800,
            paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_001',
            razorpayPaymentId: 'pay_seed_001',
        },
    });

    const apt2 = await prisma.appointment.create({
        data: {
            patientId: rahul.id,
            doctorId: drPatel.id,
            date: new Date('2026-01-15'),
            startTime: '11:00',
            endTime: '11:30',
            status: 'COMPLETED',
            visitType: 'ONLINE',
            reasonForVisit: 'Recurring headaches for the past 2 weeks',
            notesFromDoctor: 'Tension-type headache. Prescribed medication and stress management.',
            consultationFee: 1000,
            paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_002',
            razorpayPaymentId: 'pay_seed_002',
        },
    });

    const apt3 = await prisma.appointment.create({
        data: {
            patientId: priya.id,
            doctorId: drSharma.id,
            date: new Date('2026-02-05'),
            startTime: '14:00',
            endTime: '14:30',
            status: 'COMPLETED',
            visitType: 'OFFLINE',
            reasonForVisit: 'Routine cardiac check-up',
            notesFromDoctor: 'All vitals normal. Continue current medication.',
            consultationFee: 800,
            paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_003',
            razorpayPaymentId: 'pay_seed_003',
        },
    });

    const apt4 = await prisma.appointment.create({
        data: {
            patientId: amit.id,
            doctorId: drGupta.id,
            date: new Date('2026-02-20'),
            startTime: '09:00',
            endTime: '09:30',
            status: 'COMPLETED',
            visitType: 'OFFLINE',
            reasonForVisit: 'Knee pain after playing cricket',
            notesFromDoctor: 'Mild ligament strain. Rest and physiotherapy recommended.',
            consultationFee: 600,
            paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_004',
            razorpayPaymentId: 'pay_seed_004',
        },
    });

    // Upcoming/pending appointments
    const apt5 = await prisma.appointment.create({
        data: {
            patientId: rahul.id,
            doctorId: drSharma.id,
            date: new Date('2026-03-15'),
            startTime: '10:00',
            endTime: '10:30',
            status: 'CONFIRMED',
            visitType: 'OFFLINE',
            reasonForVisit: 'Follow-up for cardiac check-up',
            consultationFee: 800,
            paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_005',
            razorpayPaymentId: 'pay_seed_005',
        },
    });

    const apt6 = await prisma.appointment.create({
        data: {
            patientId: priya.id,
            doctorId: drPatel.id,
            date: new Date('2026-03-20'),
            startTime: '15:00',
            endTime: '15:30',
            status: 'PENDING',
            visitType: 'ONLINE',
            reasonForVisit: 'Migraine episodes increasing',
            consultationFee: 1000,
            paymentStatus: 'UNPAID',
        },
    });

    console.log(`   ✅ 6 Appointments created (4 completed, 1 confirmed, 1 pending)\n`);

    // ==================== PRESCRIPTIONS ====================
    console.log('💊 Creating Prescriptions...');

    const rx1 = await prisma.prescription.create({
        data: {
            patientId: rahul.id,
            doctorId: drSharma.id,
            medications: [
                { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '3 months', notes: 'After breakfast' },
                { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily', duration: '3 months', notes: 'At bedtime' },
            ],
            lifestyleAdvice: 'Regular walking 30 min daily. Low salt diet. Avoid smoking and alcohol.',
            followUpDate: new Date('2026-03-15'),
        },
    });
    await prisma.appointment.update({ where: { id: apt1.id }, data: { prescriptionId: rx1.id } });

    const rx2 = await prisma.prescription.create({
        data: {
            patientId: rahul.id,
            doctorId: drPatel.id,
            medications: [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '1 week', notes: 'Max 3 times/day' },
                { name: 'Amitriptyline', dosage: '10mg', frequency: 'Once daily', duration: '1 month', notes: 'At bedtime' },
            ],
            lifestyleAdvice: 'Stress management exercises. Adequate sleep (7-8 hrs). Reduce screen time.',
            followUpDate: new Date('2026-02-15'),
        },
    });
    await prisma.appointment.update({ where: { id: apt2.id }, data: { prescriptionId: rx2.id } });

    const rx3 = await prisma.prescription.create({
        data: {
            patientId: priya.id,
            doctorId: drSharma.id,
            medications: [
                { name: 'Metoprolol', dosage: '25mg', frequency: 'Once daily', duration: '6 months', notes: 'Morning after food' },
            ],
            lifestyleAdvice: 'Continue yoga and meditation. Low-fat diet. Avoid caffeine.',
            followUpDate: new Date('2026-05-05'),
        },
    });
    await prisma.appointment.update({ where: { id: apt3.id }, data: { prescriptionId: rx3.id } });

    const rx4 = await prisma.prescription.create({
        data: {
            patientId: amit.id,
            doctorId: drGupta.id,
            medications: [
                { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days', notes: 'After food' },
                { name: 'Diclofenac Gel', dosage: 'Apply locally', frequency: 'Three times daily', duration: '2 weeks', notes: 'On affected knee' },
            ],
            lifestyleAdvice: 'Rest for 2 weeks. Ice pack on knee 15 min 3x/day. No running or jumping.',
            followUpDate: new Date('2026-03-10'),
        },
    });
    await prisma.appointment.update({ where: { id: apt4.id }, data: { prescriptionId: rx4.id } });

    console.log(`   ✅ 4 Prescriptions created\n`);

    // ==================== MEDICAL RECORDS ====================
    console.log('📋 Creating Medical Records...');

    await prisma.medicalRecord.create({
        data: {
            patientId: rahul.id,
            doctorId: drSharma.id,
            appointmentId: apt1.id,
            diagnoses: ['Stable Angina', 'Mild Hypertension'],
            testsOrdered: ['ECG', 'Lipid Profile', 'Blood Sugar'],
            testResults: [
                { testName: 'ECG', result: 'Normal sinus rhythm', date: '2025-12-10', attachmentUrl: null },
                { testName: 'Lipid Profile', result: 'Total Cholesterol: 210 mg/dL (Borderline High), LDL: 140 mg/dL', date: '2025-12-10', attachmentUrl: null },
                { testName: 'Blood Sugar (Fasting)', result: '95 mg/dL (Normal)', date: '2025-12-10', attachmentUrl: null },
            ],
            notes: 'Patient presented with exertional chest pain. ECG normal. Lipid profile shows borderline high cholesterol. Started on low-dose statin. Lifestyle modifications advised.',
        },
    });

    await prisma.medicalRecord.create({
        data: {
            patientId: rahul.id,
            doctorId: drPatel.id,
            appointmentId: apt2.id,
            diagnoses: ['Tension-Type Headache'],
            testsOrdered: ['MRI Brain'],
            testResults: [
                { testName: 'MRI Brain', result: 'No intracranial abnormality detected. No mass lesion or hemorrhage.', date: '2026-01-16', attachmentUrl: null },
            ],
            notes: 'Patient reports bilateral pressing headaches for 2 weeks, worsened by stress and lack of sleep. No neurological deficits. MRI brain normal. Diagnosed as tension-type headache.',
        },
    });

    await prisma.medicalRecord.create({
        data: {
            patientId: priya.id,
            doctorId: drSharma.id,
            appointmentId: apt3.id,
            diagnoses: ['Asthma (well-controlled)', 'Normal cardiac function'],
            testsOrdered: ['2D Echocardiography', 'Pulmonary Function Test'],
            testResults: [
                { testName: '2D Echocardiography', result: 'Normal LV function, EF 62%. No valvular abnormalities.', date: '2026-02-05', attachmentUrl: null },
                { testName: 'Pulmonary Function Test', result: 'FEV1 85% predicted. Mild obstruction, reversible with bronchodilators.', date: '2026-02-05', attachmentUrl: null },
            ],
            notes: 'Routine cardiac check for patient with asthma. Cardiac function is normal. Asthma is well-controlled with current medication. Continue current treatment plan.',
        },
    });

    await prisma.medicalRecord.create({
        data: {
            patientId: amit.id,
            doctorId: drGupta.id,
            appointmentId: apt4.id,
            diagnoses: ['MCL Sprain (Grade 1)', 'Knee Effusion'],
            testsOrdered: ['X-Ray Knee', 'MRI Knee'],
            testResults: [
                { testName: 'X-Ray Knee', result: 'No fracture. Joint space maintained. Mild soft tissue swelling.', date: '2026-02-20', attachmentUrl: null },
                { testName: 'MRI Knee', result: 'Grade 1 MCL sprain. No meniscal tear. Minimal joint effusion.', date: '2026-02-22', attachmentUrl: null },
            ],
            notes: 'Patient injured left knee while playing cricket. Clinical exam shows tenderness over medial collateral ligament. Stable joint. X-ray excludes fracture. MRI confirms grade 1 MCL sprain. Conservative management with rest, ice, and physiotherapy.',
        },
    });

    console.log(`   ✅ 4 Medical Records with detailed test results\n`);

    // ==================== INVOICES ====================
    console.log('🧾 Creating Invoices...');

    await prisma.invoice.create({
        data: {
            patientId: rahul.id, doctorId: drSharma.id, appointmentId: apt1.id,
            totalAmount: 800, items: [{ label: 'Consultation Fee', amount: 800 }],
            paymentMode: 'RAZORPAY', paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_001', razorpayPaymentId: 'pay_seed_001',
        },
    });

    await prisma.invoice.create({
        data: {
            patientId: rahul.id, doctorId: drPatel.id, appointmentId: apt2.id,
            totalAmount: 1000, items: [{ label: 'Consultation Fee', amount: 1000 }],
            paymentMode: 'RAZORPAY', paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_002', razorpayPaymentId: 'pay_seed_002',
        },
    });

    await prisma.invoice.create({
        data: {
            patientId: priya.id, doctorId: drSharma.id, appointmentId: apt3.id,
            totalAmount: 800, items: [{ label: 'Consultation Fee', amount: 800 }],
            paymentMode: 'RAZORPAY', paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_003', razorpayPaymentId: 'pay_seed_003',
        },
    });

    await prisma.invoice.create({
        data: {
            patientId: amit.id, doctorId: drGupta.id, appointmentId: apt4.id,
            totalAmount: 600, items: [{ label: 'Consultation Fee', amount: 600 }],
            paymentMode: 'RAZORPAY', paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_004', razorpayPaymentId: 'pay_seed_004',
        },
    });

    await prisma.invoice.create({
        data: {
            patientId: rahul.id, doctorId: drSharma.id, appointmentId: apt5.id,
            totalAmount: 800, items: [{ label: 'Consultation Fee', amount: 800 }],
            paymentMode: 'RAZORPAY', paymentStatus: 'PAID',
            razorpayOrderId: 'order_seed_005', razorpayPaymentId: 'pay_seed_005',
        },
    });

    console.log(`   ✅ 5 Invoices created\n`);

    // ==================== SUMMARY ====================
    console.log('========================================');
    console.log('  🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    console.log('  Demo Login Credentials:');
    console.log('  ────────────────────────────────────');
    console.log('  ADMIN:');
    console.log('    Email:    admin@hms.com');
    console.log('    Password: admin123');
    console.log('');
    console.log('  DOCTORS:');
    console.log('    dr.sharma@hms.com / doctor123  (Cardiologist)');
    console.log('    dr.patel@hms.com  / doctor123  (Neurologist)');
    console.log('    dr.gupta@hms.com  / doctor123  (Orthopedist)');
    console.log('');
    console.log('  PATIENTS:');
    console.log('    rahul@hms.com / patient123  (Has cardiac & neuro history)');
    console.log('    priya@hms.com / patient123  (Has cardiac check-up)');
    console.log('    amit@hms.com  / patient123  (Has orthopedic injury)');
    console.log('========================================\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
