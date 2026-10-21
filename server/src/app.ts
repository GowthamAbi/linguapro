import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import profileRoutes from "./routes/profileRoutes";
import progressRoutes from "./routes/progressRoutes";
import speakingRoutes from "./routes/speakingRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import courseRoutes from "./routes/courseRoutes";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("This origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait and try again." },
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "LinguaPro API" });
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/speaking", speakingRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/courses", courseRoutes);
app.use((_request, response) => response.status(404).json({ message: "API route not found." }));

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  response.status(500).json({ message: "An unexpected server error occurred." });
};
app.use(errorHandler);

export default app;