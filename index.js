import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import hotelsRoute from "./routes/hotels.js";
import roomsRoute from "./routes/rooms.js";
import bookingsRoute from "./routes/booking.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { sendEmail } from "./utils/sendMail.js"; // Nhập sendEmail

const app = express();
dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log("Connected to mongoDB.");
    } catch (error) {
        throw error;
    }
};

mongoose.connection.on("disconnected", () => {
    console.log("mongoDB disconnected!");
});

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Example: send email when booking status changes
const handleBookingStatusChange = async (booking) => {
    const { email, status, roomInfo, hotelName } = booking; // Assume booking has these fields
    let subject, text;

    if (status === "confirmed") {
        subject = "Đơn đặt phòng đã được duyệt";
        text = `Đơn đặt phòng (${roomInfo}, ${hotelName}) đã được duyệt. Vui lòng đặt cọc trước 30% để có thể giữ phòng.`;
    } else if (status === "rejected") {
        subject = "Đơn đặt phòng thất bại";
        text = `Đơn đặt phòng (${roomInfo}, ${hotelName}) đã thất bại. Thật xin lỗi vì sự bất tiện này.`;
    }

    sendEmail(email, subject, text);
};

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/hotels", hotelsRoute);
app.use("/api/rooms", roomsRoute);
app.use("/api/bookings", bookingsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack,
    });
});

app.listen(8800, () => {
    connect();
    console.log("Connected to backend.");
});
