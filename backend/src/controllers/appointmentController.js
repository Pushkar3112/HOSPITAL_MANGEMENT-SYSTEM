const Appointment = require("../models/Appointment");
const Invoice = require("../models/Invoice");
const { sendResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const {
  createOrder,
  verifyPaymentSignature,
} = require("../utils/razorpayService");

/**
 * Create appointment and generate payment order
 */
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, startTime, endTime, visitType, reasonForVisit } =
      req.body;
    const patientId = req.user.userId;

    // Check if slot is still available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      startTime,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (existingAppointment) {
      throw new ApiError(409, "This slot is already booked");
    }

    // Get doctor to fetch consultation fee
    const DoctorProfile = require("../models/DoctorProfile");
    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    // Create appointment in PENDING status
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: new Date(date),
      startTime,
      endTime,
      status: "PENDING",
      visitType,
      reasonForVisit,
      paymentStatus: "UNPAID",
      consultationFee: doctor.consultationFee,
    });

    // Create Razorpay order
    const order = await createOrder(doctor.consultationFee, appointment._id);

    // Create invoice
    await Invoice.create({
      patientId,
      doctorId,
      appointmentId: appointment._id,
      totalAmount: doctor.consultationFee,
      items: [
        {
          label: "Consultation Fee",
          amount: doctor.consultationFee,
        },
      ],
      paymentStatus: "UNPAID",
      razorpayOrderId: order.id,
    });

    return sendResponse(
      res,
      201,
      {
        appointment,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      },
      "Appointment created, please complete payment"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment and confirm appointment
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    console.log(
      "[verifyPayment] Verifying payment:",
      appointmentId,
      razorpayOrderId
    );

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    console.log("[verifyPayment] Signature valid:", isValid);

    if (!isValid) {
      throw new ApiError(400, "Payment verification failed");
    }

    // Update appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
      { new: true }
    );

    console.log("[verifyPayment] Appointment updated:", appointment?._id);

    // Update invoice
    await Invoice.findOneAndUpdate(
      { appointmentId },
      {
        paymentStatus: "PAID",
        razorpayPaymentId,
      }
    );

    return sendResponse(
      res,
      200,
      appointment,
      "Payment verified and appointment confirmed"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Razorpay webhook
 */
const handleWebhook = async (req, res, next) => {
  try {
    const { event, payload } = req.body;

    if (event === "payment.authorized") {
      const { order_id, payment_id } = payload.payment.entity;

      const appointment = await Appointment.findOne({
        razorpayOrderId: order_id,
      });
      if (appointment) {
        appointment.status = "CONFIRMED";
        appointment.paymentStatus = "PAID";
        appointment.razorpayPaymentId = payment_id;
        await appointment.save();

        // Update invoice
        await Invoice.findOneAndUpdate(
          { razorpayOrderId: order_id },
          { paymentStatus: "PAID", razorpayPaymentId: payment_id }
        );
      }
    }

    return sendResponse(res, 200, {}, "Webhook processed");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  verifyPayment,
  handleWebhook,
};
