import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";

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
  const { email, password } = req.body;

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

    //   generate jwt token
    generateToken(user._id, res);
    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
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
    const { password, ...userData } = user.toObject();
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
