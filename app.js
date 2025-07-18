import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const db = await client.connect();
  cachedDb = db;
  return db;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Only POST requests are allowed" }),
    };
  }

  let contactSubmission;
  try {
    contactSubmission = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const result = await db.collection("contactSubmissions").insertOne({
      ...contactSubmission,
      createdAt: new Date(),
    });
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.insertedId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to save submission" }),
    };
  }
};
