# Vercel Deployment Guide - Leadway AI Readiness App

## Project Structure for Vercel
```
/app
├── api/
│   ├── index.py          # FastAPI serverless function
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── ...               # React app
└── vercel.json           # Vercel configuration
```

## Environment Variables Required in Vercel

Go to **Vercel Dashboard → Project Settings → Environment Variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGO_URL` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `DB_NAME` | `leadway_ai_readiness` | Database name |
| `ADMIN_PASSWORD` | `leadway2026` | Admin dashboard password |
| `REACT_APP_BACKEND_URL` | (leave empty) | Uses relative paths |

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user with read/write permissions
4. Whitelist `0.0.0.0/0` for Vercel serverless (or use Vercel's IP ranges)
5. Get the connection string and add to Vercel env vars

## Deploy Steps

1. Push code to GitHub (main branch)
2. Vercel will auto-deploy
3. Add environment variables in Vercel dashboard
4. Redeploy to pick up env vars

## Testing Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

## Troubleshooting

- **404 on API routes**: Check `vercel.json` rewrites configuration
- **MongoDB connection error**: Verify MONGO_URL and IP whitelist
- **Build failure**: Check frontend build logs in Vercel dashboard
