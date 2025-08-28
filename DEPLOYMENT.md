# 🚀 ChatAI Deployment Guide for Render

This guide will help you deploy your ChatAI application to Render without any issues.

## ✅ Pre-deployment Checklist

All necessary configuration files have been updated for Render deployment:

- ✅ `package.json` - Updated with proper build/start scripts
- ✅ `next.config.ts` - Configured for production deployment
- ✅ `prisma/schema.prisma` - Updated to use PostgreSQL
- ✅ `render.yaml` - Render deployment configuration
- ✅ `.env.example` - Environment variables template
- ✅ Health check endpoint - `/api/health`

## 🗄️ Database Setup

Your app is now configured to use PostgreSQL (required by Render):

1. **Automatic Database**: Render will create a PostgreSQL database automatically using the `render.yaml` configuration
2. **Manual Setup**: If you prefer manual setup, create a PostgreSQL database in Render dashboard

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Configure for Render deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/chatai-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

#### Option A: Automatic Deployment (Using render.yaml)

1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to start deployment

#### Option B: Manual Deployment

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the following:

**Build & Deploy Settings:**
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: `18` (or latest)

**Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=[Your PostgreSQL connection string]
NEXTAUTH_SECRET=[Generate a random 32+ character string]
NEXTAUTH_URL=https://your-app-name.onrender.com
```

### Step 3: Database Setup

1. Create a PostgreSQL database in Render:
   - Go to Dashboard → "New" → "PostgreSQL"
   - Choose the free plan
   - Copy the connection string

2. Update your web service environment variables:
   - Set `DATABASE_URL` to your PostgreSQL connection string

### Step 4: Final Configuration

1. After deployment, your app will be available at: `https://your-app-name.onrender.com`
2. Update `NEXTAUTH_URL` environment variable with your actual domain
3. The app will automatically run database migrations on first deploy

## 🔧 Environment Variables

Make sure to set these environment variables in Render:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:port/db` |
| `NEXTAUTH_SECRET` | Auth secret key | `your-super-secret-key` |
| `NEXTAUTH_URL` | Your app URL | `https://yourapp.onrender.com` |

## 🏗️ Build Process

The build process will:
1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate`)
3. Push database schema (`prisma db push`)
4. Build Next.js app (`next build`)

## 🔍 Monitoring

- **Health Check**: `/api/health` - Returns app and database status
- **Logs**: Available in Render dashboard
- **Database**: Monitor in Render PostgreSQL dashboard

## 🚨 Troubleshooting

### Common Issues:

1. **Build Errors**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in `package.json`

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is set correctly
   - Check PostgreSQL database is running

3. **Environment Variables**:
   - Ensure all required variables are set in Render dashboard
   - Don't include quotes around values

4. **TypeScript Errors**:
   - Run `npm run build` locally first to catch issues
   - Fix any TypeScript errors before deploying

### Debug Steps:

1. Check Render build logs for errors
2. Verify environment variables are set
3. Test health endpoint: `https://yourapp.onrender.com/api/health`
4. Check database connection

## ⚡ Performance Tips

1. **Free Tier Limitations**:
   - Apps sleep after 15 minutes of inactivity
   - Cold start may take 30-60 seconds
   - Consider upgrading for production use

2. **Optimization**:
   - App is configured with `output: 'standalone'` for faster startup
   - Prisma client is generated during build for better performance

## 🎉 Success!

Once deployed, your ChatAI application will be live with:
- ✅ User authentication (signup/login)
- ✅ Real-time chat functionality
- ✅ PostgreSQL database
- ✅ Production-ready configuration

Your app will be available at: `https://your-app-name.onrender.com`

## 📞 Support

If you encounter issues during deployment:
1. Check Render build logs
2. Verify environment variables
3. Test health endpoint
4. Review this guide for common solutions

Happy deploying! 🚀