import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 0, // For voice messages, duration in seconds
    },
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;
