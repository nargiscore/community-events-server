import { MongoClient } from "mongodb";

let client;
let db;

export async function getDb() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || "community_events");
  return db;
}

export const eventsCol = async () => (await getDb()).collection("events");
export const joinsCol = async () => (await getDb()).collection("joins");
