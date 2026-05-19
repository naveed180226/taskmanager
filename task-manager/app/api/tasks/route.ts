// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) throw new Error('MONGODB_URI env variable is missing inside .env.local');
  await mongoose.connect(MONGODB_URI);
}

// Unified Fallback Schema 
const TaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  status: { type: String, enum: ['in-progress', 'completed', 'pending'], default: 'pending' },
  priority: { type: String, enum: ['normal', 'medium', 'high'], default: 'normal' },
  dueDate: { type: Date },
  userId: { type: String, required: true }
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

// Helper function to check JWT token headers
function authenticateUser(request: Request): { userId: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1]; // Extract token from Bearer layout
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// ─── 1. READ ACTION (Get all tasks for logged-in user) ───
export async function GET(request: Request) {
  try {
    await connectDB();
    const session = authenticateUser(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tasks = await Task.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── 2. CREATE ACTION (Include a new task) ───
export async function POST(request: Request) {
  try {
    await connectDB();
    const session = authenticateUser(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    if (!data.title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const newTask = await Task.create({
      title: data.title,
      priority: data.priority || 'normal',
      dueDate: data.dueDate || undefined,
      userId: session.userId,
      status: 'pending'
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// ─── 3. UPDATE & DELETE SELECTION (PATCH / DELETE via body params) ───
export async function PUT(request: Request) {
  try {
    await connectDB();
    const session = authenticateUser(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, id, status } = await request.json();

    // Handle updating column status (Start Task / Complete Task)
    if (action === 'update') {
      const updatedTask = await Task.findOneAndUpdate(
        { _id: id, userId: session.userId },
        { status },
        { new: true }
      );
      if (!updatedTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json(updatedTask);
    }

    // Handle deleting a task
    if (action === 'delete') {
      const deletedTask = await Task.findOneAndDelete({ _id: id, userId: session.userId });
      if (!deletedTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ message: 'Deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
