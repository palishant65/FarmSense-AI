import { Router } from "express";
import { register, login, logout, me, updateMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.post("/register", register);
r.post("/login", login);
r.post("/logout", protect, logout);
r.get("/me", protect, me);
r.patch("/me", protect, updateMe);
export default r;
