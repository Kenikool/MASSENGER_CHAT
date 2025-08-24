import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // You can add more fields here like fileName, fileUrl, fileType, etc.
    // For counting purposes, just the senderId is sufficient.
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;
