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

### Option 4: Google Cloud Platform (Compute Engine with Ubuntu)

Deploy on a GCP VM for full control and integration with Google services.

#### Prerequisites

- Google Cloud account with billing enabled
- Basic knowledge of Linux/Ubuntu
- SSH client installed

#### Step 1: Create a Compute Engine Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Compute Engine** → **VM instances**
3. Click **"Create Instance"**
4. Configure the instance:
   - **Name**: `farm-scheduler-vm`
   - **Region**: Choose closest to your users (e.g., `asia-southeast2` for Jakarta)
   - **Zone**: Any zone in your region
   - **Machine type**:
     - For testing: `e2-micro` (0.25-2 vCPU, 1GB RAM) - Free tier eligible
     - For production: `e2-small` (2 vCPU, 2GB RAM) or higher
   - **Boot disk**:
     - OS: **Ubuntu 22.04 LTS**
     - Size: **10 GB** (minimum)
     - Type: **Standard persistent disk**
   - **Firewall**:
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic

5. Click **"Create"**

#### Step 2: Configure Firewall Rules

1. Go to **VPC network** → **Firewall**
2. Click **"Create Firewall Rule"**
3. Configure:
   - **Name**: `allow-app-port`
   - **Direction**: Ingress
   - **Targets**: All instances in the network
   - **Source IP ranges**: `0.0.0.0/0`
   - **Protocols and ports**: `tcp:3001`
4. Click **"Create"**

#### Step 3: Connect to the VM via SSH

```bash
# From GCP Console, click "SSH" button next to your instance
# Or use gcloud CLI:
gcloud compute ssh farm-scheduler-vm --zone=your-zone
```

#### Step 4: Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
git --version
nginx -v
pm2 --version
```

#### Step 5: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Clone repository
git clone https://github.com/ahmadnugroho-asp/farm-scheduler.git
cd farm-scheduler/server

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
SHEET_ID=your_google_sheet_id_here
PORT=3001
EOF

# Upload service account file (do this manually via SCP or paste content)
nano service-account.json
# Paste your service account JSON content, save with Ctrl+X, Y, Enter
```

