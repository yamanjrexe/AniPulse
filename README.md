<div align="center">
  <img src="frontend/public/icon/Anipulse.png" alt="AniPulse logo" width="160" />

  <p><strong>Track. Analyze. Understand your anime journey.</strong></p>

  <p>
    <a href="https://ani-pulse.netlify.app/"><img src="https://img.shields.io/badge/Live_Demo-Visit_AniPulse-FCE706?style=for-the-badge&labelColor=050505" alt="Live demo" /></a>
    <img src="https://img.shields.io/badge/Version-v3.2.3-FCE706?style=for-the-badge&labelColor=050505" alt="Version 3.2.3" />
    <a href="https://opensource.org/license/mit"><img src="https://img.shields.io/badge/License-MIT-F90415?style=for-the-badge&labelColor=050505" alt="MIT License" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
    <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Firebase-Admin_+_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=white" alt="Firebase" />
  </p>
</div>

---

## About

AniPulse is an anime tracking and analytics platform for collecting your watch history, discovering what's trending, and seeing how your anime habits evolve. The app has been rebuilt from its legacy vanilla JavaScript foundation into a modern full-stack application powered by **React 18** and **Node.js/Express**, with Firebase Authentication and Cloud Firestore supporting accounts and cloud data.

Use AniPulse to manage your list, explore personalized statistics, share with the community, and keep your library synchronized with AniList.

## Features

### 📚 Tracking & Discovery

- Organize anime by status, track episode progress, and add ratings, notes, genres, and dates.
- Search anime metadata and discover trending titles through **AniList GraphQL**.
- Browse the **Global Spotlight**, a cinematic auto-playing showcase of trending anime.
- Connect an AniList account and sync your library in both directions. A background worker processes AniList sync updates.
- View posters enhanced with artwork from **TMDB**.

### 📊 Analytics & Gamification

- Explore watch-time, episode, rating, genre, status, and completion analytics with interactive charts.
- Revisit your anime journey with swipeable, story-style monthly and yearly recaps.
- Earn experience, levels, streaks, and achievements as you track your progress.
- Review recent activity and see how your viewing habits change over time.

### 💬 Community & Social

- Join real-time, discussion-board conversations with other anime fans.
- Share images in discussions and optionally attach your level and viewing statistics to a post.
- Connect with friends, explore community profiles, and compare leaderboard rankings.
- Browse trending titles together in Spotlight.

### 🔐 Security & Privacy

- Keep your anime data local-first, with account-based cloud sync available when signed in.
- Protect supported Firebase requests with **Firebase App Check** using reCAPTCHA Enterprise.
- Require authenticated requests for account and community actions.
- Route application writes through the Express API; Firestore Security Rules deny direct client writes to protected data.
- Apply API rate limits and server-side validation to sensitive operations.

## Tech Stack

| Area | Technologies |
| --- | --- |
| **Frontend** | React 18, React Router v6, Context API, Chart.js, Progressive Web App (PWA) |
| **Backend** | Node.js, Express.js, Firebase Admin SDK |
| **Database & identity** | Google Cloud Firestore, Firebase Authentication, Firebase App Check |
| **External APIs and services** | AniList GraphQL for anime metadata and library sync; TMDB for posters; ImgBB for discussion images |

## Getting Started

### Prerequisites

- **Node.js 18 or later** and npm.
- A Firebase project with **Authentication** and **Cloud Firestore** enabled.
- A Firebase Admin service account for the backend.
- Optional service credentials for AniList OAuth, TMDB posters, ImgBB image uploads, and reCAPTCHA Enterprise App Check.

### 1. Clone the repository

```bash
git clone https://github.com/yamanjrexe/AniPulse.git
cd AniPulse
```

### 2. Configure and run the backend

```bash
cd backend
npm install
```

Create `backend/.env` and set the Firebase project and Admin SDK credentials. The example below also shows optional integrations; keep secrets in the backend environment and never commit this file.

```dotenv
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Firebase client configuration returned to the frontend
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_web_app_id

# Firebase Admin service account (backend only)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nreplace_with_your_private_key\n-----END PRIVATE KEY-----\n"
# Optional service-account metadata
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account

# Optional integrations
TMDB_API_KEY=your_tmdb_api_key
IMGBB_API_KEY=your_imgbb_api_key
ANILIST_CLIENT_ID_DEV=your_anilist_client_id
ANILIST_CLIENT_SECRET_DEV=your_anilist_client_secret
ANILIST_REDIRECT_URI_DEV=http://localhost:3000
```

