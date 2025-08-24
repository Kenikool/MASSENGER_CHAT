// lib/emailService.js

import nodemailer from "nodemailer";

// A simple template string for the HTML content.
const simpleHtmlTemplate = (username, animationUrl, verificationLink) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #007BFF;
            }
            .content {
                text-align: center;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                background-color: #007BFF;
                color: #fff !important;
                text-decoration: none;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
                color: #888;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome, ${username}!</h1>
            </div>
            <div class="content">
                <p>Thank you for signing up. Please click the button below to verify your email address.</p>
                <img src="${animationUrl}" alt="3D Animation" style="max-width: 100%; height: auto; display: block; margin: 20px auto;">
                <a href="${verificationLink}" class="button">Verify My Account</a>
            </div>
            <div class="footer">
                <p>&copy; 2024 Your App Name. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
`;

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export const sendVerificationEmail = async (
  userEmail,
  username,
  verificationToken
) => {
  try {
    const animationGifUrl = "https://example.com/your-animated-gif.gif";
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: "noreply@chatty.com",
      to: userEmail,
      subject: "Verify Your Chatty Account",
      html: simpleHtmlTemplate(username, animationGifUrl, verificationLink),
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export const sendChangeEmailVerification = async (
  userEmail,
  username,
  token
) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email-change?token=${token}`;
    // You can create a separate HTML template for this email or reuse the existing one with a modified message.
    const mailOptions = {
      from: "noreply@chatty.com",
      to: userEmail,
      subject: "Confirm Your New Email Address for Chatty",
      html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Confirm Email Change</title>
                </head>
                <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #333;">Hello ${username},</h2>
                        <p>We received a request to change your email address for your Chatty account. To confirm this change, please click the button below:</p>
                        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">
                            Confirm Email Change
                        </a>
                        <p>If you did not request this change, please ignore this email.</p>
                        <p style="font-size: 12px; color: #888;">This link will expire in 1 hour.</p>
                    </div>
                </body>
                </html>
            `,
    };
    await transporter.sendMail(mailOptions);
    console.log("Change email verification email sent successfully!");
  } catch (error) {
    console.error("Error sending change email verification email:", error);
  }
};
