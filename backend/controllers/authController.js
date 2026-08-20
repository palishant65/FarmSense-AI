import User from "../models/User.js";
import Farm from "../models/Farm.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import { signToken } from "../middleware/auth.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return fail(res, "name, email, password required", 422);
  if (password.length < 6) return fail(res, "Password min 6 chars", 422);
  const exists = await User.findOne({ email });
  if (exists) return fail(res, "Email already registered", 409);
  const user = await User.create({ name, email, password, phone });
  await Farm.create({ user: user._id, farmer: name });
  const token = signToken(user);
  return ok(res, { user: user.toSafe(), token }, "Registered", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "email and password required", 422);
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) return fail(res, "Invalid credentials", 401);
  return ok(res, { user: user.toSafe(), token: signToken(user) }, "Logged in");
});

export const logout = asyncHandler(async (_req, res) => ok(res, {}, "Logged out"));

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toSafe() }));

export const updateMe = asyncHandler(async (req, res) => {
  const allow = ["name", "phone", "language", "theme", "units", "avatar"];
  allow.forEach((k) => {
    if (req.body[k] !== undefined) req.user[k] = req.body[k];
  });
  await req.user.save();
  return ok(res, { user: req.user.toSafe() }, "Profile updated");
});