The Firebase Admin service account must have access to the project’s Firestore database. Store its private key securely. Add production AniList OAuth credentials (`ANILIST_CLIENT_ID_PROD`, `ANILIST_CLIENT_SECRET_PROD`, and, if needed, `ANILIST_REDIRECT_URI_PROD`) in the deployment environment when configuring production OAuth.

Start the API:

```bash
npm run dev
```

The backend listens at `http://localhost:5000` with the configuration above. Its health endpoint is `http://localhost:5000/api/health`.

### 3. Configure and run the frontend

In another terminal, from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env` with your Firebase web app settings and App Check site key:

```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_web_app_id
REACT_APP_RECAPTCHA_ENTERPRISE_KEY=your_recaptcha_enterprise_site_key
```

Frontend environment values are embedded in the browser build; use only Firebase web configuration and public site keys here. **Never put Firebase Admin credentials or third-party secret API keys in the frontend environment.**

Start the React development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). Configure Firebase Authentication providers, authorized domains, and App Check in the Firebase console for your own project. For local development, configure App Check to accept your local site, or omit the frontend App Check key while testing features that do not require App Check enforcement.

### Useful scripts

| Directory | Command | Description |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with Nodemon |
| `backend/` | `npm start` | Start the API with Node.js |
| `frontend/` | `npm start` | Run the React development server |
| `frontend/` | `npm test` | Run frontend tests |
| `frontend/` | `npm run build` | Create a production frontend build |

## Project Structure

```text
AniPulse/
├── backend/
│   ├── config/          # Firebase client configuration
│   ├── middleware/      # Authentication, admin, and error middleware
│   ├── routes/          # Express API routes (anime, sync, users, discussions, etc.)
│   ├── scripts/         # Database migration, seeding, and admin utilities
│   ├── services/        # Firebase Admin and AniList services
│   ├── utils/           # Shared validators, helpers, and level logic
│   ├── package.json
│   └── server.js        # Express application entry point
├── frontend/
│   ├── public/
│   │   └── icon/        # App icons and install assets
│   ├── src/
│   │   ├── components/  # Shared UI, charts, recaps, and layout
│   │   ├── context/     # Authentication, anime, sync, theme, and app state
│   │   ├── hooks/       # Reusable React hooks
│   │   ├── layouts/     # Public, authenticated, and app layouts
│   │   ├── pages/       # Dashboard, community, statistics, settings, and more
│   │   ├── routes/      # Route configuration and protected routes
│   │   ├── services/    # API, Firebase, AniList, sync, and PWA clients
│   │   ├── styles/      # Global and component styles
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── package.json
└── README.md
```

## Security Architecture

The frontend authenticates users with Firebase Authentication and communicates with the **Express backend** for protected operations. The backend verifies requests, validates changes, and uses the Firebase Admin SDK to access Firestore. This server-side boundary helps protect secrets and centralize authorization, rate limiting, and validation.

Firestore Security Rules provide a second boundary: protected user, anime, activity, and discussion documents are readable only under their defined authentication conditions, and direct client writes are denied. Sensitive AniList tokens and sync data are also inaccessible to client SDKs. **Do not expose Firebase Admin credentials in the frontend or grant broad Firestore client write permissions.**

Firebase App Check with reCAPTCHA Enterprise helps reject unauthenticated or untrusted app traffic where enforcement is enabled. Configure the correct Firebase rules, Authentication providers, and App Check enforcement for your own deployment before making it public.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a focused branch: `git checkout -b feature/your-change`.
3. Make and test your changes.
4. Commit with a clear message: `git commit -m "Describe your change"`.
5. Push your branch and open a pull request describing the change.

Please avoid including credentials, private keys, or personal data in commits, issues, and pull requests.

## License

AniPulse is distributed under the **MIT License**.

---

<div align="center">
  <strong>Made for anime fans. Happy tracking! 🎬</strong>
  <br />
  <a href="https://ani-pulse.netlify.app/">Visit the AniPulse live demo</a>
</div>
