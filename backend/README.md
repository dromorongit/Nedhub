# Nedhub Backend API

Backend server for Nedhub website with **Hubtel Payment Integration** for Ghana.

## 🚀 Quick Start (Local)

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## 🚂 Deploy to Railway

### Prerequisites
- [Railway Account](https://railway.app/) (free sign up)
- [Railway CLI](https://docs.railway.app/cli/installation) installed

### Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Nedhub Backend with Hubtel"
   git remote add origin https://github.com/YOUR_USERNAME/nedhub.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `nedhub` repository
   - Railway will auto-detect it's a Node.js app

3. **Add Environment Variables**
   - In Railway dashboard, go to your service → "Variables"
   - Add these variables:
   ```
   PORT=3000
   NODE_ENV=production
   HUBTEL_POS_SALES_ID=2037641
   HUBTEL_API_KEY=85d4a1fb05274a2fab91aa273496887a
   HUBTEL_CLIENT_ID=J6MVrDg
   HUBTEL_CLIENT_SECRET=85d4a1fb05274a2fab91aa273496887a
   FRONTEND_URL=https://your-frontend-domain.netlify.app
   API_BASE_URL=https://your-backend-service.up.railway.app
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Your API will be available at: `https://your-service.up.railway.app`

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set HUBTEL_POS_SALES_ID=2037641
railway variables set HUBTEL_API_KEY=85d4a1fb05274a2fab91aa273496887a
railway variables set HUBTEL_CLIENT_ID=J6MVrDg
railway variables set HUBTEL_CLIENT_SECRET=85d4a1fb05274a2fab91aa273496887a
railway variables set FRONTEND_URL=https://your-frontend.netlify.app
railway variables set API_BASE_URL=https://your-api.up.railway.app

# Deploy
railway up
```

### Method 3: Deploy from Local Folder

```bash
cd backend
railway init
railway up
```

## 🔧 Configuration

### Environment Variables on Railway

| Variable | Value |
|----------|-------|
| `PORT` | 3000 |
| `NODE_ENV` | production |
| `HUBTEL_POS_SALES_ID` | 2037641 |
| `HUBTEL_API_KEY` | (your API key) |
| `HUBTEL_CLIENT_ID` | J6MVrDg |
| `HUBTEL_CLIENT_SECRET` | (your secret) |
| `FRONTEND_URL` | Your frontend URL (Netlify/Vercel) |
| `API_BASE_URL` | Your Railway backend URL |

## 🌐 Configure Hubtel Callbacks

In your Hubtel Merchant Dashboard:
- Set **Callback URL** to: `https://YOUR_RAILWAY_APP.up.railway.app/api/payments/hubtel/callback`
- Set **Return URL** to: `https://YOUR_FRONTEND.netlify.app/cv-templates.html`

## 🔗 API Endpoints (Production)

Once deployed, your API will be available at:
```
https://your-service.up.railway.app/api
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/products` | GET | List CV templates |
| `/api/payments/hubtel/initiate` | POST | Start payment |
| `/api/payments/hubtel/callback` | POST | Hubtel webhook |
| `/api/payments/hubtel/status/:ref` | GET | Check status |

## 📋 Example Payment Request

```bash
curl -X POST https://your-service.up.railway.app/api/payments/hubtel/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9.99,
    "productId": "cv-001",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe"
  }'
```

## 🐛 Troubleshooting

### Build Fails
- Ensure `package.json` has correct dependencies
- Check that `start` script exists: `"start": "node server.js"`

### 503 Error
- Check Railway logs: `railway logs`
- Ensure environment variables are set

### Hubtel Not Working
- Verify credentials in Railway variables
- Check callback URL is configured in Hubtel dashboard
- View logs: `railway logs --tail`

## 📁 Project Structure

```
nedhub/
├── backend/
│   ├── server.js           # Main entry
│   ├── package.json        # Dependencies
│   ├── railway.json        # Railway config
│   ├── routes/
│   │   ├── payment.js      # Hubtel integration
│   │   ├── products.js      # Products API
│   │   └── orders.js       # Orders API
│   └── .env                # Local only (add to gitignore)
├── frontend/               # Your HTML/CSS/JS
└── README.md
```

## 🔒 Security Notes

- **Never commit `.env`** - Add to `.gitignore`
- **Rotate credentials** if exposed
- Use Railway's variable encryption for production

## 📞 Support

- [Railway Docs](https://docs.railway.app/)
- [Hubtel Support](https://hubtel.com/support)
