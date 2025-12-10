const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    mode: { type: String, enum: ["offline", "online"], required: true },
    venue: { type: String, trim: true }, 
  fee: { type: Number, default: 0 },
    posterUrl: { type: String }, 
    donationAccepted: { type: Boolean, default: false }, 
    description: { type: String, trim: true, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    registeredUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        paid: { type: Boolean, default: false },
        txHash: { type: String },
        amount: { type: Number, default: 0 },
        registeredAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
