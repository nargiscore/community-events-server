import { Router } from "express";
import { ObjectId } from "mongodb";
import { eventsCol, joinsCol } from "../config/db.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
import { todayString } from "../middleware/validateEvent.js";

const router = Router();

// Private: events the user has joined, sorted by event date
router.get("/", verifyJwt, async (req, res) => {
  const joins = await (await joinsCol())
    .find({ userEmail: req.user.email })
    .sort({ eventDate: 1 })
    .toArray();
  res.json(joins);
});

// Private: join an event (stores event + user data)
router.post("/", verifyJwt, async (req, res) => {
  const { eventId } = req.body || {};
  if (!ObjectId.isValid(eventId))
    return res.status(400).json({ message: "Invalid event id." });
  const event = await (await eventsCol()).findOne({ _id: new ObjectId(eventId) });
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (event.eventDate < todayString())
    return res.status(400).json({ message: "This event has already taken place." });

  const col = await joinsCol();
  const already = await col.findOne({ eventId, userEmail: req.user.email });
  if (already) return res.status(409).json({ message: "You have already joined this event." });

  await col.insertOne({
    eventId,
    eventTitle: event.title,
    eventDate: event.eventDate,
    eventLocation: event.location,
    eventType: event.eventType,
    thumbnail: event.thumbnail,
    userEmail: req.user.email,
    userName: req.user.name,
    joinedAt: new Date(),
  });
  res.status(201).json({ message: "You joined this event." });
});

export default router;
