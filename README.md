# VentrixCarros

VentrixCarros is a company recruitment platform. The frontend is plain HTML, CSS, and JavaScript. The API uses Node.js, Express, Sequelize, and MySQL. Optional integrations include Resend for verification email, Razorpay for subscriptions, and OpenAI for recruiting assistance.

## Requirements

- Node.js 20 or later and npm
- MySQL 8 or compatible MySQL server
- Visual Studio Code and Live Server (for local frontend use)

## Local setup

1. Create the database in MySQL Workbench:

   ```sql
   CREATE DATABASE ventrixcarros;
   ```

2. Open a terminal in `ventrixcarros-backend` and install dependencies:

   ```powershell
   npm install
   ```

3. Copy `ventrixcarros-backend/.env.example` to `ventrixcarros-backend/.env`, then fill in database credentials and the secrets for integrations you use. Keep `.env` private; it must never be committed or shared.

4. Start the API from the backend folder:

   ```powershell
   npm run dev
   ```

   The API defaults to `http://localhost:5000`. Check `http://localhost:5000/api/health` for the health response. Sequelize syncs the models on startup; use a migration-based schema process before production deployment.

5. Open the `company app` folder in VS Code and use Live Server to open `index.html`. The shared frontend API setting is in `company app/config.js`; its local value points to `http://localhost:5000/api`.

## Run the automated tests

From `ventrixcarros-backend`, run:

```powershell
npm test
```

The current tests cover authentication and role checks, signup OTP outcomes, company-scoped job and application access, subscription job limits, and rejection of invalid payment and webhook signatures. They use test data and do not call external providers.
## Environment variables

See `ventrixcarros-backend/.env.example` for the variable names. `FRONTEND_URL` must exactly match the frontend origin so the API CORS policy accepts browser requests. For a hosted test deployment, set the frontend API URL to the deployed API address and set `FRONTEND_URL` to the public frontend origin in the backend host's private environment settings. Do not put API keys in frontend files.

## Main areas

- `company app/`: public pages, recruiter dashboard pages, admin pages, and shared frontend configuration.
- `ventrixcarros-backend/src/routes/`: API route definitions.
- `ventrixcarros-backend/src/controllers/`: HTTP request/response handlers.
- `ventrixcarros-backend/src/services/`: application logic and integrations.
- `ventrixcarros-backend/src/models/`: Sequelize data models.
- `ventrixcarros-backend/src/config/`: database, payment, and AI client setup.

## Important deployment notes

- The current frontend configuration is local-only until `company app/config.js` points to the hosted API.
- Use a hosted MySQL database for a public test environment; a database on a personal computer is not publicly reachable by the hosted API.
- Configure secrets only in the backend host's environment-variable settings. Never commit `.env`, API keys, payment secrets, session exports, or real customer data.
- Verify authentication, email delivery, payment webhooks, and authorization on the deployed environment before inviting testers.
- The student-facing website is a separate future integration and is not included in this repository setup.
