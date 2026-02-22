# Sydney Events Platform — Project Report

## Project Overview

The Sydney Events Platform is a full-stack web application that automatically scrapes real-time event data from TimeOut Sydney, displays it in a clean and filterable interface, and allows administrators to manage events through a dashboard. The platform features Google OAuth authentication for secure access and supports lead capture for event ticket inquiries.

**Live URLs:**
- Frontend: https://lw-event-platfrom.netlify.app
- Backend API: https://event-platform-ilw2.onrender.com

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js (Create React App) | Single-page application UI |
| Styling | Tailwind CSS | Utility-first CSS framework for responsive design |
| Backend | Node.js + Express.js | REST API server |
| Database | PostgreSQL (hosted on Render) | Persistent data storage |
| ORM | Prisma | Type-safe database queries and migrations |
| Authentication | Passport.js + Google OAuth 2.0 | Secure user login via Google accounts |
| Web Scraping | Axios + Cheerio | Automated event data collection from TimeOut Sydney |
| Cron Automation | GitHub Actions | Scheduled scraper runs (daily) |
| Frontend Hosting | Netlify | Static site deployment with CI/CD |
| Backend Hosting | Render | Node.js web service deployment |

---

## Architecture & How It Works

### 1. Web Scraper (scraper.js)

The scraper uses Axios to fetch the HTML content of the TimeOut Sydney events page and Cheerio to parse the DOM and extract event details such as title, URL, and source. Extracted events are stored in the PostgreSQL database using Prisma's `upsert` operation, which creates new records or updates existing ones to avoid duplicates. The scraper runs automatically once a day via a GitHub Actions workflow (`/.github/workflows/scraper.yml`), ensuring the event data stays fresh without any manual intervention.

### 2. Backend API (server.js)

The Express.js server provides the following REST API endpoints:

- **GET /events** — Returns all events from the database, sorted by date.
- **GET /auth/google** — Initiates Google OAuth 2.0 login flow.
- **GET /auth/google/callback** — Handles the OAuth callback and creates a user session.
- **GET /auth/check** — Returns the authenticated user's profile (name, email, photo) or a 401 error.
- **GET /auth/logout** — Destroys the user session, clears cookies, and logs the user out.
- **POST /lead** — Captures a lead (email + consent) when a user clicks "Get Tickets" on an event.
- **POST /import/:id** — Allows admins to mark an event as "imported" via the dashboard.

Authentication is handled using Passport.js with the Google OAuth 2.0 strategy. Sessions are managed with `express-session`, configured with secure cookies and `SameSite=None` for cross-origin deployment. The server uses `trust proxy` in production for correct HTTPS handling behind Render's reverse proxy.

### 3. Database (Prisma + PostgreSQL)

The database consists of two models defined in `prisma/schema.prisma`:

- **Event** — Stores scraped event data including title, datetime, venue, source URL, city, status (new/updated/imported), and a timestamp for the last scrape.
- **Lead** — Stores user-submitted emails and consent flags linked to specific events.

Prisma handles all database operations with type-safe queries, and migrations are managed through Prisma's migration system. The `prisma generate` command runs automatically during Render's build step.

### 4. Frontend (React + Tailwind CSS)

The React frontend provides two main views:

- **Events View** — Displays all events in a responsive card grid with status badges (new, updated, imported, inactive). Users can search by title, filter by city, and filter by date range. Clicking "Get Tickets" opens a modal for lead capture before redirecting to the event's original URL.
- **Dashboard View** — An admin table view (requires authentication) showing all events with an "Import" action button to change event status.

**Authentication flow on the frontend:**
- On page load, the app calls `/auth/check` to determine if the user is already logged in.
- If not logged in, a "Login with Google" button is displayed in the header.
- If logged in, the login button is replaced with a profile dropdown showing the user's avatar, name, and email, along with a "Sign out" button.
- Logging out calls `/auth/logout`, clears the local user state, and restores the login button.

All API calls use the `REACT_APP_API_URL` environment variable, making the app portable across environments (local development vs. production).

### 5. Deployment Architecture

- **Render (Backend)** — The Express server runs as a Web Service on Render with `npm start`. Environment variables (DATABASE_URL, Google OAuth credentials, FRONTEND_URL, BACKEND_URL, SESSION_SECRET) are configured in Render's dashboard. The build command runs `npm install && npm run build` (which triggers `prisma generate`).
- **Netlify (Frontend)** — The React app is built and deployed as a static site. A `_redirects` file and `netlify.toml` handle SPA routing so that all routes serve `index.html`. The `REACT_APP_API_URL` environment variable points to the Render backend.
- **GitHub Actions (Scraper Cron)** — A workflow file at `.github/workflows/scraper.yml` runs the scraper daily at midnight UTC using a cron schedule. It can also be triggered manually via GitHub's "Run workflow" button. The `DATABASE_URL` is stored as a GitHub repository secret.

---

## Key Features Summary

1. **Automated Event Scraping** — Daily scraping from TimeOut Sydney with deduplication via upsert
2. **Google OAuth Authentication** — Secure login with session management and cross-origin cookie support
3. **User Profile Section** — Displays logged-in user's name, email, and Google avatar with logout functionality
4. **Event Filtering** — Search by title, filter by city, and date range filtering
5. **Lead Capture** — Email collection with consent tracking before ticket redirection
6. **Admin Dashboard** — Protected event management with import capability
7. **Fully Deployed** — Production-ready with Render (backend), Netlify (frontend), and GitHub Actions (cron)
