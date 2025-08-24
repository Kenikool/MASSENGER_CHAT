import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import dayjs from "dayjs";
const generateProfileToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true, // Prevents XSS attacks
    sameSite: "strict", // CSRF attacks
    secure: process.env.NODE_ENV !== "development",
  });
};
export const signUp = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    //   validate all inputs
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    //  validating password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    //find user by email
    const user = await User.findOne({ email });

    //   checking if user already exist
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    //   hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName,
      email: email,
      password: hashedPassword,
    });

    if (newUser) {
      //   generate jwt token
      generateToken(newUser._id, res);
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        message: "User created successfully",
      });
    } else {
      return res.status(500).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password, token } = req.body;

  try {
    const user = await User.findOne({ email });

    //   checking if user exists or not
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //    compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check for 2FA
    if (user.isTwoFactorEnabled) {
      if (!token) {
        // Return a specific status to signal the client needs to ask for 2FA token
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
        return res.status(401).json({ error: "Invalid 2FA token" });
      }
    }

    //   generate jwt token
    generateToken(user._id, res);
    // Calculate days as member
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

    // checking if profilepic is provided
    if (!profilePic) {
      return res.status(400).json({ message: "profile pic is required" });
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: uploadResponse.secure_url,
      },
      { new: true }
    );

    generateProfileToken(updatedUser._id, res);

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
    // Calculate days as member using the createdAt timestamp
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day"); // Exclude sensitive data and add the new field
    const { password, ...userData } = user.toObject();
    userData.accountAgeDays = accountAgeDays;
    return res.status(200).json(userData);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDetails = async (req, res) => {
  try {
    const { fullName, email, about } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.about = about || user.about;

    await user.save();
    generateProfileToken(user._id, res); // Re-generate token with new data

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

    // 1. Verify the current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changePassword controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// New function to generate 2FA secret and QR code
export const setupTwoFactor = async (req, res) => {
  try {
    const user = req.user; // Assuming req.user is set by a middleware like protectRoute

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

// New function to verify 2FA token and enable 2FA
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
