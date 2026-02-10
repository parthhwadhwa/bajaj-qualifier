# BFHL REST API

Bajaj Finserv Health Challenge — Qualifier 1 API

## Endpoints

| Method | Path | Description |
|--------|---------|--------------------------------------|
| GET | `/health` | Health check |
| POST | `/bfhl` | Process fibonacci / prime / lcm / hcf / AI |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key in .env
echo "GEMINI_API_KEY=your-key-here" > .env

# 3. Start the server
npm start
```

## POST /bfhl — Request Examples

```json
{ "fibonacci": 7 }
{ "prime": [2, 4, 7, 9, 11] }
{ "lcm": [12, 18, 24] }
{ "hcf": [24, 36, 60] }
{ "AI": "What is the capital city of Maharashtra?" }
```

## Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Railway / Render
Push to a public GitHub repo and import into Railway or Render. Set `GEMINI_API_KEY` as an environment variable.

## Tech Stack
- Node.js + Express
- Google Gemini AI (for the AI key)
- Helmet, CORS, express-rate-limit (security)
