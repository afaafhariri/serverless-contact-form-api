import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import AkismetClient from "akismet-api";

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

let cachedTransporter = null;
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const secure = port === 465;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

async function isSpam(submission) {
  const akismet = new AkismetClient({
    key: process.env.AKISMET_API_KEY,
    blog: process.env.AKISMET_BLOG_URL,
  });
  try {
    return await client.checkComment({
      user_ip: submission.ip || "",
      user_agent: submission.userAgent || "",
      referrer: submission.referrer || "",
      comment_author: submission.name || "",
      comment_author_email: submission.email || "",
      comment_content: submission.message || "",
    });
  } catch (err) {
    console.error("Akismet check failed:", err);
    return false;
  }
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

  let insertedId;
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const result = await db.collection("contacts").insertOne({
      ...submission,
      createdAt: new Date(),
    });
    insertedId = result.insertedId;
    if (!insertedId) {
      throw new Error("Failed to insert submission into database");
    }
  } catch (err) {
    console.error("Database insertion error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save submission" }),
    };
  }
  if (!submission.email) {
    console.error("Submission missing email field");
  } else {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: submission.email,
        subject: "Thank you for your submission",
        text: `Hello ${
          submission.name || ""
        },\n\nThank you for reaching out. We received your message:\n\n${
          submission.message
        }`,
      });
    } catch (err) {
      console.error("Email notification error:", err);
    }
  }
  return {
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: insertedId }),
  };
};
