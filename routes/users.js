import express from "express";
import {
  updateUser,
  deleteUser,
  getUser,
  getUsers,
  getRole,
} from "../controllers/user.js";
import { verifyAdmin, verifyToken, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

//UPDATE
router.put("/:id", verifyUser, updateUser);

//DELETE
router.delete("/:id", verifyUser, deleteUser);

//GET
router.get("/:id", verifyUser, getUser);
router.get("/role/:role", verifyAdmin, getRole);

//GET ALL
router.get("/", verifyAdmin, getUsers);


export default router;