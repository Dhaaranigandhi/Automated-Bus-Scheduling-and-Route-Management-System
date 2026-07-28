# Production Deployment Guide — RouteWise (TransitFlow)

This document provides architectural blueprints and step-by-step instructions to deploy the RouteWise Scheduling and Route Management Platform in production environments.

---

## 🐳 Containerized Deployment (Docker Compose)

The application is fully containerized. A multi-container layout manages the Node API, React client, MySQL DB, and Redis caching.

### Prerequisite Setup
1. Verify Docker Engine (v20+) and Docker Compose (v2.0+) are installed.
2. Confirm ports `80`, `5000`, `3306`, and `6379` are open and not blocked by active processes.

### Orchestration Commands
From the project root directory, run:
```bash
# Build images and start services in the background
docker-compose up -d --build

# Verify container statuses
docker-compose ps

# Stream logs from all services
docker-compose logs -f
```

---

## ⚙️ Process Management (PM2 Deployment)

For bare-metal or VM environments, utilize PM2 (Process Manager 2) to maintain application cluster uptime.

### Backend PM2 Configuration
1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Create an `ecosystem.config.js` configuration in `backend/`:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'routewise-backend',
         script: 'dist/app.js',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 5000,
         },
       },
     ],
   };
   ```
3. Compile and start the cluster:
   ```bash
   cd backend
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   ```

---

## 🔒 Reverse Proxy & Load Balancing (Nginx)

Nginx is used to proxy client requests to the Node backend and secure connections with TLS.

### Sample Server Block
```nginx
server {
    listen 80;
    server_name transitflow.yourdomain.com;

    # Static frontend assets
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API endpoints redirection
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSockets (Socket.IO telemetry stream)
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
