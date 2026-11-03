import "dotenv/config";
import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";
import joinsRouter from "./routes/joins.js";

const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// CLIENT_URL may hold one or more comma-separated URLs; clean stray spaces, labels and slashes.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(/[\s,]+/)
  .map((s) => s.replace(/\/+$/, ""))
  .filter((s) => s.startsWith("http"));

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "ok", service: "Community Events API" }));
app.use("/events", eventsRouter);
app.use("/joins", joinsRouter);

app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 5000;
if (!process.env.VERCEL) app.listen(port, () => console.log(`API running on :${port}`));

export default app;
