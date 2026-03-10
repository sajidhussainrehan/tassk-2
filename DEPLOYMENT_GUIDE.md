# Ghiras Club - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu 20.04+ or similar Linux distribution
- SSH access to your VPS
- Domain name pointing to your VPS IP
- MongoDB Atlas account or MongoDB on VPS

## Step-by-Step Deployment

### 1. Initial VPS Setup

```bash
# Connect to VPS via SSH
ssh root@your_vps_ip

# Update system packages
apt update && apt upgrade -y

# Install required dependencies
apt install -y curl git nodejs npm python3 python3-pip python3-venv nginx certbot python3-certbot-nginx
```

### 2. Setup Backend

```bash
# Create application directory
mkdir -p /home/username/ghiras97
cd /home/username/ghiras97

# Clone or upload your project files
# Option A: Clone from Git
git clone your-repo-url .

# Option B: Upload via FTP/SFTP
# Use WinSCP or similar tool to upload your project

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
cd backend
pip install -r requirements.txt
```

### 3. Configure Backend Environment

```bash
# Create production .env file
nano /home/username/ghiras97/backend/.env
```

Add these values (use your actual credentials):
```
MONGO_URL=mongodb+srv://your_user:your_password@cluster.mongodb.net
DB_NAME=ghiras_db
JWT_SECRET=your-very-secure-secret-key-generate-random
PORT=8000
HOST=0.0.0.0
```

### 4. Setup Frontend

```bash
# Navigate to frontend directory
cd /home/username/ghiras97/frontend

# Create .env file
nano .env
```

Add:
```
REACT_APP_BACKEND_URL=https://yourdomain.com
```

### 5. Build Frontend for Production

```bash
cd /home/username/ghiras97/frontend

# Install dependencies
npm install --legacy-peer-deps

# Create production build
npm run build

# This generates a 'build' folder with optimized static files
```

### 6. Setup PM2 for Backend Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Copy ecosystem file to application directory
cp /home/username/ghiras97/ecosystem.config.json ecosystem.config.json

# Edit it with your paths and usernames
nano ecosystem.config.json

# Start the application with PM2
pm2 start ecosystem.config.json

# Make PM2 start on system reboot
pm2 startup
pm2 save

# Monitor the application
pm2 logs ghiras-backend
```

### 7. Configure Nginx as Reverse Proxy

```bash
# Copy nginx configuration
sudo cp /home/username/ghiras97/nginx.conf /etc/nginx/sites-available/ghiras

# Enable the site
sudo ln -s /etc/nginx/sites-available/ghiras /etc/nginx/sites-enabled/ghiras

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate (Let's Encrypt)

```bash
# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Install certificate automatically with Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### 9. Verify Deployment

```bash
# Check backend status
pm2 status

# Check logs
pm2 logs ghiras-backend

# Test API endpoints
curl https://yourdomain.com/api/health

# Check nginx status
sudo systemctl status nginx
```

## Important Configuration Files

### backend/.env (Production)
- Keep MONGO_URL secure
- Generate strong JWT_SECRET using: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Set HOST=0.0.0.0 to listen on all interfaces

### frontend/.env
- Set REACT_APP_BACKEND_URL to your domain HTTPS URL

### nginx.conf
- Replace `yourdomain.com` with your actual domain
- Replace `/home/username/` paths with actual paths
- Update SSL certificate paths

### ecosystem.config.json
- Update `cwd` path to your actual backend directory
- Adjust `instances` based on CPU cores for scaling

## Maintenance & Monitoring

### View Logs
```bash
# Backend logs
pm2 logs ghiras-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart backend
pm2 restart ghiras-backend

# Reload nginx
sudo nginx -s reload

# Full restart
pm2 stop all && sudo systemctl stop nginx
# Make changes...
pm2 start ecosystem.config.json && sudo systemctl start nginx
```

### Update Application

```bash
cd /home/username/ghiras97

# Pull latest code
git pull origin main

# Update backend
cd backend
pip install -r requirements.txt
pm2 restart ghiras-backend

# Update frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build
sudo systemctl reload nginx
```

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net" --out=/backups/ghiras-$(date +%Y%m%d)

# Enable weekly automatic backup with cron
crontab -e
# Add line: 0 2 * * 0 mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net" --out=/backups/ghiras-$(date +\%Y\%m\%d)
```

## Performance Optimization

### Enable Compression
Already configured in nginx.conf with gzip

### Database Indexing
```javascript
// Run in MongoDB compass or mongosh
db.students.createIndex({ "name": 1 })
db.students.createIndex({ "points": -1 })
db.groups.createIndex({ "name": 1 })
```

### Uvicorn Workers
Edit your PM2 command to run multiple workers:
```bash
# In ecosystem.config.json
"args": "server:app --host 0.0.0.0 --port 8000 --workers 4"
```

## Troubleshooting

### Backend not connecting
```bash
# Check if backend is running
pm2 status

# Restart backend
pm2 restart ghiras-backend

# Check logs for errors
pm2 logs ghiras-backend
```

### Frontend showing 404
```bash
# Ensure frontend build exists
ls -la /home/username/ghiras97/frontend/build/

# Rebuild if missing
cd /home/username/ghiras97/frontend
npm run build
```

### SSL certificate errors
```bash
# Check certificate validity
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check nginx SSL config
sudo nginx -T
```

### CORS issues
Ensure backend CORS middleware includes your domain:
Update backend/server.py:
```python
allow_origins=["https://yourdomain.com", "https://www.yourdomain.com"]
```

## Important Security Notes

1. Never commit .env files - use .env.example
2. Keep SSL certificate renewed automatically
3. Use strong MongoDB password
4. Regularly update system packages: `apt update && apt upgrade`
5. Use firewall: `ufw enable` and `ufw allow 22,80,443/tcp`
6. Monitor disk space: `df -h` and set up alerts
7. Regular database backups
8. Keep PM2 logs rotated: `pm2 install pm2-logrotate`

## Support & Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- Nginx Docs: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org
- PM2 Docs: https://pm2.keymetrics.io
- MongoDB Docs: https://docs.mongodb.com

---

**After Deployment URL:** https://yourdomain.com
