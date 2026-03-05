# Secret Manager — Runbook

Complete guide to set up, run locally, and deploy the **Secret Manager** password vault.

---

## Prerequisites

| Requirement | Version | Install |
|---|---|---|
| **Node.js** | ≥ 18 | `brew install node` |
| **npm** | ≥ 9 | Included with Node.js |
| **Git** | any | `brew install git` |
| **Vercel CLI** (optional) | latest | `npm i -g vercel` |

---

## 1. Google OAuth Setup

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services → OAuth consent screen**.
   - Choose **External** user type.
   - Fill in the app name (e.g., "Secret Manager"), support email, and developer contact.
   - Add the scope: `email`, `profile`, `openid`.
   - Save.
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Secret Manager`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local dev)
     - `https://your-app.vercel.app` (after deployment)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app.vercel.app/api/auth/callback/google`
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret** — you'll need them for env vars.

---

## 2. Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Google OAuth credentials from Step 1
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# Random secret for session encryption
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=<paste-generated-value>

# Local dev URL (change to Vercel domain for production)
NEXTAUTH_URL=http://localhost:3000

# Database connection string (see Step 3 below)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 256-bit encryption key for storing passwords
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=<paste-64-hex-char-value>

# Comma-separated list of allowed Google emails
ALLOWED_EMAILS=you@gmail.com,friend@gmail.com
```

### Generate secrets

```bash
# NextAuth secret
openssl rand -base64 32

# Encryption key (SAVE THIS — losing it means losing all stored passwords)
openssl rand -hex 32
```

> **⚠️ CRITICAL**: Back up your `ENCRYPTION_KEY`. If you lose it, all stored passwords become permanently unrecoverable.

---

## 3. Database Setup

### Option A: Vercel Postgres (Recommended for Deployment)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Storage** tab.
2. Click **Create** → **Postgres** → follow the wizard.
3. Vercel automatically sets `DATABASE_URL` in your project env vars.
4. For local dev, copy the connection string from the Vercel dashboard into your `.env`.

### Option B: Local PostgreSQL (for Development)

```bash
# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb secret_manager

# Your DATABASE_URL will be:
# postgresql://your-username@localhost:5432/secret_manager
```

### Option C: Free Neon Postgres (Alternative)

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project and database.
3. Copy the connection string into `DATABASE_URL`.

---

## 4. Initialize the Database

Push the Prisma schema to your database:

```bash
npx prisma db push
```

This creates all tables (`User`, `Account`, `Session`, `Credential`, `Tag`, etc.).

To inspect the database:

```bash
npx prisma studio
```

---

## 5. Run Locally

```bash
# Install dependencies
npm install

# Push database schema (if not done yet)
npx prisma db push

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

1. Click **Sign in with Google**.
2. Log in with one of the emails in your `ALLOWED_EMAILS` list.
3. You are now on the dashboard — start adding secrets!

---

## 6. Deploy to Vercel

### Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts to link/create project)
vercel

# For production deployment
vercel --prod
```

### Via GitHub (Recommended)

1. Push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit — Secret Manager"
git remote add origin https://github.com/your-username/secret-manager.git
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo.
3. Vercel auto-detects Next.js. Click **Deploy**.

### Set Environment Variables on Vercel

In your Vercel project → **Settings → Environment Variables**, add ALL of these:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `DATABASE_URL` | Auto-set if using Vercel Postgres, otherwise paste your connection string |
| `ENCRYPTION_KEY` | Output of `openssl rand -hex 32` |
| `ALLOWED_EMAILS` | `you@gmail.com,friend@gmail.com` |

After setting env vars, **redeploy** your app.

### Update Google OAuth Redirect URI

After deployment, go back to Google Cloud Console → **Credentials → your OAuth client** and add:

- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

---

## 7. Post-Deployment Verification

1. ✅ Open `https://your-app.vercel.app` — dark landing page loads.
2. ✅ Click **Sign in with Google** — redirected to Google consent screen.
3. ✅ Sign in with an allowed email — redirected to dashboard.
4. ✅ Try signing in with a non-allowed email — rejected (stays on login page).
5. ✅ **Add a secret** — fill name, username, password, tags → saved.
6. ✅ **Show/hide password** — click the eye icon → decrypted password appears.
7. ✅ **Copy password** — click copy icon → password on clipboard.
8. ✅ **Search** — type in search bar → results filter.
9. ✅ **Filter by tag** — click a tag in sidebar → filtered view.
10. ✅ **Edit/delete** — modify and remove credentials.

---

## Architecture Reference

```
Secret-Manager/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── credentials/
│   │   │   ├── route.ts                  # GET (list/search), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET, PUT, DELETE single
│   │   │       └── reveal/route.ts       # GET decrypted password
│   │   └── tags/route.ts                 # GET all user tags
│   ├── dashboard/page.tsx                # Main dashboard
│   ├── globals.css                       # Dark monospace theme
│   ├── layout.tsx                        # Root layout + SessionProvider
│   └── page.tsx                          # Landing / login page
├── components/
│   ├── CredentialCard.tsx                # Password card with reveal toggle
│   ├── CredentialForm.tsx                # Add/edit modal + password generator
│   ├── DeleteConfirm.tsx                 # Delete confirmation modal
│   └── Toast.tsx                         # Toast notifications
├── lib/
│   ├── auth.ts                           # NextAuth config + email allowlist
│   ├── encryption.ts                     # AES-256-GCM encrypt/decrypt
│   └── prisma.ts                         # Prisma client singleton
├── prisma/schema.prisma                  # Database schema
├── middleware.ts                          # Route protection
├── types/next-auth.d.ts                  # Session type extension
├── .env.example                          # Env var template
└── package.json
```

---

## Security Notes

- **Passwords are encrypted at rest** using AES-256-GCM with unique IVs per entry.
- **Passwords are only decrypted** when you explicitly click the reveal/copy button — they are never sent in plaintext in list responses.
- **Email allowlisting** prevents unauthorized users from accessing the app.
- **Middleware** redirects unauthenticated access to the login page.
- The `ENCRYPTION_KEY` never touches the database — it exists only in environment variables.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ENCRYPTION_KEY must be exactly 64 hex characters` | Generate with `openssl rand -hex 32` (produces exactly 64 hex chars) |
| Google OAuth error | Verify redirect URI includes `/api/auth/callback/google` and matches your domain exactly |
| "Unauthorized" on API calls | Ensure your Google email is in `ALLOWED_EMAILS` |
| Database connection fails | Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/db?sslmode=require` |
| Build fails on Vercel | Ensure all env vars are set in Vercel project settings, then redeploy |
