import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
}
const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate: string) {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
