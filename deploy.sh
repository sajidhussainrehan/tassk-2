#!/bin/bash

# Ghiras Club - Quick Deployment Script for Hostinger VPS
# Usage: bash deploy.sh

set -e

echo "======================================"
echo "Ghiras Club - VPS Deployment Script"
echo "======================================"

# Configuration
APPDIR="/home/username/ghiras97"
BACKENDDIR="$APPDIR/backend"
FRONTENDDIR="$APPDIR/frontend"
DOMAIN="yourdomain.com"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   print_error "Please don't run this script as root. Run as your application user."
   exit 1
fi

# Step 1: Update System
echo ""
echo "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System packages updated"

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm
print_status "Dependencies installed"

# Step 3: Setup Backend
echo ""
echo "Step 3: Setting up backend..."
cd "$BACKENDDIR"

if [ ! -d "venv" ]; then
    print_warning "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
print_status "Backend dependencies installed"

# Step 4: Setup Frontend
echo ""
echo "Step 4: Building frontend..."
cd "$FRONTENDDIR"
npm install --legacy-peer-deps
npm run build
print_status "Frontend built successfully"

# Step 5: Install PM2
echo ""
echo "Step 5: Setting up PM2..."
sudo npm install -g pm2 --silent
cd "$APPDIR"
pm2 start ecosystem.config.json
pm2 startup
pm2 save
print_status "PM2 configured and started"

# Step 6: Setup Nginx
echo ""
echo "Step 6: Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/ghiras
sudo ln -sf /etc/nginx/sites-available/ghiras /etc/nginx/sites-enabled/ghiras
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_status "Nginx configured"

# Step 7: Setup SSL
echo ""
echo "Step 7: Setting up SSL certificate..."
print_warning "This requires your domain to already point to this server IP"
read -p "Do you want to setup Let's Encrypt SSL now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN"
    sudo certbot install --nginx -d "$DOMAIN" -d "www.$DOMAIN"
    print_status "SSL certificate installed"
else
    print_warning "Skipping SSL setup. You can run this later with: sudo certbot --nginx"
fi

# Step 8: Verify Status
echo ""
echo "Step 8: Verifying services..."
echo ""

echo "Backend Status:"
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager

# Final message
echo ""
echo "======================================"
print_status "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Your application is running at:"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        pm2 logs ghiras-backend"
echo "  Restart backend:  pm2 restart ghiras-backend"
echo "  Stop all:         pm2 stop all"
echo "  Nginx reload:     sudo systemctl reload nginx"
echo ""
