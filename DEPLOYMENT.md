# Deployment Guide

This guide will help you deploy the Farm Task Scheduler application.

## Architecture

The application consists of two parts:
1. **Frontend** (Static HTML/JS in `client/` directory)
2. **Backend** (Node.js Express server in `server/` directory)

## Deployment Options

### Option 1: Frontend on Netlify + Backend on Render (Recommended)

#### Step 1: Deploy Backend to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ahmadnugroho-asp/farm-scheduler`
4. Configure the service:
   - **Name**: `farm-scheduler-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Add Environment Variables:
   - `SHEET_ID`: Your Google Sheet ID
   - `PORT`: `3001` (or leave default)

6. Upload `service-account.json`:
   - Go to "Environment" tab
   - Click "Add Secret File"
   - Name: `service-account.json`
   - Content: Paste your service account JSON content

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Copy the service URL (e.g., `https://farm-scheduler-api.onrender.com`)

#### Step 2: Deploy Frontend to Netlify

1. Go to [Netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `ahmadnugroho-asp/farm-scheduler`
4. Configure build settings:
   - **Build command**: `echo 'No build required'`
   - **Publish directory**: `client`
   - **Base directory**: (leave empty)

5. Before deploying, update `netlify.toml`:
   - Replace `https://your-backend-url.com` with your Render URL
   - Example: `https://farm-scheduler-api.onrender.com`

6. Click "Deploy site"
7. Once deployed, you'll get a URL like `https://random-name-123.netlify.app`

#### Step 3: Update Frontend API URL

You need to update the frontend to use the production backend URL:

1. Edit `client/index.html`
2. Find the `fetchTaskData` and API functions
3. Update API endpoint from `/api/` to `https://your-render-url.onrender.com/api/`
4. Commit and push changes

---

### Option 2: Both on Render

If you prefer to host both frontend and backend together:

1. Follow Step 1 above for the backend
2. The Express server already serves the client files statically
3. Access the app at: `https://your-service.onrender.com`
4. No Netlify needed!

---

### Option 3: Both on Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `ahmadnugroho-asp/farm-scheduler`
4. Add environment variables:
   - `SHEET_ID`: Your Google Sheet ID
   - `PORT`: `3001`
5. Upload `service-account.json` via Railway CLI or dashboard
6. Railway will auto-detect and deploy the Node.js app
7. Access at: `https://your-app.up.railway.app`

---

## Post-Deployment Configuration

### Update Google Sheets Service Account

Make sure your Google Sheet is shared with the service account email found in `service-account.json`:
- Email format: `service-account-name@project-id.iam.gserviceaccount.com`
- Give it "Editor" permissions

### Environment Variables Checklist

Backend needs:
- ✅ `SHEET_ID` - Your Google Sheets document ID
- ✅ `service-account.json` - Service account credentials file
- ✅ `PORT` - (Optional, defaults to 3001)

### CORS Configuration

If deploying frontend and backend separately, you may need to enable CORS in `server/server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://your-netlify-site.netlify.app',
  credentials: true
}));
```

Install cors package:
```bash
cd server
npm install cors
```

---

## Testing the Deployment

1. Open your deployed frontend URL
2. Check that tasks load from Google Sheets
3. Test language switcher (EN/ID)
4. Test creating a new task
5. Test updating task status with PIN
6. Check browser console for errors

---

## Troubleshooting

### Backend Issues

**Problem**: "Failed to fetch data from Google Sheets"
- **Solution**: Check that `SHEET_ID` environment variable is set correctly
- **Solution**: Verify service account JSON is uploaded
- **Solution**: Confirm Google Sheet is shared with service account email

**Problem**: "Invalid PIN"
- **Solution**: Check that Users sheet exists with PIN and Name columns
- **Solution**: Verify PIN values in the sheet match what you're entering

### Frontend Issues

**Problem**: API requests failing
- **Solution**: Update API URLs to point to production backend
- **Solution**: Enable CORS on the backend if needed
- **Solution**: Check Netlify redirects in `netlify.toml`

**Problem**: Console warnings about CDN
- **Solution**: Already suppressed in the code, these are informational only

---

## Cost Estimate

### Free Tier (Recommended for testing)
- **Render Free Tier**: $0/month (spins down after 15 min of inactivity)
- **Netlify Free Tier**: $0/month (100GB bandwidth)
- **Total**: $0/month

### Paid Tier (For production)
- **Render Starter**: $7/month (always on, better performance)
- **Netlify Pro**: $19/month (if needed for advanced features)
- **Total**: $7-26/month

---

## Maintenance

### Updating the App

1. Make changes locally
2. Commit and push to GitHub
3. Render will auto-deploy backend changes
4. Netlify will auto-deploy frontend changes

### Monitoring

- Render provides logs and metrics in the dashboard
- Netlify provides analytics and function logs
- Check Google Sheets API quota in Google Cloud Console

---

## Need Help?

- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- Google Sheets API: https://developers.google.com/sheets/api

---

**Happy Deploying! 🚀**
