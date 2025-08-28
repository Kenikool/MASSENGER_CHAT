import { generateToken } from "../utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import dayjs from "dayjs";
import crypto from "crypto";
import EmailVerificationToken from "../models/EmailVerificationToken.js";
import { validatePassword } from "../utils/passwordValidator.js";
import Message from "../models/message.model.js";
import File from "../models/File.js";
import {
  transporter,
  sendVerificationEmail,
  sendChangeEmailVerification, // Keep this import
  sendMagicLinkEmail,
} from "../lib/emailService.js";

// The duplicate sendChangeEmailVerification function has been removed.
// It is now correctly imported from emailService.js

export const signUp = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: passwordErrors.join(" ") });
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

    await newUser.save(); // ✅ CORRECT ORDER: Generate the token first

    const verificationToken = crypto.randomBytes(32).toString("hex"); // ✅ Then, hash the token

    const hashedToken = await bcrypt.hash(verificationToken, 10);

    const emailToken = new EmailVerificationToken({
      userId: newUser._id,
      token: hashedToken, // ✅ Save the hashed token to the database
      newEmail: newUser.email,
    });
    await emailToken.save();

    try {
      await sendVerificationEmail(
        newUser.email,
        newUser.fullName,
        verificationToken // ✅ Send the plain-text token to the user
      );
      
      console.log(`Verification email sent successfully to: ${newUser.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the signup, but log the error
    }

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

    generateToken(user._id, res, req);
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
    const token = req.cookies.jwt;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        user.sessions = user.sessions.filter(
          (session) => session.token !== token
        );
        await user.save();
      }
    }
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
    req.user.profilePic = uploadResponse.secure_url;
    await req.user.save();

    generateToken(req.user._id, res, req); // Use generateToken

    return res.status(200).json(req.user);
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
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.fullName = fullName || user.fullName;
    user.about = about || user.about;

    await user.save();
    generateToken(user._id, res, req);

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

    const user = req.user;
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
    const hashedToken = await bcrypt.hash(token, 10); // Hash the token
    const emailToken = new EmailVerificationToken({
      userId: user._id,
      token: hashedToken, // Store the hashed token
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
    
    console.log("Email change verification attempt with token:", token);
    
    if (!token) {
      return res.status(400).json({ error: "Invalid verification token." });
    }

    // Get all email verification tokens and check each one
    const emailTokens = await EmailVerificationToken.find().populate("userId");
    
    console.log(`Found ${emailTokens.length} email verification tokens for email change`);

    let validToken = null;
    let user = null;

    // Check each token to find a match
    for (const emailToken of emailTokens) {
      try {
        const isTokenValid = await bcrypt.compare(token, emailToken.token);
        if (isTokenValid) {
          validToken = emailToken;
          user = emailToken.userId;
          console.log("Valid email change token found for user:", user.email);
          break;
        }
      } catch (compareError) {
        console.log("Token comparison error:", compareError.message);
        continue;
      }
    }

    if (!validToken || !user) {
      console.log("No valid email change token found for provided token:", token);
      return res
        .status(400)
        .json({ error: "The verification link is invalid or has expired." });
    }

    // Update user email
    const oldEmail = user.email;
    user.email = validToken.newEmail;
    await user.save();
    
    // Delete the used token
    await EmailVerificationToken.findByIdAndDelete(validToken._id);

    console.log(`Email change successful: ${oldEmail} -> ${user.email}`);

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

    console.log("Email verification attempt with token:", token);

    if (!token) {
      return res.status(400).json({ error: "Invalid verification link." });
    }

    // Get all email verification tokens and check each one
    const emailTokens = await EmailVerificationToken.find().populate("userId");
    
    console.log(`Found ${emailTokens.length} email verification tokens in database`);

    let validToken = null;
    let user = null;

    // Check each token to find a match
    for (const emailToken of emailTokens) {
      try {
        const isTokenValid = await bcrypt.compare(token, emailToken.token);
        if (isTokenValid) {
          validToken = emailToken;
          user = emailToken.userId;
          console.log("Valid token found for user:", user.email);
          break;
        }
      } catch (compareError) {
        console.log("Token comparison error:", compareError.message);
        continue;
      }
    }

    if (!validToken || !user) {
      console.log("No valid token found for provided token:", token);
      return res
        .status(400)
        .json({ error: "The verification link is invalid or has expired." });
    }

    // Check if the user is already verified before proceeding
    if (user.isVerified) {
      await EmailVerificationToken.findByIdAndDelete(validToken._id);
      console.log("User already verified:", user.email);
      return res
        .status(200)
        .json({ message: "Email already verified. Redirecting to login..." });
    }

    // Verify the user
    user.isVerified = true;
    await user.save();

    // Delete the used token
    await EmailVerificationToken.findByIdAndDelete(validToken._id);

    console.log("Email verification successful for user:", user.email);

    // Generate JWT token for automatic login
    generateToken(user._id, res, req);
    
    res.status(200).json({
      message: "Email verified successfully! Redirecting to login...",
    });
  } catch (error) {
    console.error("Error in verifyAccount:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Handle cases where the user doesn't exist or is already verified
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Check for an existing token to prevent duplicates
    const existingToken = await EmailVerificationToken.findOne({
      userId: user._id,
    });
    if (existingToken) {
      await EmailVerificationToken.findByIdAndDelete(existingToken._id);
    }

    // Generate a new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(verificationToken, 10);
    const emailToken = new EmailVerificationToken({
      userId: user._id,
      token: hashedToken,
      newEmail: user.email, // This field is already on your model, so we can reuse it
    });
    await emailToken.save();

    // Send the new verification email
    await sendVerificationEmail(user.email, user.fullName, verificationToken);

    res.status(200).json({
      message: "A new verification email has been sent successfully!",
    });
  } catch (error) {
    console.error("Error in resendVerificationEmail controller:", error);
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

export const requestMagicLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if user email is verified
    if (!user.isVerified) {
      return res.status(400).json({ 
        error: "Please verify your email address first before using magic login." 
      });
    }

    // Generate magic token
    const magicToken = crypto.randomBytes(32).toString("hex");
    user.magicLinkToken = magicToken;
    user.magicLinkTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    console.log(`Magic link requested for user: ${user.email}, token: ${magicToken}`);

    await sendMagicLinkEmail(user.email, user.fullName, magicToken);

    res.status(200).json({ message: "Magic link sent to your email!" });
  } catch (error) {
    console.error("Error in requestMagicLink controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const magicLogin = async (req, res) => {
  try {
    const { token } = req.params;

    console.log("Magic login attempt with token:", token);

    if (!token) {
      return res.status(400).json({ error: "Magic link token is required." });
    }

    // Find user with valid token
    const user = await User.findOne({
      magicLinkToken: token,
      magicLinkTokenExpires: { $gt: Date.now() },
    });

    console.log("User found for magic login:", user ? user.email : "No user found");
    
    if (!user) {
      console.log("Magic login failed - invalid or expired token:", token);
      return res.status(400).json({ error: "Invalid or expired magic link." });
    }

    // Double-check email verification
    if (!user.isVerified) {
      return res.status(400).json({ 
        error: "Please verify your email address first." 
      });
    }

    console.log(`Magic login successful for user: ${user.email}`);

    // Generate JWT token and set cookie
    generateToken(user._id, res, req);

    // Invalidate the magic link token
    user.magicLinkToken = undefined;
    user.magicLinkTokenExpires = undefined;
    await user.save();

    // Return user data
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");
    return res.status(200).json({
      message: "Magic login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        accountAgeDays,
      },
    });
  } catch (error) {
    console.error("Error in magicLogin controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user._id;

    // Fetch the user, including the password field for comparison
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid password." });
    }

    // Delete associated data (e.g., messages, email verification tokens)
    await EmailVerificationToken.deleteMany({ userId });
    await Message.deleteMany({ senderId: userId });
    await File.deleteMany({ senderId: userId });

    await User.findByIdAndDelete(userId);

    // Clear the JWT cookie
    res.cookie("jwt", "", { maxAge: 0 });

    res
      .status(200)
      .json({ message: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error("Error in deleteAccount controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("sessions");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(user.sessions);
  } catch (error) {
    console.error("Error in getSessions controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.sessions = user.sessions.filter(
      (session) => session._id.toString() !== sessionId
    );

    await user.save();

    res.status(200).json({ message: "Session revoked successfully." });
  } catch (error) {
    console.error("Error in revokeSession controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
