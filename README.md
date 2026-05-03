# CTF Platform

A self-hosted Capture The Flag platform with DevSecOps infrastructure. Players solve web-based security challenges (SQL Injection, XSS, Broken Auth) running as Docker containers on EC2. The platform provides auth, challenge management, flag submission, leaderboards, and automated CI/CD via Jenkins.

## Architecture

```
AWS (Terraform-provisioned)
├── EC2 (public subnet)
│   ├── Docker containers
│   │   ├── Backend API (port 3000)
│   │   ├── Frontend web app (port 80/443)
│   │   ├── Jenkins (port 8080)
│   │   ├── SonarQube (port 9000)
│   │   └── Challenge containers (custom-sqli, etc)
│   ├── k3s (single-node Kubernetes)
│   │   └── Reserved for future challenge orchestration
│   └── Security groups with ingress rules
├── RDS PostgreSQL (db.t3.micro)
│   └── users, challenges, submissions, leaderboard data
├── ECR — container registry for platform images
├── S3 — Terraform remote state
└── VPC with public subnet
```

## CI/CD Pipeline (Jenkins)

Push to GitHub → Jenkins triggers automatically via webhook:
1. Checkout code from GitHub
2. Docker build — builds backend image from `platform/Dockerfile`
3. Trivy scan — fails pipeline on fixable CRITICAL CVEs
4. Push to ECR — only if Trivy passes

Trivy runs with `--ignore-unfixed` and `--scanners vuln` so base-image advisories that cannot be fixed do not block releases.

## AWS Account Details

- Region: us-east-1
- ECR registry: 353863292008.dkr.ecr.us-east-1.amazonaws.com
- S3 state bucket: ctf-tf-state-s3-1
- EC2 instance ID: i-0850a56073f852159
- EC2 key pair name: ctf-key
- RDS identifier: ctf-postgres
- IAM user: ctf-admin (has EC2, RDS, ECR, S3, IAM full access)
- IAM role on EC2: ctf-platform-role (allows EC2 + ECR actions for pipeline)

## ECR Repositories

- 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform
- 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-sqli
- 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-xss
- 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-broken-auth

## Prerequisites (local machine)

- AWS CLI configured with ctf-admin credentials
- Terraform v1.0+
- Git
- ctf-key.pem (get from the project owner — never committed to repo)

## Environment Configuration

### Backend Environment Variables

Create `.env` in `platform/backend/` with:

```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ctfdb
DB_USER=ctfadmin
DB_PASSWORD=ctfpassword123
```

For AWS production, override with real RDS endpoint.

### Frontend Environment Variables

Create `.env.local` in `platform/frontend/` with:

```
VITE_API_BASE_URL=http://localhost:3000
```

For AWS production, set to the EC2 backend URL.

## From Scratch Setup (if EC2 is destroyed)

Only needed if someone runs terraform destroy. Normal restarts don't need this.

### 1. AWS IAM Setup

IAM user ctf-admin already exists. Get access keys from the project owner.

```bash
aws configure
# Enter Access Key ID, Secret, region us-east-1, output json
aws sts get-caller-identity
# Should show account 353863292008
```

### 2. S3 bucket already exists

Do not recreate it — ctf-tf-state-s3-1 already has the state file.

### 3. Provision Infrastructure

```bash
cd terraform
terraform init
terraform apply
```

Note the new EC2 public IP from outputs.

## Local Development

### Quick Start

1. **Install dependencies:**
   ```bash
   cd platform/backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up database** (PostgreSQL required locally, or use Docker):
   ```bash
   # If using Docker PostgreSQL:
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=ctfpassword123 postgres:15
   
   # Create database and tables:
   psql -h localhost -U postgres -f platform/backend/init.sql
   ```

3. **Start backend:**
   ```bash
   cd platform/backend
   npm start
   ```

4. **Start frontend** (in another terminal):
   ```bash
   cd platform/frontend
   npm run dev
   ```

5. **Access the platform:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Test login with: admin / your-password (or signup new user)

### Production Deployment on AWS

See section: `Deploy the backend container`

```bash
ssh -i ctf-key.pem ubuntu@<EC2_PUBLIC_IP>
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

This installs Docker, k3s, creates namespaces, applies network policies, starts Jenkins and SonarQube, and prints the Jenkins unlock password.

### 4.1 Apply latest Terraform changes

If infrastructure already exists, re-run Terraform after pulling the latest repo so new rules such as backend port `3000` ingress are applied:

```bash
cd terraform
terraform apply
```

### 5. Configure Jenkins

1. Go to http://<EC2_PUBLIC_IP>:8080
2. Enter password printed by setup.sh
3. Install suggested plugins
4. Create admin user (use the same credentials as before)
5. New Item → ctf-pipeline → Pipeline → OK
6. Build Triggers → check GitHub hook trigger for GITScm polling
7. Pipeline → Pipeline script from SCM → Git
8. Repository URL: https://github.com/pradness/ctf-platform
9. Branch: */main
10. Script Path: Jenkinsfile
11. Save

Then add SonarQube credentials:
- Manage Jenkins → Credentials → System → Global → Add Credentials
- Kind: Secret text, Secret: (SonarQube token), ID: sonar-token

