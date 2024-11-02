import Booking from "../models/Booking.js"; 
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import { createError } from "../utils/error.js"; 
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/sendMail.js";


// Đặt phòng
export const bookRoom = async (req, res) => {
  const { userId, hotelId, roomId, roomNumber, checkInDate, checkOutDate } = req.body;

  try {
    // Log dữ liệu nhận được
    console.log("Booking Data:", req.body);

    // Kiểm tra xem tất cả các trường đã được cung cấp
    if (!userId || !hotelId || !roomId || !roomNumber || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Thiếu thông tin đặt phòng." });
    }

    // Tạo một booking mới với roomNumber
    const newBooking = new Booking({
      userId,
      hotelId,
      roomId,
      roomNumber,
      checkInDate,
      checkOutDate,
    });

    // Lưu booking vào cơ sở dữ liệu
    const savedBooking = await newBooking.save();

    // Cập nhật trạng thái phòng, đánh dấu các phòng này là không còn trống
    await Room.updateMany(
      { _id: { $in: roomId } },
      { $set: { available: false } }
    );

    return res.status(200).json(savedBooking);
  } catch (error) {
    console.error("Error creating booking:", error); // Log lỗi chi tiết
    return res.status(500).json({ message: "Đặt phòng thất bại.", error: error.message });
  }
};



export const getUserBookingHistory = async (req, res, next) => {
  const userId = req.query.userId; // Nhận userId từ query params
  
  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    const bookings = await Booking.find({ userId }).populate('hotelId roomId');
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};


// Lấy thông tin đặt phòng từ khách sạn của host và bao gồm thông tin phòng
export const getHostBookings = async (req, res, next) => {
  const hostId = req.query.hostId; // Lấy hostId từ query params

  if (!hostId) {
    return res.status(400).json({ message: "Host ID is required." });
  }

  try {
    // Lấy danh sách khách sạn của host
    const hotels = await Hotel.find({ hostId });

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found for this host." });
    }

    // Lấy danh sách các booking của những khách sạn đó
    const bookings = await Booking.find({
      hotelId: { $in: hotels.map(hotel => hotel._id) }
    })
    .populate({
      path: 'roomId', // Populate thông tin của roomId
      model: 'Room',  // Model tương ứng với room
    })
    .populate({
      path: 'userId', // Populate thông tin của userId
      model: 'User',
    })
    .populate({
      path: 'hotelId', // Populate thông tin của hotelId
      model: 'Hotel',  // Model tương ứng với hotel
    });

    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

// Xóa đặt phòng
export const deleteBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  try {
    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json("Booking has been deleted.");
  } catch (err) {
    next(err);
  }
};
  // API để hủy đặt phòng
export const cancelBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "cancelled" },
      { new: true } // Trả về document đã được cập nhật
    );
    res.status(200).json(updatedBooking);
  } catch (err) {
    next(err);
  }
};

// Lấy tất cả thông tin đặt phòng
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('userId')  // Nếu bạn muốn hiển thị thông tin người dùng
      .populate('hotelId') // Nếu bạn muốn hiển thị thông tin khách sạn
      .populate('roomId'); // Nếu bạn muốn hiển thị thông tin phòng

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};



//////////

// Hàm cập nhật trạng thái đặt phòng
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // Nhận status từ body
    const bookingId = req.params.id; // Nhận bookingId từ params

    // Cập nhật trạng thái đơn đặt phòng trong cơ sở dữ liệu
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Lấy email của người dùng dựa trên userId trong booking
    const userEmail = await User.findById(updatedBooking.userId).select("email"); // Lấy email từ userId

    let subject, text;

    // Gửi email thông báo dựa trên trạng thái
    if (status === "confirmed") {
      subject = "Đơn đặt phòng đã được duyệt";
      text = `Đơn đặt phòng số phòng: ${updatedBooking.roomNumber}, tên phòng: ${updatedBooking.roomId.title} của bạn tại Luna đã được duyệt. Hãy đặt cọc 30% để thành công giữ phòng.`;
      
      // Chuyển trạng thái booking sang "waitingPayment"
      await Booking.findByIdAndUpdate(bookingId, { status: "waitingPayment" });
    } else if (status === "rejected") {
      subject = "Đơn đặt phòng đã bị từ chối";
      text = `Đơn đặt phòng của bạn tại Luna đã không được duyệt. Xin lỗi bạn vì sự bất tiện này.`;
    }

    // Gửi email
    await sendEmail(userEmail.email, subject, text);

    res.status(200).json({ success: true, message: "Booking status updated and email sent." });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ success: false, message: "Error updating booking status." });
  }
};
