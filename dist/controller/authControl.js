"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeRegistration = exports.resendVerificationCode = exports.verifyEmail = exports.UpdateUserInfo = exports.fetchUserId = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const dbConnect_1 = require("../config/dbConnect");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const mailer_1 = require("../utils/mailer");
// Register (Initiate email verification)
const register = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        // Check if user already exists
        const existingUser = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (existingUser.length > 0) {
            const user = existingUser[0];
            // If the email is verified AND password is set, the user is fully registered
            if (user.emailVerified && user.password) {
                return res.status(400).json({ message: 'User with this email is already registered' });
            }
            // If email is not verified, or verified but not fully registered (missing password)
            // We regenerate the verification token and expiry and send a new link
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await dbConnect_1.db.update(schema_1.users)
                .set({
                emailVerifyCode: token,
                emailVerifyExpiry: expiry,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
            const protocol = req.protocol;
            const host = req.get('host');
            const verificationLink = `${protocol}://${host}/api/auth/verify-email?token=${token}`;
            (0, mailer_1.sendVerificationEmail)(email, user.name || email.split('@')[0], verificationLink).catch(err => {
                console.error("Failed to send verification email:", err);
            });
            return res.status(200).json({
                message: `A verification link has been sent to your email: ${email}. Please check your inbox.`,
                email,
                emailVerified: user.emailVerified
            });
        }
        // Create a new user with email and token, leaving other details nullable/empty
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const defaultName = email.split('@')[0];
        await dbConnect_1.db.insert(schema_1.users).values({
            name: defaultName,
            email,
            emailVerified: false,
            emailVerifyCode: token,
            emailVerifyExpiry: expiry,
        });
        const protocol = req.protocol;
        const host = req.get('host');
        const verificationLink = `${protocol}://${host}/api/auth/verify-email?token=${token}`;
        // Send verification email asynchronously
        (0, mailer_1.sendVerificationEmail)(email, defaultName, verificationLink).catch(err => {
            console.error("Failed to send verification email:", err);
        });
        res.status(201).json({
            message: `Verification link has been successfully sent to ${email}.`,
            email,
            emailVerified: false
        });
        console.log("Successfully initiated verification registration");
    }
    catch (err) {
        console.error("Registration initiation error:", err);
        res.status(500).json({ message: 'Registration failed to initiate', error: err.message });
    }
};
exports.register = register;
// Login controller
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username/Email and password are required' });
    }
    try {
        // Support login via either username or email
        let userResult;
        if (username.includes('@')) {
            userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, username)).limit(1);
        }
        else {
            userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
        }
        // Fallback in case they didn't set a username but typed username as email or vice versa
        if (userResult.length === 0) {
            userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, username)).limit(1);
        }
        if (userResult.length === 0) {
            return res.status(404).json({ message: `Invalid username/email or password` });
        }
        const user = userResult[0];
        if (!user.password) {
            return res.status(400).json({ message: 'Please complete your registration before logging in' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ message: `Invalid username/email or password` });
        }
        const jwtSecret = process.env.JWT_SECRET || 'storeverse_secret_key_2026';
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });
        console.log("Successfully logged in user");
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};
exports.login = login;
// Fetch User Info by ID
const fetchUserId = async (req, res) => {
    const { id } = req.params;
    try {
        const idStr = Array.isArray(id) ? id[0] : (id || '');
        const userId = parseInt(idStr, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Exclude password from the returned object
        const { password, ...userWithoutPassword } = userResult[0];
        res.status(200).json({
            message: 'User info fetched successfully',
            user: userWithoutPassword
        });
        console.log(`Fetched info for user ID: ${id}`);
    }
    catch (err) {
        console.error("Fetch user error:", err);
        res.status(500).json({ message: 'Failed to fetch user info', error: err.message });
    }
};
exports.fetchUserId = fetchUserId;
// Update User Info
const UpdateUserInfo = async (req, res) => {
    const { id } = req.params;
    try {
        const idStr = Array.isArray(id) ? id[0] : (id || '');
        const userId = parseInt(idStr, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updateData = {};
        const allowedFields = ['name', 'username', 'email', 'phoneNumber', 'storeName', 'category'];
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }
        // Hash password if being updated
        if (req.body.password) {
            updateData.password = await bcrypt_1.default.hash(req.body.password, 10);
        }
        updateData.updatedAt = new Date();
        if (Object.keys(updateData).length > 0) {
            await dbConnect_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
        const updatedUserResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        const { password, ...userWithoutPassword } = updatedUserResult[0];
        res.status(200).json({
            message: 'User updated successfully',
            user: userWithoutPassword
        });
        console.log("Successfully updated user info");
    }
    catch (err) {
        console.error("Update user error:", err);
        res.status(500).json({ message: 'Failed to update user', error: err.message });
    }
};
exports.UpdateUserInfo = UpdateUserInfo;
// Helper to render glassmorphic status page for link verification clicks
const renderStatusPage = (success, message, email, token) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${success ? 'Email Verified' : 'Verification Failed'} - Storeverse</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', sans-serif;
          background: radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 100%);
          color: #f8fafc;
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }
        .glass-card {
          background: rgba(30, 41, 59, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          transform: translateY(0);
          transition: transform 0.3s ease;
        }
        .icon-wrapper {
          width: 80px;
          height: 80px;
          margin: 0 auto 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
          border: 2px solid ${success ? '#10b981' : '#ef4444'};
          box-shadow: 0 8px 24px ${success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
        }
        .icon {
          font-size: 36px;
          color: ${success ? '#10b981' : '#ef4444'};
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          background: ${success ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          font-size: 16px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(79, 70, 229, 0.45);
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="glass-card">
        <div class="icon-wrapper">
          <span class="icon">${success ? '✓' : '✗'}</span>
        </div>
        <h1>${success ? 'Verification Successful' : 'Verification Failed'}</h1>
        <p>${message}</p>
        ${success ? `<a href="/email-test.html?email=${encodeURIComponent(email || '')}&token=${encodeURIComponent(token || '')}" class="btn">Proceed to Registration</a>` : `<a href="/email-test.html" class="btn">Back to Start</a>`}
        <div class="footer">
          &copy; ${new Date().getFullYear()} Storeverse. Powered by premium e-commerce tech.
        </div>
      </div>
    </body>
    </html>
  `;
};
// Verify email link
const verifyEmail = async (req, res) => {
    // Support both GET (from verification link click) and POST (API call)
    const token = req.query.token || req.body.token || req.body.code;
    if (!token) {
        if (req.method === 'GET') {
            return res.status(400).send(renderStatusPage(false, 'Verification token is missing.'));
        }
        return res.status(400).json({ message: 'Verification token is required' });
    }
    try {
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.emailVerifyCode, token)).limit(1);
        if (userResult.length === 0) {
            if (req.method === 'GET') {
                return res.status(404).send(renderStatusPage(false, 'Invalid or expired verification link.'));
            }
            return res.status(404).json({ message: 'Invalid or expired verification token' });
        }
        const user = userResult[0];
        if (user.emailVerifyExpiry && new Date() > user.emailVerifyExpiry) {
            if (req.method === 'GET') {
                return res.status(400).send(renderStatusPage(false, 'Verification link has expired. Please request a new one.'));
            }
            return res.status(400).json({ message: 'Verification token has expired. Please request a new one.' });
        }
        // Mark as verified but keep token so they can submit profile details in the next step
        await dbConnect_1.db.update(schema_1.users)
            .set({
            emailVerified: true,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        if (req.method === 'GET') {
            return res.send(renderStatusPage(true, 'Your email has been successfully verified! You can now complete your profile registration.', user.email, token));
        }
        res.status(200).json({
            message: 'Email verified successfully. Proceed to complete registration.',
            email: user.email,
            token
        });
        console.log(`Successfully verified email for user ID: ${user.id}`);
    }
    catch (err) {
        console.error("Email verification error:", err);
        if (req.method === 'GET') {
            return res.status(500).send(renderStatusPage(false, 'An error occurred during verification.'));
        }
        res.status(500).json({ message: 'Email verification failed', error: err.message });
    }
};
exports.verifyEmail = verifyEmail;
// Resend verification link
const resendVerificationCode = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult[0];
        if (user.emailVerified && user.password) {
            return res.status(400).json({ message: 'Email is already verified and registered' });
        }
        // Generate new token and expiry
        const newToken = crypto_1.default.randomBytes(32).toString('hex');
        const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await dbConnect_1.db.update(schema_1.users)
            .set({
            emailVerifyCode: newToken,
            emailVerifyExpiry: newExpiry,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        // Send email asynchronously
        const protocol = req.protocol;
        const host = req.get('host');
        const verificationLink = `${protocol}://${host}/api/auth/verify-email?token=${newToken}`;
        (0, mailer_1.sendVerificationEmail)(email, user.name || email.split('@')[0], verificationLink).catch(err => {
            console.error("Failed to resend verification email:", err);
        });
        res.status(200).json({ message: `A new verification link has been sent to ${email}.` });
        console.log(`Successfully resent verification link to user ID: ${user.id}`);
    }
    catch (err) {
        console.error("Resend verification link error:", err);
        res.status(500).json({ message: 'Failed to resend verification link', error: err.message });
    }
};
exports.resendVerificationCode = resendVerificationCode;
// Complete registration (Finalize profile after verification)
const completeRegistration = async (req, res) => {
    try {
        const { email, token, name, username, password, phoneNumber, storeName, category } = req.body;
        if (!email || !token || !name || !password) {
            return res.status(400).json({ message: 'Email, verification token, name, and password are required' });
        }
        // Check user with this email
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult[0];
        if (!user.emailVerified) {
            return res.status(400).json({ message: 'Email must be verified before completing registration' });
        }
        if (!user.emailVerifyCode || user.emailVerifyCode !== token) {
            return res.status(400).json({ message: 'Invalid or mismatching verification token' });
        }
        // Check if username is already taken if provided
        if (username) {
            const existingUsername = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
            if (existingUsername.length > 0 && existingUsername[0].id !== user.id) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Update the profile fields and nullify the token
        await dbConnect_1.db.update(schema_1.users)
            .set({
            name,
            username: username || null,
            password: hashedPassword,
            phoneNumber: phoneNumber || null,
            storeName: storeName || null,
            category: category || null,
            emailVerifyCode: null, // Done with token
            emailVerifyExpiry: null,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        // Sign a JWT token so they are logged in immediately
        const jwtSecret = process.env.JWT_SECRET || 'storeverse_secret_key_2026';
        const jwtToken = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Registration completed successfully.',
            token: jwtToken,
            user: {
                id: user.id,
                name,
                username: username || null,
                email: user.email,
                emailVerified: true
            }
        });
        console.log(`Successfully completed registration for user ID: ${user.id}`);
    }
    catch (err) {
        console.error("Complete registration error:", err);
        res.status(500).json({ message: 'Registration completion failed', error: err.message });
    }
};
exports.completeRegistration = completeRegistration;
