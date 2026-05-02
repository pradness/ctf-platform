#!/bin/bash
set -e

ECR_REGISTRY="353863292008.dkr.ecr.us-east-1.amazonaws.com"
AWS_REGION="us-east-1"
DB_HOST="ctf-postgres.cmv86oiq0o6f.us-east-1.rds.amazonaws.com"
IMAGE_TAG=$1

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: ./deploy.sh <image-tag>"
  exit 1
fi

echo ">>> Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo ">>> Pulling image tag ${IMAGE_TAG}..."
docker pull ${ECR_REGISTRY}/ctf-platform:${IMAGE_TAG}

echo ">>> Stopping old container..."
docker rm -f ctf-platform || true

echo ">>> Starting new container..."
docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=${DB_HOST} \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=ctfpassword123 \
  -e JWT_SECRET=supersecretkey123 \
  ${ECR_REGISTRY}/ctf-platform:${IMAGE_TAG}

sleep 5
curl http://localhost:3000/health && echo ">>> Deploy successful!" || echo ">>> Health check failed"