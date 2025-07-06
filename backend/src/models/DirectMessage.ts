import mongoose, { Schema, Document } from "mongoose";

export interface IDirectMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

const DirectMessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
DirectMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
DirectMessageSchema.index({ recipient: 1, readAt: 1 });

export default mongoose.model<IDirectMessage>(
  "DirectMessage",
  DirectMessageSchema
);
