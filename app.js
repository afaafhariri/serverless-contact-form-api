import { MongoClient } from "mongodb";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let submission;
  try {
    submission = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON payload" }),
    };
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const result = await db.collection("contacts").insertOne({
      ...submission,
      createdAt: new Date(),
    });

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.insertedId }),
    };
  } catch (err) {
    console.error("Database insertion error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save submission" }),
    };
  }
};
