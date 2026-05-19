import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { db } from '../config/dbConnect';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Register 
export const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password,  phoneNumber, storeName, category } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if username already exists if provided
    if (username) {
      const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default name if not provided
    const finalName = name || username || email.split('@')[0];

    await db.insert(users).values({
      name: finalName,
      username: username || null,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      storeName: storeName || null,
      category: category || null,
    });

    res.status(201).json({ message: `User registered successfully ${username || finalName}` });
    console.log("Successfully registered user");
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username/Email and password are required' });
  }

  try {
    // Support login via either username or email
    let userResult;
    if (username.includes('@')) {
      userResult = await db.select().from(users).where(eq(users.email, username)).limit(1);
    } else {
      userResult = await db.select().from(users).where(eq(users.username, username)).limit(1);
    }

    // Fallback in case they didn't set a username but typed username as email or vice versa
    if (userResult.length === 0) {
      userResult = await db.select().from(users).where(eq(users.email, username)).limit(1);
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: `Invalid username/email or password` });
    }

    const user = userResult[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: `Invalid username/email or password` });
    }

    const jwtSecret = process.env.JWT_SECRET || 'storeverse_secret_key_2026';
    const token = jwt.sign(
      { userId: user.id},
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
    console.log("Successfully logged in user");
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Fetch User Info by ID
export const fetchUserId = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const idStr = Array.isArray(id) ? id[0] : (id || '');
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
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
  } catch (err: any) {
    console.error("Fetch user error:", err);
    res.status(500).json({ message: 'Failed to fetch user info', error: err.message });
  }
};

// Update User Info
export const UpdateUserInfo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const idStr = Array.isArray(id) ? id[0] : (id || '');
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {};
    const allowedFields = ['name', 'username', 'email', 'phoneNumber', 'storeName', 'category', 'role'];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    // Hash password if being updated
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    const updatedUserResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const { password, ...userWithoutPassword } = updatedUserResult[0];

    res.status(200).json({ 
      message: 'User updated successfully',
      user: userWithoutPassword 
    });
    console.log("Successfully updated user info");
  } catch (err: any) {
    console.error("Update user error:", err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};
