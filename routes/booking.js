import express from "express";
import { bookRoom, updateBookingStatus, getAllBookings, getUserBookingHistory, getHostBookings, deleteBooking, cancelBooking } from "../controllers/booking.js";
import { verifyToken, verifyHost } from "../utils/verifyToken.js";

const router = express.Router();

// Đặt phòng
router.post("/", bookRoom);

// Lấy lịch sử đặt phòng của người dùng
router.get("/history", getUserBookingHistory);

// Lấy danh sách đặt phòng của host
router.get("/host", getHostBookings);

// Xóa đặt phòng
router.delete("/:id", deleteBooking);

// Hủy đặt phòng
router.put("/cancel/:id", cancelBooking); // Thêm API hủy đặt phòng

// Cập nhật trạng thái đặt phòng
router.put("/:id/status",  updateBookingStatus);

// Lấy tất cả thông tin đặt phòng
router.get("/", getAllBookings);

export default router;
