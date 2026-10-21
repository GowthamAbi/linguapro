# LinguaPro

LinguaPro is a language-learning web application with a React + TypeScript frontend and a Node.js + Express + MongoDB backend organized in MVC style.

## Project layout

```text
linguapro/
├── client/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Page views and UI interactions
│   │   ├── api.ts              # Typed API request helper
│   │   ├── main.tsx            # React entry point
│   │   ├── styles.css          # Responsive purple UI
│   │   └── types.ts            # Shared frontend types
│   └── package.json
├── server/                    # Node + Express + TypeScript backend
│   └── src/
│       ├── config/             # MongoDB connection
│       ├── controllers/        # MVC controller/business logic
│       ├── middleware/         # Authentication middleware
│       ├── models/             # Mongoose models
│       ├── routes/             # REST API routes
│       ├── utils/               # Async controller helper
│       ├── app.ts               # Express setup
│       └── server.ts            # API entry point
└── .github/workflows/           # GitHub Pages deployment
```

## Frontend pages

- Dashboard with daily plan, XP, and goal progress
- My learning with Basic, Intermediate, and Advanced course cards
- Speaking practice with phrase playback and browser microphone recognition
- Vocabulary builder with example sentences and speech playback
- Progress summary and daily task history
- Profile and language settings
- Free and Premium plan information
- Email registration/sign-in UI

Some progress and preferences currently use browser local storage. The account UI connects to the API only after `VITE_API_URL` is configured. Course content and Premium payment are prototype features; payment processing and AI tutoring are not enabled yet.

## Run the frontend locally

```bash
cd client
npm install
npm run dev
```

## Run the backend locally

```bash
cd server
npm install
cp .env.example .env
# Set MONGODB_URI and a strong JWT_SECRET in .env
npm run dev
```

The API health endpoint is `GET /api/health` on the configured backend port (default 4000). More setup notes and endpoints are in [server/README.md](server/README.md).

## Deployment notes

GitHub Pages builds and publishes `client/` using the workflow in `.github/workflows/deploy-pages.yml`. GitHub Pages hosts only the frontend; deploy the Express API to a Node-compatible host and MongoDB to MongoDB Atlas or another MongoDB server separately. Then configure `VITE_API_URL` as a frontend build environment variable.

For production, complete email verification, password reset, session revocation, CSRF review, automated tests, monitoring, and secure production cookie/CORS settings before accepting real users.

## Secrets

Do not commit API keys, database credentials, JWT secrets, or real `.env` files. Put third-party AI keys on the backend host only.