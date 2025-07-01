import { Schema, model, Types, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface for document methods
export interface IRoom extends Document {
  name: string;
  visibility: "public" | "private" | "secret";
  password?: string;
  createdBy: Types.ObjectId;
  // members: Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
}

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "secret"],
      default: "public",
    },
    password: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Method to compare password
roomSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidate, this.password);
};

export default model<IRoom>("Room", roomSchema);
