import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fail } from "../utils/response.js";

export async function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
  if (!token) return fail(res, "Not authorized", 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return fail(res, "User not found", 401);
    req.user = user;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

export function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });
}
