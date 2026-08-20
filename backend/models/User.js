import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: String,
    language: { type: String, default: "en" },
    theme: { type: String, default: "light" },
    units: { type: String, default: "metric" },
    avatar: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafe = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    language: this.language,
    theme: this.theme,
    units: this.units,
    avatar: this.avatar,
  };
};

export default mongoose.model("User", userSchema);
