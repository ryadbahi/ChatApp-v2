import { Schema, model, Types, Document } from "mongoose";

export interface IMessage extends Document {
  room: Types.ObjectId;
  sender: Types.ObjectId;
  content?: string;
  imageUrl?: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model<IMessage>("Message", messageSchema);
