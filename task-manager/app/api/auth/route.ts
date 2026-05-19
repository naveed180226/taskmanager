// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) throw new Error('MONGODB_URI env variable is missing inside .env.local');
  await mongoose.connect(MONGODB_URI);
}

// 🌟 THE FIX: Robust Schema registration with strict global instance fallback checks
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password fields are required' }, { status: 400 });
    }

    // ─── SIGNUP OPERATION ───
    if (action === 'signup') {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await User.create({ email: email.toLowerCase().trim(), password: hashedPassword });

      return NextResponse.json({ message: 'User registered successfully!' }, { status: 201 });
    }

    // ─── LOGIN OPERATION ───
    if (action === 'login') {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password credential combinations' }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password credential combinations' }, { status: 401 });
      }

      // Generate Stateless Token signature
      const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '1d' });

      return NextResponse.json({ message: 'Login successful', token, email: user.email }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid operation action query parameter requested' }, { status: 400 });
  } catch (error: any) {
    console.error("Auth Controller Root Failure:", error);
    return NextResponse.json({ error: error.message || 'Authentication sequence aborted' }, { status: 500 });
  }
}
