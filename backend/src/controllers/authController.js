import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2d' }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    let { username, email, passwordHash, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    if (!passwordHash) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let cleanUsername = username && username.trim() ? username.trim() : cleanEmail.split('@')[0];

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email address already exists' });
    }

    let existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      cleanUsername = `${cleanUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: role || 'user'
    });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, email, passwordHash } = req.body;
    const rawIdentifier = (email || username || '').toString().trim();

    if (!rawIdentifier) {
      return res.status(400).json({ message: 'Email address or username is required' });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();

    // Query user case-insensitively by email or username
    let user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
        { email: new RegExp(`^${cleanIdentifier}$`, 'i') },
        { username: new RegExp(`^${cleanIdentifier}$`, 'i') }
      ]
    });

    // Auto-bootstrap demo accounts if database is fresh / not seeded yet
    if (!user) {
      if (cleanIdentifier === 'admin@fleetflow.com' || cleanIdentifier === 'admin') {
        user = await User.create({ username: 'admin', email: 'admin@fleetflow.com', passwordHash: 'admin123', role: 'admin' });
      } else if (cleanIdentifier === 'mechanic@fleetflow.com' || cleanIdentifier === 'mechanic') {
        user = await User.create({ username: 'mechanic_rajesh', email: 'mechanic@fleetflow.com', passwordHash: 'mechanic123', role: 'mechanic' });
      } else if (cleanIdentifier === 'driver@fleetflow.com' || cleanIdentifier === 'driver') {
        user = await User.create({ username: 'driver_aarav', email: 'driver@fleetflow.com', passwordHash: 'driver123', role: 'user' });
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please check your email or click Sign Up.' });
    }

    const providedPassword = (passwordHash || '').toString();
    const isMatch = await user.comparePassword(providedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login controller error:", err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};
