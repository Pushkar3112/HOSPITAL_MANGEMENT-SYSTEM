const { prisma } = require("../config/database");
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
    const { doctorId, date, startTime, endTime, visitType, reasonForVisit } = req.body;
    const patientId = req.user.userId;

    // Check if slot is still available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        startTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      }
    });

    if (existingAppointment) {
      throw new ApiError(409, "This slot is already booked");
    }

    // Get doctor to fetch consultation fee
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId }
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    // Create appointment in PENDING status
    const appointment = await prisma.appointment.create({
      data: {
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
      }
    });

    // Create Razorpay order
    const order = await createOrder(doctor.consultationFee, appointment.id);

    // Create invoice
    await prisma.invoice.create({
      data: {
        patientId,
        doctorId,
        appointmentId: appointment.id,
        totalAmount: doctor.consultationFee,
        items: [
          {
            label: "Consultation Fee",
            amount: doctor.consultationFee,
          },
        ],
        paymentStatus: "UNPAID",
        razorpayOrderId: order.id,
      }
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

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw new ApiError(400, "Payment verification failed");
    }

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }
    });

    // Update invoice
    await prisma.invoice.updateMany({
      where: { appointmentId },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId,
      }
    });

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

      const appointmentList = await prisma.appointment.findMany({
        where: { razorpayOrderId: order_id }
      });

      if (appointmentList.length > 0) {
        const appointment = appointmentList[0];
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            razorpayPaymentId: payment_id,
          }
        });

        // Update invoice
        await prisma.invoice.updateMany({
          where: { razorpayOrderId: order_id },
          data: { paymentStatus: "PAID", razorpayPaymentId: payment_id }
        });
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