Then configure SonarQube server:
- Manage Jenkins → System → SonarQube servers
- Name: sonarqube, URL: http://<EC2_PUBLIC_IP>:9000
- Token: sonar-token

### 6. Install tools inside Jenkins container

```bash
# AWS CLI
sudo docker exec -u root jenkins bash -c "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o /tmp/awscliv2.zip && unzip /tmp/awscliv2.zip -d /tmp && /tmp/aws/install"

# Trivy
sudo docker exec -u root jenkins bash -c "wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg && echo 'deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main' > /etc/apt/sources.list.d/trivy.list && apt-get update && apt-get install -y trivy"

# docker.sock permissions
sudo chmod 777 /var/run/docker.sock
```

### 7. Update GitHub Webhook

Repo → Settings → Webhooks → edit existing webhook:
- Payload URL: http://<NEW_EC2_PUBLIC_IP>:8080/github-webhook/

### 8. Configure SonarQube

1. Go to http://<EC2_PUBLIC_IP>:9000
2. Login: admin / (password set previously)
3. Generate a new token if needed: My Account → Security → Generate Token

### 9. Deploy the backend container

Jenkins currently builds, scans, and pushes the backend image to ECR. To deploy:

SSH to the EC2 instance and run:

```bash
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 353863292008.dkr.ecr.us-east-1.amazonaws.com

sudo docker pull 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<TAG>

sudo docker rm -f ctf-platform || true

sudo docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
   -v /var/run/docker.sock:/var/run/docker.sock \
  --user 0:0 \
  -e PORT=3000 \
  -e PUBLIC_IP=<EC2_PUBLIC_IP> \
  -e CHALLENGE_IMAGE=custom-sqli \
  -e CHALLENGE_PORT_START=4000 \
  -e CHALLENGE_PORT_END=4100 \
  -e DB_PASSWORD=ctfpassword123 \
  353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<TAG>

# Build challenge image on the EC2 host once (or pull from registry)
sudo docker build -t custom-sqli ./platform/custom-sqli
```

Verify:

```bash
curl http://localhost:3000/health
```

## Daily Workflow

### Stopping (minimal cost)

Run on EC2:
```bash
sudo docker stop ctf-platform jenkins sonarqube
exit
```

Then locally:
```bash
aws ec2 stop-instances --instance-ids i-0850a56073f852159
aws rds stop-db-instance --db-instance-identifier ctf-postgres
```

### Starting again

```bash
aws ec2 start-instances --instance-ids i-0850a56073f852159
aws rds start-db-instance --db-instance-identifier ctf-postgres
terraform refresh && terraform output ec2_public_ip
ssh -i ctf-key.pem ubuntu@<NEW_IP>
sudo chmod 777 /var/run/docker.sock
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 353863292008.dkr.ecr.us-east-1.amazonaws.com
sudo docker start jenkins sonarqube
sudo docker start ctf-platform || true
```

If GitHub webhook URL needs updating (EC2 IP changed):
- GitHub repo → Settings → Webhooks → edit
- Payload URL: http://<NEW_EC2_PUBLIC_IP>:8080/github-webhook/

## What Has Been Built

### Complete
- ✅ Terraform provisions AWS infrastructure (EC2, RDS PostgreSQL, VPC, security groups, ECR, S3, IAM)
- ✅ k3s running on EC2 with platform and challenges namespaces
- ✅ Network policies isolating challenges namespace
- ✅ Jenkins running as Docker container with GitHub webhook integration
- ✅ SonarQube running as Docker container
- ✅ Backend API (Express + Node.js)
  - Authentication (signup, login with JWT)
  - Challenge listing and management
  - Flag submission and scoring
  - Leaderboard
  - PostgreSQL database integration
  - Health check endpoint
- ✅ Frontend (React + Vite)
  - Login page
  - Challenge dashboard
  - Leaderboard page
  - Challenge detail and flag submission
  - Protected routes with JWT auth
- ✅ Production Docker image for backend
- ✅ Backend smoke tests
- ✅ CI/CD Pipeline: checkout → Docker build → Trivy vulnerability scan → ECR push
- ✅ API integration between frontend and backend

### Future Enhancements
- XSS challenge container
- Broken Auth challenge container
- Additional web challenge containers
- Kubernetes manifests for automated challenge pod deployment
- Frontend CI/CD and deployment automation

## Project Structure

```
ctf-platform/
├── Jenkinsfile              # CI/CD pipeline — checkout, Docker build, Trivy scan, ECR push
├── setup.sh                 # EC2 bootstrap script
├── README.md
├── terraform/
│   ├── main.tf              # AWS infrastructure as code
│   ├── variables.tf         
│   ├── outputs.tf           # EC2 IP, RDS endpoint, ECR URLs
│   └── .terraform.lock.hcl
├── platform/
│   ├── Dockerfile           # Backend production image
│   ├── .dockerignore
│   ├── backend/             # Express API
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── package.json
│   │   ├── config/          # Database and environment config
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/           # JWT utilities
│   │   └── test/            # Smoke tests
│   ├── frontend/            # React + Vite web app
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── components/  # UI components
│   │       ├── pages/       # Page components
│   │       └── services/    # API client
│   └── custom-sqli/         # SQL Injection challenge
│       ├── app.js
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
```
