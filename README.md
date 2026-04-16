# Profile

Personal profile project split across:

- `frontend`: React + Vite UI, ready to deploy on Vercel
- `backend`: Express API, ready to deploy on Railway
- `shared/profile.ts`: one shared payload contract for both FE fallback data and BE responses
- local image assets in `frontend/public/images`

## Local development

```bash
npm install
npm run dev
```

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`
- Vite proxies `/api/*` to the local backend in development

## Vercel frontend

Set this environment variable in Vercel for both Preview and Production:

```bash
VITE_API_BASE_URL=https://your-railway-service.up.railway.app
```

If the variable is missing or the API is temporarily unavailable, the frontend falls back to the bundled shared profile data so the deployment still renders.

## Railway backend

The repo includes root-level `railway.json` so Railway can deploy the backend with:

```bash
npx @railway/cli up
```

Useful endpoints:

- `GET /health`
- `GET /api/profile`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `PUT /api/admin/profile`
- `POST /api/admin/profile/reset`

## Admin route

- secret frontend route: `/admin-midas-1420`
- the backend reads admin credentials from `backend/.env`
- use `backend/.env.example` as the deployment reference for Railway
- if `MONGODB_URI` is set, profile edits are stored in MongoDB
- if `MONGODB_URI` is missing, the backend falls back to `backend/data/profile-store.json`

## MongoDB on Railway

Set these Railway backend environment variables:

```bash
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=profile_admin
```

Once those are present, admin saves from `/admin-midas-1420` will persist to MongoDB instead of the local file store.
