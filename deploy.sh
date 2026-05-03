#!/bin/bash
set -e

ECR_REGISTRY="353863292008.dkr.ecr.us-east-1.amazonaws.com"
AWS_REGION="us-east-1"
DB_HOST="ctf-postgres.cmv86oiq0o6f.us-east-1.rds.amazonaws.com"
IMAGE_TAG=$1
PUBLIC_IP=$(curl -fs http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo localhost)

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: ./deploy.sh <image-tag>"
  exit 1
fi

echo ">>> Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo ">>> Pulling image tag ${IMAGE_TAG}..."
docker pull ${ECR_REGISTRY}/ctf-platform:${IMAGE_TAG}

echo ">>> Stopping old backend container..."
docker rm -f ctf-platform || true

echo ">>> Starting new backend container..."
docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e CUSTOM_SQLI_URL=http://${PUBLIC_IP}:4000 \
  -e DB_HOST=${DB_HOST} \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=ctfpassword123 \
  -e JWT_SECRET=supersecretkey123 \
  ${ECR_REGISTRY}/ctf-platform:${IMAGE_TAG}

echo ">>> Starting custom SQLi challenge..."
docker build -t ctf-custom-sqli ./platform/custom-sqli
docker rm -f ctf-custom-sqli || true
docker run -d \
  --name ctf-custom-sqli \
  --restart unless-stopped \
  -p 4000:80 \
  -e FLAG='FLAG{custom_sqli}' \
  ctf-custom-sqli

echo ">>> Building frontend..."
cd platform/frontend
npm install --silent
VITE_API_BASE_URL=http://${PUBLIC_IP}:3000 npm run build

echo ">>> Deploying frontend..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chmod -R 755 /var/www/html/
sudo chmod -R 644 /var/www/html/assets/*

echo ">>> Restarting nginx..."
sudo docker restart nginx-frontend

cd ../..

sleep 5
curl http://localhost:3000/health && echo ">>> Backend healthy!" || echo ">>> Backend health check failed"
curl http://10.0.1.120 | grep -q "CTF Platform" && echo ">>> Frontend healthy!" || echo ">>> Frontend health check failed"

echo ">>> Deploy complete. Public IP: ${PUBLIC_IP}"