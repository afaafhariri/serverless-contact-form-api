# Serverless Contact Form API

A simple serverless contact form backend built with Node.js, AWS Lambda, API Gateway, MongoDB, Nodemailer, and Akismet spam protection.

## Features

- **MongoDB Storage**: Saves incoming submissions into a MongoDB collection.
- **Email Notification**: Sends a confirmation email to the address provided in each submission via Nodemailer.
- **Spam Detection**: Uses Akismet to filter out spam automatically.
- **HTTP API**: Exposed via AWS API Gateway (HTTP API v2).

## Prerequisites

- **Node.js** v16.x or later
- **AWS Account** with permissions to create Lambda functions and API Gateway
- **MongoDB Atlas** (or self-hosted) URI
- **SMTP credentials** (preferef Gmail App Password)
- **Akismet API Key** and your site’s base URL

## Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/afaafhariri/serverless-contact-form-api.git
   cd serverless-contact-form-api
   ```
2. **Initialize and install dependencies**
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` (for local/dev) or set these in your Lambda configuration:

```dotenv
# Database
MONGODB_URI=your_mongodb_connection_string

# Akismet Spam Protection
AKISMET_API_KEY=your_akismet_api_key
AKISMET_BLOG_URL=https://yourdomain.com

# SMTP (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_smtp_password
```

**Note:**

- In AWS Lambda, define these under **Configuration → Environment variables**.
- Paste the app password with spaces. **Do not remove the spaces**.

## Local Testing

1. Install `dotenv` for local env:
   ```bash
   npm install --save-dev dotenv
   ```
2. Add at top of `app.js` for local runs:
   ```js
   import "dotenv/config";
   ```
3. Simulate an API Gateway event:
   ```bash
   npm install -g aws-lambda-local
   aws-lambda-local -l app.js -h handler -e events/post.json
   ```

## Deployment

1. **Bundle your function**
   ```bash
   npm prune --production
   zip -r function.zip app.js package.json node_modules
   ```
2. **Upload to AWS Lambda**
   - Go to the AWS Console → Lambda → Create function or select existing.
   - In **Code** tab, choose **Upload from .zip file**, select `function.zip`, then **Deploy**.
3. **Set environment variables** under **Configuration → Environment variables**.
4. **Attach API Gateway trigger** in the Designer (HTTP API, Open).

## Usage

### Send a Submission

```bash
curl -i -X POST https://<your-invoke-url>/ \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Alice",
    "email":"alice@example.com",
    "message":"Hello there!"
  }'
```

- **200/201** on success with `{ "id": "<mongo_id>" }`.
- **403** if Akismet flags spam.
- **405** if you hit with non-POST.

## Spam Testing

Use the built-in test trigger string to verify spam filtering:

```bash
curl -i -X POST https://<your-invoke-url>/ \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Spammer",
    "email":"spam@example.com",
    "message":"This is spam viagra-test-123"
  }'
```

Expect **403 Forbidden** with `{ "error": "Spam detected" }`.

## Troubleshooting

- **Module not found**: Ensure `mongodb`, `nodemailer`, and `akismet-api` are in `dependencies` and included in your zip.
- **Timeouts**: Increase Lambda **Timeout** to at least 10s under **General configuration**.
- **Network errors**: Whitelist Lambda’s IPs in MongoDB Atlas or configure a VPC with NAT gateway.

## License

MIT © Afaaf Hariri
