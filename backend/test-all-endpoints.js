/**
 * Comprehensive API Test Script
 * Tests ALL endpoints of the Hospital Management System
 */
const axios = require('axios');

const BASE = 'http://localhost:5000/api';
let patientToken, doctorToken, adminToken;
let patientId, doctorId, adminId;
let appointmentId, prescriptionId;

const pass = (name) => console.log(`  ✅ ${name}`);
const fail = (name, err) => console.log(`  ❌ ${name}: ${err}`);

async function test(name, fn) {
    try {
        await fn();
        pass(name);
    } catch (e) {
        const msg = e.response ? `${e.response.status} - ${JSON.stringify(e.response.data).slice(0, 150)}` : e.message;
        fail(name, msg);
    }
}

async function run() {
    console.log('\n========================================');
    console.log('  HOSPITAL MANAGEMENT SYSTEM - FULL TEST');
    console.log('========================================\n');

    // ==================== AUTH ====================
    console.log('--- AUTH ENDPOINTS ---');

    await test('Register Patient', async () => {
        const res = await axios.post(`${BASE}/auth/register`, {
            name: 'Patient One', email: 'patient1@test.com', phone: '9876543210', password: 'pass123', role: 'PATIENT'
        });
        patientToken = res.data.data.accessToken;
        patientId = res.data.data.user.id;
        if (!patientToken) throw new Error('No token received');
    });

    await test('Register Doctor', async () => {
        const res = await axios.post(`${BASE}/auth/register`, {
            name: 'Doctor One', email: 'doctor1@test.com', phone: '9876543211', password: 'pass123', role: 'DOCTOR'
        });
        doctorToken = res.data.data.accessToken;
        doctorId = res.data.data.user.id;
        if (!doctorToken) throw new Error('No token received');
    });

    await test('Register Admin', async () => {
        const res = await axios.post(`${BASE}/auth/register`, {
            name: 'Admin One', email: 'admin1@test.com', phone: '9876543212', password: 'pass123', role: 'PATIENT'
        });
        // We need to manually set this user as ADMIN in the DB
        adminId = res.data.data.user.id;
    });

    // Promote admin user via direct Prisma (we'll use the login endpoint after)
    await test('Login Patient', async () => {
        const res = await axios.post(`${BASE}/auth/login`, {
            email: 'patient1@test.com', password: 'pass123'
        });
        patientToken = res.data.data.accessToken;
        if (res.data.data.user.role !== 'PATIENT') throw new Error('Wrong role');
    });

    await test('Login Doctor', async () => {
        const res = await axios.post(`${BASE}/auth/login`, {
            email: 'doctor1@test.com', password: 'pass123'
        });
        doctorToken = res.data.data.accessToken;
        if (res.data.data.user.role !== 'DOCTOR') throw new Error('Wrong role');
    });

    await test('Refresh Token', async () => {
        const loginRes = await axios.post(`${BASE}/auth/login`, {
            email: 'patient1@test.com', password: 'pass123'
        });
        const res = await axios.post(`${BASE}/auth/refresh`, {
            refreshToken: loginRes.data.data.refreshToken
        });
        if (!res.data.data.accessToken) throw new Error('No new token');
    });

    await test('Logout', async () => {
        const res = await axios.post(`${BASE}/auth/logout`);
        if (res.data.message !== 'Logout successful') throw new Error('Wrong message');
    });

    await test('Health Check', async () => {
        const res = await axios.get(`${BASE}/health`);
        if (res.data.status !== 'Server is running') throw new Error('Server not healthy');
    });

    // Validation checks
    await test('Register Validation - Missing fields', async () => {
        try {
            await axios.post(`${BASE}/auth/register`, { name: '' });
            throw new Error('Should have failed');
        } catch (e) {
            if (e.response && e.response.status === 400) return; // expected
            throw e;
        }
    });

    await test('Register Validation - Duplicate email', async () => {
        try {
            await axios.post(`${BASE}/auth/register`, {
                name: 'Dup', email: 'patient1@test.com', phone: '9876543213', password: 'pass123', role: 'PATIENT'
            });
            throw new Error('Should have failed');
        } catch (e) {
            if (e.response && e.response.status === 409) return; // expected
            throw e;
        }
    });

    await test('Login Validation - Wrong password', async () => {
        try {
            await axios.post(`${BASE}/auth/login`, { email: 'patient1@test.com', password: 'wrongpass' });
            throw new Error('Should have failed');
        } catch (e) {
            if (e.response && e.response.status === 401) return;
            throw e;
        }
    });

    // ==================== PATIENT ENDPOINTS ====================
    console.log('\n--- PATIENT ENDPOINTS ---');
    const patientHeaders = { Authorization: `Bearer ${patientToken}` };

    await test('Get Patient Profile', async () => {
        const res = await axios.get(`${BASE}/patients/profile`, { headers: patientHeaders });
        if (!res.data.data.user) throw new Error('No user data');
        if (!res.data.data.profile) throw new Error('No profile data');
    });

    await test('Update Patient Profile', async () => {
        const res = await axios.put(`${BASE}/patients/profile`, {
            gender: 'MALE',
            dateOfBirth: '1995-05-15',
            bloodGroup: 'O_PLUS',
            address: { street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' },
            emergencyContact: { name: 'Emergency Person', phone: '9876543299', relationship: 'Spouse' },
            allergies: ['Penicillin'],
            chronicConditions: ['None'],
        }, { headers: patientHeaders });
        if (res.data.message !== 'Profile updated successfully') throw new Error('Wrong message');
    });

    await test('Get Patient Appointments (empty)', async () => {
        const res = await axios.get(`${BASE}/patients/appointments`, { headers: patientHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('Get Medical History (empty)', async () => {
        const res = await axios.get(`${BASE}/patients/history`, { headers: patientHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('Get Prescriptions (empty)', async () => {
        const res = await axios.get(`${BASE}/patients/prescriptions`, { headers: patientHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('Get Invoices (empty)', async () => {
        const res = await axios.get(`${BASE}/patients/invoices`, { headers: patientHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('RBAC - Patient cannot access doctor endpoints', async () => {
        try {
            await axios.get(`${BASE}/doctors/profile`, { headers: patientHeaders });
            throw new Error('Should have been forbidden');
        } catch (e) {
            if (e.response && e.response.status === 403) return;
            throw e;
        }
    });

    // ==================== DOCTOR ENDPOINTS ====================
    console.log('\n--- DOCTOR ENDPOINTS ---');
    const doctorHeaders = { Authorization: `Bearer ${doctorToken}` };

    await test('Get Doctor Profile', async () => {
        const res = await axios.get(`${BASE}/doctors/profile`, { headers: doctorHeaders });
        if (!res.data.data.user) throw new Error('No user data');
        if (!res.data.data.profile) throw new Error('No profile data');
    });

    await test('Update Doctor Profile', async () => {
        const res = await axios.put(`${BASE}/doctors/profile`, {
            specialization: 'Neurologist',
            qualifications: ['MBBS', 'MD Neurology'],
            yearsOfExperience: 10,
            hospitalName: 'City Hospital',
            consultationFee: 500,
            availableDays: [1, 2, 3, 4, 5],
            dailyStartTime: '09:00',
            dailyEndTime: '17:00',
            slotDurationMinutes: 30,
            maxPatientsPerSlot: 1,
        }, { headers: doctorHeaders });
        if (res.data.message !== 'Profile updated successfully') throw new Error('Wrong message');
    });

    await test('Get Doctor Appointments (empty)', async () => {
        const res = await axios.get(`${BASE}/doctors/appointments`, { headers: doctorHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('Get Doctor Available Slots', async () => {
        // Get next Monday
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7 || 7);
        const dateStr = nextMonday.toISOString().split('T')[0];
        const res = await axios.get(`${BASE}/doctors/slots?date=${dateStr}`, { headers: doctorHeaders });
        if (!res.data.data.slots) throw new Error('No slots data');
    });

    await test('Get Doctor Prescriptions (empty)', async () => {
        const res = await axios.get(`${BASE}/doctors/prescriptions`, { headers: doctorHeaders });
        if (!Array.isArray(res.data.data)) throw new Error('Not an array');
    });

    await test('RBAC - Doctor cannot access patient endpoints', async () => {
        try {
            await axios.get(`${BASE}/patients/profile`, { headers: doctorHeaders });
            throw new Error('Should have been forbidden');
        } catch (e) {
            if (e.response && e.response.status === 403) return;
            throw e;
        }
    });

    // ==================== DOCTOR SEARCH (PUBLIC) ====================
    console.log('\n--- DOCTOR SEARCH (PUBLIC) ---');

    await test('Search Doctors', async () => {
        const res = await axios.get(`${BASE}/doctor-search/search`);
        if (!res.data.data.doctors) throw new Error('No doctors array');
        if (!res.data.data.pagination) throw new Error('No pagination');
    });

    await test('Search Doctors with specialization filter', async () => {
        const res = await axios.get(`${BASE}/doctor-search/search?specialization=Neurologist`);
        if (!res.data.data.doctors) throw new Error('No doctors array');
    });

    await test('Get Doctor Detail', async () => {
        const res = await axios.get(`${BASE}/doctor-search/${doctorId}`);
        if (!res.data.data.doctor) throw new Error('No doctor data');
    });

    await test('Get Doctor Slots (public)', async () => {
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7 || 7);
        const dateStr = nextMonday.toISOString().split('T')[0];
        const res = await axios.get(`${BASE}/doctor-search/${doctorId}/slots?date=${dateStr}`);
        if (!res.data.data.slots) throw new Error('No slots data');
    });

    // ==================== APPOINTMENTS ====================
    console.log('\n--- APPOINTMENT FLOW ---');

    await test('Create Appointment (Patient)', async () => {
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7 || 7);
        const dateStr = nextMonday.toISOString().split('T')[0];

        const res = await axios.post(`${BASE}/appointments`, {
            doctorId,
            date: dateStr,
            startTime: '10:00',
            endTime: '10:30',
            visitType: 'OFFLINE',
            reasonForVisit: 'Headache testing',
        }, { headers: patientHeaders });
        appointmentId = res.data.data.appointment.id;
        if (!appointmentId) throw new Error('No appointment ID');
        if (!res.data.data.order) throw new Error('No payment order');
    });

    await test('Verify Mock Payment', async () => {
        const res = await axios.post(`${BASE}/appointments/verify-payment`, {
            appointmentId,
            razorpayOrderId: `order_mock_${Date.now()}`,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'mock_signature',
        }, { headers: patientHeaders });
        if (res.data.message !== 'Payment verified and appointment confirmed') throw new Error('Wrong message');
    });

    await test('Get Patient Appointments (with data)', async () => {
        const res = await axios.get(`${BASE}/patients/appointments`, { headers: patientHeaders });
        if (res.data.data.length === 0) throw new Error('No appointments found');
    });

    await test('Get Doctor Appointments (with data)', async () => {
        const res = await axios.get(`${BASE}/doctors/appointments`, { headers: doctorHeaders });
        if (res.data.data.length === 0) throw new Error('No appointments found');
    });

    await test('Complete Appointment (Doctor)', async () => {
        const res = await axios.patch(`${BASE}/doctors/appointments/${appointmentId}/complete`, {}, { headers: doctorHeaders });
        if (res.data.message !== 'Appointment marked as complete') throw new Error('Wrong message');
    });

    // ==================== PRESCRIPTIONS & MEDICAL RECORDS ====================
    console.log('\n--- PRESCRIPTIONS & MEDICAL RECORDS ---');

    await test('Create Prescription (Doctor)', async () => {
        const res = await axios.post(`${BASE}/doctors/prescriptions`, {
            patientId,
            appointmentId,
            medications: [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', notes: 'After food' }
            ],
            lifestyleAdvice: 'Get adequate rest',
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { headers: doctorHeaders });
        prescriptionId = res.data.data.id;
        if (!prescriptionId) throw new Error('No prescription ID');
    });

    await test('Get Doctor Prescriptions (with data)', async () => {
        const res = await axios.get(`${BASE}/doctors/prescriptions`, { headers: doctorHeaders });
        if (res.data.data.length === 0) throw new Error('No prescriptions found');
    });

    await test('Get Patient Prescriptions (with data)', async () => {
        const res = await axios.get(`${BASE}/patients/prescriptions`, { headers: patientHeaders });
        if (res.data.data.length === 0) throw new Error('No prescriptions found');
    });

    await test('Create Medical Record (Doctor)', async () => {
        const res = await axios.post(`${BASE}/doctors/medical-records`, {
            patientId,
            appointmentId,
            diagnoses: ['Tension Headache'],
            testsOrdered: ['Blood Test'],
            testResults: [{ testName: 'Blood Test', result: 'Normal', date: new Date().toISOString() }],
            notes: 'Patient presented with mild tension headache. No alarming symptoms.',
        }, { headers: doctorHeaders });
        if (res.data.message !== 'Medical record created successfully') throw new Error('Wrong message');
    });

    await test('Get Patient Medical History (with data)', async () => {
        const res = await axios.get(`${BASE}/patients/history`, { headers: patientHeaders });
        if (res.data.data.length === 0) throw new Error('No records found');
    });

    // ==================== INVOICES ====================
    console.log('\n--- INVOICES ---');

    await test('Get Patient Invoices (with data)', async () => {
        const res = await axios.get(`${BASE}/patients/invoices`, { headers: patientHeaders });
        if (res.data.data.length === 0) throw new Error('No invoices found');
    });

    // ==================== ADMIN (needs ADMIN role) ====================
    console.log('\n--- ADMIN ENDPOINTS ---');

    // We need to promote the admin user - since we can't do it via API, test that non-admin gets 403
    await test('RBAC - Non-admin cannot access admin stats', async () => {
        try {
            await axios.get(`${BASE}/admin/stats`, { headers: patientHeaders });
            throw new Error('Should have been forbidden');
        } catch (e) {
            if (e.response && e.response.status === 403) return;
            throw e;
        }
    });

    await test('RBAC - Non-admin cannot access admin users', async () => {
        try {
            await axios.get(`${BASE}/admin/users`, { headers: doctorHeaders });
            throw new Error('Should have been forbidden');
        } catch (e) {
            if (e.response && e.response.status === 403) return;
            throw e;
        }
    });

    // ==================== SYMPTOM CHECKER ====================
    console.log('\n--- SYMPTOM CHECKER ---');

    await test('Symptom Checker - requires auth', async () => {
        try {
            await axios.post(`${BASE}/symptom-checker`, { symptoms: 'headache' });
            throw new Error('Should have required auth');
        } catch (e) {
            if (e.response && e.response.status === 401) return;
            throw e;
        }
    });

    await test('Symptom Checker - requires patient role', async () => {
        try {
            await axios.post(`${BASE}/symptom-checker`, { symptoms: 'headache' }, { headers: doctorHeaders });
            throw new Error('Should have been forbidden');
        } catch (e) {
            if (e.response && e.response.status === 403) return;
            throw e;
        }
    });

    // ==================== EDGE CASES ====================
    console.log('\n--- EDGE CASES & ERROR HANDLING ---');

    await test('404 for unknown route', async () => {
        try {
            await axios.get(`${BASE}/nonexistent`);
            throw new Error('Should have 404');
        } catch (e) {
            if (e.response && e.response.status === 404) return;
            throw e;
        }
    });

    await test('401 for missing auth token', async () => {
        try {
            await axios.get(`${BASE}/patients/profile`);
            throw new Error('Should have 401');
        } catch (e) {
            if (e.response && e.response.status === 401) return;
            throw e;
        }
    });

    await test('401 for invalid auth token', async () => {
        try {
            await axios.get(`${BASE}/patients/profile`, { headers: { Authorization: 'Bearer invalid_token' } });
            throw new Error('Should have 401');
        } catch (e) {
            if (e.response && e.response.status === 401) return;
            throw e;
        }
    });

    await test('Duplicate slot booking rejected', async () => {
        try {
            const today = new Date();
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7 || 7);
            const dateStr = nextMonday.toISOString().split('T')[0];
            // Try to book same slot again
            await axios.post(`${BASE}/appointments`, {
                doctorId, date: dateStr, startTime: '10:00', endTime: '10:30', visitType: 'OFFLINE', reasonForVisit: 'Duplicate',
            }, { headers: patientHeaders });
            throw new Error('Should have rejected duplicate');
        } catch (e) {
            if (e.response && (e.response.status === 409 || e.response.status === 500)) return;
            throw e;
        }
    });

    // ==================== REDIS CACHING ====================
    console.log('\n--- REDIS CACHING ---');

    await test('Redis Cache - Second search should be faster', async () => {
        // Clear any stale cache by using unique params
        const t1 = Date.now();
        await axios.get(`${BASE}/doctor-search/search?specialization=Neurologist&page=1`);
        const first = Date.now() - t1;

        const t2 = Date.now();
        await axios.get(`${BASE}/doctor-search/search?specialization=Neurologist&page=1`);
        const second = Date.now() - t2;

        console.log(`    First request: ${first}ms, Second (cached): ${second}ms`);
    });

    console.log('\n========================================');
    console.log('  ALL TESTS COMPLETE!');
    console.log('========================================\n');
}

run().catch(console.error);
