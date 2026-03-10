# Deployment Files Summary

## Files Created for Production Deployment

### 1. **DEPLOYMENT_GUIDE.md** (Main Guide)
Complete step-by-step deployment instructions for Hostinger VPS with:
- Initial VPS setup
- Backend configuration
- Frontend build
- SSL/HTTPS setup
- PM2 process management
- Nginx reverse proxy
- Monitoring and maintenance
- Troubleshooting guide

### 2. **deploy.sh** (Quick Deployment Script)
Automated bash script that:
- Updates system packages
- Installs all dependencies
- Builds frontend
- Configures PM2
- Sets up Nginx
- Optionally installs SSL certificate

**Usage on VPS:**
```bash
# Edit with your username and domain
nano deploy.sh

# Run it
bash deploy.sh
```

### 3. **nginx.conf** (Web Server)
Production-ready Nginx configuration with:
- SSL/HTTPS setup
- Reverse proxy to backend
- Static file caching
- Gzip compression
- Security headers
- HTTP → HTTPS redirect

### 4. **ecosystem.config.json** (Process Manager)
PM2 configuration for managing the backend process with:
- Auto-restart on crash
- Process monitoring
- Logging setup

### 5. **ghiras.service** (Alternative: Systemd)
Alternative to PM2 using systemd service file for:
- Auto-start on server reboot
- System integration
- Centralized logging

### 6. **backend/.env.example**
Template for backend environment variables:
- MONGO_URL
- DB_NAME
- JWT_SECRET
- PORT & HOST

### 7. **backend/requirements.txt** (Updated)
Pinned Python dependencies with exact versions for consistency

---

## Quick Deployment Checklist

### Before Deployment:
- [ ] Purchase Hostinger VPS (Ubuntu 20.04+)
- [ ] Register domain
- [ ] Point domain A record to VPS IP
- [ ] Get MongoDB credentials (Atlas or on-server)
- [ ] Generate secure JWT_SECRET

### On Your Local Machine:
- [ ] Review all configuration files
- [ ] Update `deploy.sh` with your username and domain
- [ ] Test build locally: `npm run build`

### On VPS:
1. SSH into your VPS
2. Upload project files (or clone from Git)
3. Edit deploy.sh with your details
4. Run `bash deploy.sh`
5. Wait for completion (5-10 minutes)
6. Access https://yourdomain.com

---

## Architecture After Deployment

```
Internet
    ↓ (HTTPS)
Nginx (Port 443)
    ↓
Reverse Proxy
    ├→ /api/* → Backend (Uvicorn + FastAPI on 8000)
    └→ /* → Frontend (React static files - build/)
```

---

## Important Environment Variables

**Backend (.env):**
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
DB_NAME=ghiras_db
JWT_SECRET=<generate-secure-random-string>
PORT=8000
HOST=0.0.0.0
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://yourdomain.com
```

---

## Access URLs After Deployment

- **Frontend:** https://yourdomain.com
- **API Docs:** https://yourdomain.com/api/docs
- **Health Check:** https://yourdomain.com/api/health

---

## Maintenance Commands

```bash
# View backend logs
pm2 logs ghiras-backend

# Restart backend
pm2 restart ghiras-backend

# Restart frontend (rebuild + nginx reload)
npm run build --prefix frontend
sudo systemctl reload nginx

# Check all services
pm2 status
sudo systemctl status nginx

# View SSL certificate
sudo certbot certificates
```

---

## Support Notes

- **Hostinger VPS Access:** Use SSH with credentials provided
- **MongoDB:** Use Atlas free tier for testing, paid for production
- **SSL:** Let's Encrypt certificates auto-renew
- **Storage:** Monitor with `df -h` monthly
- **Backups:** Database backups should be automated

---

Generated: March 9, 2026
For Questions: Refer to DEPLOYMENT_GUIDE.md
