# LinguaPro API

Readable MVC-style backend built with Node.js, Express, TypeScript, and MongoDB.

## Requirements

- Node.js 20+
- MongoDB local instance or MongoDB Atlas
- A strong JWT secret with at least 32 characters

## Run locally

```bash
cd server
npm install
cp .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET
npm run dev
```

Health check: `GET http://localhost:4000/api/health`

## MVC structure

- `src/models/` — MongoDB/Mongoose data models
- `src/controllers/` — validation and business logic
- `src/routes/` — API route declarations
- `src/middleware/` — authentication and request middleware
- `src/config/` — database connection
- `src/app.ts` — Express middleware and route registration
- `src/server.ts` — application bootstrap

## API endpoints

- `POST /api/auth/register` — register an account
- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — clear session cookie
- `GET /api/auth/me` — current signed-in user
- `GET /api/profile` — read profile
- `PATCH /api/profile` — update profile preferences
- `GET /api/progress` — read progress and history
- `POST /api/progress/complete` — complete a daily task
- `POST /api/speaking/feedback` — authenticated AI feedback for a speech-recognition transcript\n- `GET /api/admin/overview` — owner-only account and learning summary\n- `GET /api/admin/users` — owner-only list of all registered accounts\n- `GET /api/admin/users?type=students` — owner-only list of accounts with recorded learning XP\n- `GET /api/admin/activity` — owner-only recent learning activity\n\nFor owner access, set `OWNER_EMAIL` on Render to the owner account email. Set `VITE_OWNER_EMAIL` in Netlify to the same email so the owner navigation is displayed. The API independently checks `OWNER_EMAIL`; the frontend variable is not a security control.

## AI speaking feedback setup

Set `AI_PROVIDER_API_KEY` in the Render backend environment. The default provider is OpenAI-compatible at `https://api.openai.com/v1`; optionally set `AI_PROVIDER_BASE_URL` and `AI_MODEL` (`gpt-4o-mini` by default). Never put this key in Netlify or client-side code. Signed-in learners send the recognized text transcript and target phrase to the backend for feedback; raw audio is not uploaded or stored by this feature. If AI is unavailable or not configured, the speaking page falls back to local transcript-based feedback.

Passwords are hashed with bcrypt. JWT sessions use an HTTP-only cookie. Keep `.env` out of Git.

## Production checklist

Before public production use, add automated tests, email verification, password reset, session revocation/rotation, CSRF protection appropriate to the hosting domains, structured logging, monitoring, and rate-limit tuning. Set `CLIENT_ORIGIN` to the exact frontend origin and `COOKIE_SECURE=true` when using HTTPS.

The frontend can be hosted as static files, but this API needs a Node-compatible host. Set `VITE_API_URL` at frontend build time to the deployed API URL.