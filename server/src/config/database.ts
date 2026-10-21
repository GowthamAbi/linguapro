import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error("MONGODB_URI is missing. Add it to the server environment.");
  }

  await mongoose.connect(connectionString);
  console.info("MongoDB connected.");
}