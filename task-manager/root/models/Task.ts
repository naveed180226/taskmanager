// models/Task.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  status: 'in-progress' | 'completed';
  priority: 'normal' | 'medium' | 'high'; // 👈 Updated priority options
  dueDate?: Date; // 👈 Expiry Date Support
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  priority: { type: String, enum: ['normal', 'medium', 'high'], default: 'normal' }, // 👈 updated defaults
  dueDate: { type: Date }, // 👈 Added column to save in DB
}, { timestamps: true });

// models/task.ts

// ✅ NEW FALLBACK CACHE EXPORT PREVENTS INTERNAL SERVER BREAKS:
export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

