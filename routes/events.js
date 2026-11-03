import { Router } from "express";
import { ObjectId } from "mongodb";
import { eventsCol, joinsCol } from "../config/db.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
import { validateEvent, pickEventFields, todayString } from "../middleware/validateEvent.js";

const router = Router();
const toId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// Public: upcoming events only (date today or later), soonest first
router.get("/", async (req, res) => {
  const { limit, type, search } = req.query;
  const query = { eventDate: { $gte: todayString() } };
  if (type && type !== "All") query.eventType = String(type);
  if (search) {
    const safe = String(search).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.title = { $regex: safe, $options: "i" };
  }
  let cursor = (await eventsCol()).find(query).sort({ eventDate: 1 });
  if (Number(limit) > 0) cursor = cursor.limit(Number(limit));
  res.json(await cursor.toArray());
});

// Private: events created by the logged-in user
router.get("/mine", verifyJwt, async (req, res) => {
  const events = await (await eventsCol())
    .find({ createdBy: req.user.email })
    .sort({ eventDate: 1 })
    .toArray();
  res.json(events);
});

// Public: single event
router.get("/:id", async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid event id." });
  const event = await (await eventsCol()).findOne({ _id });
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json(event);
});

router.post("/", verifyJwt, async (req, res) => {
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ message: error });
  const doc = {
    ...pickEventFields(req.body),
    createdBy: req.user.email,
    creatorName: req.user.name,
    createdAt: new Date(),
  };
  const result = await (await eventsCol()).insertOne(doc);
  res.status(201).json({ _id: result.insertedId });
});

router.put("/:id", verifyJwt, async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid event id." });
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ message: error });
  const col = await eventsCol();
  const event = await col.findOne({ _id });
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (event.createdBy !== req.user.email)
    return res.status(403).json({ message: "You can only update your own events." });
  const fields = pickEventFields(req.body);
  await col.updateOne({ _id }, { $set: { ...fields, updatedAt: new Date() } });
  // keep joined-event snapshots in sync
  await (await joinsCol()).updateMany(
    { eventId: String(_id) },
    {
      $set: {
        eventTitle: fields.title, eventDate: fields.eventDate,
        eventLocation: fields.location, eventType: fields.eventType,
        thumbnail: fields.thumbnail,
      },
    }
  );
  res.json({ message: "Event updated." });
});

router.delete("/:id", verifyJwt, async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ message: "Invalid event id." });
  const col = await eventsCol();
  const event = await col.findOne({ _id });
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (event.createdBy !== req.user.email)
    return res.status(403).json({ message: "You can only delete your own events." });
  await col.deleteOne({ _id });
  await (await joinsCol()).deleteMany({ eventId: String(_id) });
  res.json({ message: "Event deleted." });
});

export default router;
