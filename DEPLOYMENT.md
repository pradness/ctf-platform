# AWS Deployment Checklist

This checklist ensures the CTF Platform is properly deployed on AWS.

## Prerequisites
- [x] AWS CLI configured with `ctf-admin` credentials
- [x] Terraform v1.0+ installed
- [x] ctf-key.pem file in project root
- [x] GitHub repository set up with webhook capability

## Infrastructure Setup (One-time)
- [x] Run `terraform init` in terraform/ directory
- [x] Run `terraform apply` to provision AWS resources
- [x] Note the EC2 public IP from terraform outputs
- [x] Note the RDS endpoint from terraform outputs

## EC2 Instance Setup
- [x] SSH into EC2: `ssh -i ctf-key.pem ubuntu@<EC2_IP>`
- [x] Run setup.sh to install Docker, k3s, Jenkins, SonarQube
- [x] Verify Jenkins running on port 8080
- [x] Verify SonarQube running on port 9000

## Jenkins Configuration
- [x] Unlock Jenkins with admin password from setup.sh
- [x] Install suggested plugins
- [x] Create admin user
- [x] Create new Pipeline job `ctf-pipeline`
- [x] Configure GitHub webhook trigger
- [x] Set repository to: `https://github.com/pradness/ctf-platform`
- [x] Set branch to: `*/main`
- [x] Set pipeline script path to: `Jenkinsfile`
- [x] Save and test webhook

## Jenkins Tools Installation
Run on EC2:
```bash
sudo docker exec -u root jenkins bash -c "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o /tmp/awscliv2.zip && unzip /tmp/awscliv2.zip -d /tmp && /tmp/aws/install"
sudo docker exec -u root jenkins bash -c "wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg && echo 'deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main' > /etc/apt/sources.list.d/trivy.list && apt-get update && apt-get install -y trivy"
sudo chmod 777 /var/run/docker.sock
```

## GitHub Webhook Setup
- [x] Go to repository Settings → Webhooks
- [x] Add webhook: `http://<EC2_IP>:8080/github-webhook/`
- [x] Content type: application/json
- [x] Events: Push events

## Backend Container Deployment
SSH to EC2:
```bash
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 353863292008.dkr.ecr.us-east-1.amazonaws.com

# Get latest image tag from ECR or Jenkins build number
LATEST_TAG=$(aws ecr describe-images --repository-name ctf-platform --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' --output text)

sudo docker pull 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:${LATEST_TAG}

sudo docker rm -f ctf-platform || true

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier ctf-postgres --query 'DBInstances[0].Endpoint.Address' --output text)

sudo docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e DB_HOST=${RDS_ENDPOINT} \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=ctfpassword123 \
  353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:${LATEST_TAG}

# Initialize database (first time only)
sudo docker exec ctf-platform psql -h ${RDS_ENDPOINT} -U ctfadmin -d ctfdb -f init.sql

# Verify
curl http://localhost:3000/health
```

## Frontend Deployment (Manual)
- [x] Copy frontend build to nginx/web server on EC2
- [x] Configure to proxy `/api` requests to backend on 3000
- [x] Set `VITE_API_BASE_URL` environment variable during build

## Verification
- [x] Backend health: `curl http://<EC2_IP>:3000/health`
- [x] Frontend loads: `http://<EC2_IP>/`
- [ ] Login works with credentials
- [ ] Can view challenges and leaderboard
- [ ] Can submit flags (if challenges deployed)

## Monitoring
- [ ] Check Jenkins build logs for any failures
- [ ] Monitor EC2 metrics in CloudWatch
- [ ] Monitor RDS connections
- [ ] Check application logs: `sudo docker logs ctf-platform`

## Cost Optimization
- [ ] Stop EC2 and RDS when not in use
- [ ] Use auto-scaling for production
- [ ] Monitor ECR storage usage

some more text