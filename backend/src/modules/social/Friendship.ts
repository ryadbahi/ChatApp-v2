import mongoose, { Schema, Document } from "mongoose";

export interface IFriendship extends Document {
  _id: mongoose.Types.ObjectId;
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema: Schema = new Schema(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate friendships and ensure consistent ordering
FriendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Create indexes for efficient friend lookups
FriendshipSchema.index({ user1: 1 });
FriendshipSchema.index({ user2: 1 });

// Pre-save middleware to ensure consistent ordering (smaller ObjectId first)
FriendshipSchema.pre("save", function (next) {
  if (
    this.user1 &&
    this.user2 &&
    this.user1.toString() > this.user2.toString()
  ) {
    const temp = this.user1;
    this.user1 = this.user2;
    this.user2 = temp;
  }
  next();
});

export default mongoose.model<IFriendship>("Friendship", FriendshipSchema);