#### Step 6: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/farm-scheduler
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-external-ip;  # Replace with your VM's external IP

    # Frontend
    location / {
        root /var/www/farm-scheduler/client;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and enable the configuration:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/farm-scheduler /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Step 7: Start Application with PM2

```bash
# Navigate to server directory
cd /var/www/farm-scheduler/server

# Start the application with PM2
pm2 start server.js --name farm-scheduler

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command that PM2 outputs

# Check status
pm2 status
pm2 logs farm-scheduler
```

#### Step 8: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
# If you don't have a domain, skip this step
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure Nginx for HTTPS
# Follow the prompts to complete setup

# Test automatic renewal
sudo certbot renew --dry-run
```

#### Step 9: Configure Domain (Optional)

If you have a domain:

1. Go to your domain registrar (e.g., Cloudflare, GoDaddy)
2. Add an **A record** pointing to your VM's external IP:
   - Type: `A`
   - Name: `@` (for root domain) or `app` (for subdomain)
   - Value: Your VM's external IP
   - TTL: Automatic or 300

3. Wait for DNS propagation (5-30 minutes)
4. Update Nginx config with your domain name
5. Setup SSL with Let's Encrypt (see Step 8)

#### Step 10: Access Your Application

- **Without domain**: `http://YOUR_VM_EXTERNAL_IP`
- **With domain**: `http://your-domain.com` or `https://your-domain.com` (if SSL configured)
- Get your external IP from GCP Console or run: `curl -4 icanhazip.com`

---

### GCP Deployment - Common Commands

```bash
# View application logs
pm2 logs farm-scheduler

# Restart application
pm2 restart farm-scheduler

# Stop application
pm2 stop farm-scheduler

# Delete application from PM2
pm2 delete farm-scheduler

# Update application
cd /var/www/farm-scheduler
git pull origin main
cd server
npm install
pm2 restart farm-scheduler

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check disk usage
df -h

# Check memory usage
free -h

# Monitor system resources
htop  # Install with: sudo apt install htop
```

---

### GCP Deployment - Firewall Configuration

If you need to allow additional ports:

```bash
# Using gcloud CLI
gcloud compute firewall-rules create allow-custom-port \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow custom port"
```

---

### GCP Deployment - Backup Script

Create a backup script for your data:

```bash
# Create backup script
nano ~/backup.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/farm-scheduler

# Backup environment file
cp /var/www/farm-scheduler/server/.env $BACKUP_DIR/env_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/app_$DATE.tar.gz"
```

Make it executable and setup cron:

```bash
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/$USER/backup.sh >> /home/$USER/backup.log 2>&1
```

---

### GCP Deployment - Monitoring Setup

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup basic monitoring with PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Enable Nginx status page
sudo nano /etc/nginx/sites-available/farm-scheduler
# Add this inside the server block:
# location /nginx_status {
#     stub_status on;
#     access_log off;
#     allow 127.0.0.1;
#     deny all;
# }
```

---

### GCP Deployment - Security Hardening

```bash
# Update security packages regularly
sudo apt update && sudo apt upgrade -y

# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure firewall with UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001/tcp
sudo ufw enable
sudo ufw status

# Disable root login via SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Install fail2ban to prevent brute force
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

### Option 5: Docker Compose (Any Platform)

Deploy using Docker containers for maximum portability and consistency across environments.

#### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- Basic knowledge of Docker

#### Step 1: Clone Repository

```bash
git clone https://github.com/ahmadnugroho-asp/farm-scheduler.git
cd farm-scheduler
```

#### Step 2: Setup Environment

```bash
# Create environment file from example
cp .env.example .env

# Edit .env file with your Google Sheet ID
nano .env
# Set: SHEET_ID=your_google_sheet_id_here
```

#### Step 3: Add Service Account File

```bash
# Place your service-account.json in the server directory
cp /path/to/your/service-account.json server/service-account.json
```

#### Step 4: Build and Run with Docker Compose

**Development Mode** (without Nginx):

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Access application at http://localhost:3001
```

**Production Mode** (with Nginx reverse proxy):

```bash
# Start with Nginx profile
docker-compose --profile production up -d

# Access application at http://localhost (port 80)
```

#### Step 5: Verify Deployment

```bash
# Check if containers are running
docker-compose ps

# View application logs
docker-compose logs farm-scheduler

# Test the application
curl http://localhost:3001/api/tasks

# Check health status
docker inspect --format='{{.State.Health.Status}}' farm-scheduler-app
```

---

### Docker Compose - Common Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f farm-scheduler

# Rebuild containers after code changes
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v

# Execute command in running container
docker-compose exec farm-scheduler sh

# Check resource usage
docker stats

# Pull latest images
docker-compose pull
```

---

### Docker Compose - Updating the Application

```bash
# Pull latest code from GitHub
git pull origin main

# Rebuild and restart containers
docker-compose up -d --build

# Alternative: Using Docker image from registry
# (if you push to Docker Hub or similar)
docker-compose pull
docker-compose up -d
```

---

### Docker Compose - Environment Variables

Create a `.env` file in the project root:

```bash
# .env
SHEET_ID=your_google_sheet_id_here
PORT=3001
NODE_ENV=production
```

---

### Docker Compose - Production with SSL

For production with SSL certificates:

1. **Get SSL Certificates** (Let's Encrypt or other):

```bash
# Using certbot standalone
mkdir -p nginx/ssl
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

2. **Update nginx.conf**:

Uncomment the HTTPS server block in `nginx/nginx.conf` and update the domain name.

3. **Start with SSL**:

```bash
docker-compose --profile production up -d
```

---

### Docker Compose - Deployment on Cloud Platforms

#### Deploy on AWS EC2, GCP Compute Engine, or Azure VM:

```bash
# 1. SSH into your VM
ssh user@your-vm-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone and setup
git clone https://github.com/ahmadnugroho-asp/farm-scheduler.git
cd farm-scheduler
cp .env.example .env
nano .env  # Edit with your SHEET_ID
cp /path/to/service-account.json server/service-account.json

# 5. Start the application
docker-compose up -d

# 6. Configure firewall (if needed)
# For GCP: Configure firewall rules in console
# For AWS: Configure Security Groups
# For Azure: Configure Network Security Groups
```

#### Deploy on Digital Ocean:

```bash
# Use Digital Ocean's Docker Droplet
# SSH and follow same steps as above

# Or use Digital Ocean App Platform with Docker
# Connect your GitHub repo
# Set SHEET_ID environment variable in App Platform dashboard
# Upload service-account.json via App Platform settings
```

---

### Docker Compose - Monitoring and Logs

```bash
# View real-time logs
docker-compose logs -f --tail=100

# Export logs to file
docker-compose logs > app-logs.txt

# Monitor resource usage
docker stats farm-scheduler-app

# Check container health
docker inspect farm-scheduler-app | grep -A 10 Health

# View container details
docker-compose ps -a
docker inspect farm-scheduler-app
```

---

### Docker Compose - Backup and Restore

**Backup**:

```bash
# Backup service account and environment files
tar -czf backup-$(date +%Y%m%d).tar.gz \
  server/service-account.json \
  .env \
  docker-compose.yml

# Backup logs (if mounted)
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

**Restore**:

```bash
# Extract backup
tar -xzf backup-YYYYMMDD.tar.gz

# Restart containers
docker-compose down
docker-compose up -d
```

---

### Docker Compose - Troubleshooting

**Problem**: Container won't start

```bash
# Check logs
docker-compose logs farm-scheduler

# Check if port is already in use
sudo lsof -i :3001

# Remove old containers and rebuild
docker-compose down
docker-compose up -d --build
```

**Problem**: Can't connect to Google Sheets

```bash
# Verify service account file exists
docker-compose exec farm-scheduler ls -la /app/server/service-account.json

# Check environment variables
docker-compose exec farm-scheduler env | grep SHEET_ID

# Restart container
docker-compose restart farm-scheduler
```

**Problem**: High memory usage

```bash
# Check resource usage
docker stats

# Set memory limits in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 512M
#     reservations:
#       memory: 256M

# Restart with new limits
docker-compose up -d
```

---

### Docker Compose - Security Best Practices

```bash
# Run container as non-root user
# Already configured in Dockerfile

# Scan image for vulnerabilities
docker scan farm-scheduler:latest

# Keep Docker updated
sudo apt update && sudo apt upgrade docker-ce

# Use secrets for sensitive data (Docker Swarm)
echo "your-sheet-id" | docker secret create sheet_id -

# Enable Docker content trust
export DOCKER_CONTENT_TRUST=1
```

---

### Docker Compose - CI/CD Integration

**GitHub Actions Example**:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker image
        run: docker build -t farm-scheduler .

      - name: Deploy to server
        run: |
          ssh user@server "cd /app && git pull && docker-compose up -d --build"
```

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
- **Railway Free Tier**: $5 free credit/month (then $0.000463/GB-sec)
- **GCP Free Tier**: $0/month for e2-micro (1 instance, US regions only, 30GB storage)
- **Total**: $0/month

### Paid Tier (For production)

**Option 1: Render + Netlify**
- **Render Starter**: $7/month (always on, better performance)
- **Netlify Pro**: $19/month (if needed for advanced features)
- **Total**: $7-26/month

**Option 2: Railway**
- **Usage-based pricing**: ~$5-15/month (depends on usage)

**Option 3: Google Cloud Platform**
- **e2-micro (Free Tier)**: $0/month (US regions only)
- **e2-small**: ~$13/month (asia-southeast2)
- **e2-medium**: ~$26/month (asia-southeast2)
- **Storage**: ~$0.40/month (10GB standard disk)
- **Bandwidth**: First 1GB free, then $0.12/GB (Asia)
- **Static IP (optional)**: ~$3/month
- **Total**: $0-30/month (depending on instance size and region)

**Option 4: Docker on Any Platform**
- **Local/On-Premise**: $0/month (uses your existing hardware)
- **Digital Ocean Droplet**: $4-6/month (Basic droplet)
- **AWS EC2 t3.micro**: ~$8/month
- **Azure B1s**: ~$8/month
- **Total**: $0-10/month (depending on hosting choice)

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
