import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { User } from "../models/User";

async function activatePremiumForConfiguredAccount(): Promise<void> {
  const email = process.env.PREMIUM_ACCOUNT_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Set PREMIUM_ACCOUNT_EMAIL to the exact account email to activate.");
  await connectDatabase();
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { plan: "Premium" } },
    { new: true, runValidators: true },
  ).select("name email plan role");
  if (!user) throw new Error("No LinguaPro account found for PREMIUM_ACCOUNT_EMAIL. Sign up or sign in to create the account first.");
  console.info("Premium activated for the configured account:", { email: user.email, plan: user.plan });
}

activatePremiumForConfiguredAccount()
  .catch((error: unknown) => {
    console.error("Premium activation failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
