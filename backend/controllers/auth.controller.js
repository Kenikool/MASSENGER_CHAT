import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import dayjs from "dayjs";
import crypto from "crypto";
import EmailVerificationToken from "../models/EmailVerificationToken.js";
import {
  transporter,
  sendVerificationEmail,
  sendChangeEmailVerification, // Keep this import
} from "../lib/emailService.js";

// The duplicate sendChangeEmailVerification function has been removed.
// It is now correctly imported from emailService.js

export const signUp = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailToken = new EmailVerificationToken({
      userId: newUser._id,
      token: verificationToken,
      newEmail: newUser.email,
    });
    await emailToken.save();

    await sendVerificationEmail(
      newUser.email,
      newUser.fullName,
      verificationToken
    );

    return res.status(201).json({
      message:
        "Account created successfully. Please verify your email to log in.",
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, token } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email address before logging in.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isTwoFactorEnabled) {
      if (!token) {
        return res.status(200).json({
          needsTwoFactor: true,
          message: "Two-factor authentication required",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: token,
      });

      if (!verified) {
        return res.status(401).json({ message: "Invalid 2FA token" });
      }
    }

    generateToken(user._id, res);
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");
    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      accountAgeDays,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    generateToken(updatedUser._id, res); // Use generateToken

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");
    const { password, ...userData } = user.toObject();
    userData.accountAgeDays = accountAgeDays;
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDetails = async (req, res) => {
  try {
    const { fullName, about } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.fullName = fullName || user.fullName;
    user.about = about || user.about;

    await user.save();
    generateToken(user._id, res);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in updateDetails controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changePassword controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const setupTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({
      name: `Chatty (${user.email})`,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ error: "Failed to generate QR code" });
      }
      res.status(200).json({ qrCode: data_url, secret: secret.base32 });
    });
  } catch (error) {
    console.error("Error in 2FA setup:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid token" });
    }

    user.isTwoFactorEnabled = true;
    await user.save();

    res
      .status(200)
      .json({ message: "Two-factor authentication enabled successfully" });
  } catch (error) {
    console.error("Error in 2FA verification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const disableTwoFactor = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null; // Clear the secret for security
    await user.save();

    res
      .status(200)
      .json({ message: "Two-factor authentication has been disabled." });
  } catch (error) {
    console.error("Error in disabling 2FA:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user._id;

    if (!newEmail || !currentPassword) {
      return res
        .status(400)
        .json({ error: "New email and current password are required." });
    }

    // Fetch the user again, this time including the password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid current password." });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res
        .status(400)
        .json({ error: "This email is already in use by another account." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const emailToken = new EmailVerificationToken({
      userId: user._id,
      token,
      newEmail,
    });
    await emailToken.save();

    // This calls the imported function, which is now the correct one to use.
    await sendChangeEmailVerification(newEmail, user.fullName, token);

    res.status(200).json({
      message: "A verification link has been sent to your new email address.",
    });
  } catch (error) {
    console.error("Error in requestEmailChange:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Invalid verification token." });
    }

    const emailToken = await EmailVerificationToken.findOne({ token }).populate(
      "userId"
    );
    if (!emailToken) {
      return res
        .status(400)
        .json({ error: "The verification link is invalid or has expired." });
    }

    const user = emailToken.userId;
    user.email = emailToken.newEmail;
    await user.save();
    await EmailVerificationToken.findByIdAndDelete(emailToken._id);

    res
      .status(200)
      .json({ message: "Your email address has been updated successfully!" });
  } catch (error) {
    console.error("Error in verifyEmailChange:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Invalid verification link." });
    }
    const emailToken = await EmailVerificationToken.findOne({ token }).populate(
      "userId"
    );
    if (!emailToken) {
      return res
        .status(400)
        .json({ error: "The verification link is invalid or has expired." });
    }
    const user = emailToken.userId;
    user.isVerified = true;
    await user.save();
    await EmailVerificationToken.findByIdAndDelete(emailToken._id);

    generateToken(user._id, res);
    res.redirect(`${process.env.FRONTEND_URL}/chat`);
  } catch (error) {
    console.error("Error in verifyAccount:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markBadgeAsSeen = async (req, res) => {
  const { badgeName } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } // Check if the badge is in the user's badges array

    if (user.badges.includes(badgeName)) {
      // Mark the badge as seen (you need a new field for this)
      if (!user.seenBadges.includes(badgeName)) {
        user.seenBadges.push(badgeName);
        await user.save();
        return res.status(200).json({ message: "Badge marked as seen" });
      }
    }

    res.status(200).json({ message: "Badge already seen or not found" });
  } catch (error) {
    console.error("Error marking badge as seen:", error);
    res.status(500).json({ error: "Server error" });
  }
};
