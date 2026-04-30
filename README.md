# CTF Platform

A self-hosted Capture The Flag platform combining DevSecOps infrastructure with real machine-access challenges. Players can solve web-based challenges (SQLi, XSS, broken-auth) running as Kubernetes pods, and get full browser terminal access to attack real EC2 machines.

## Architecture

```
AWS (Terraform-provisioned)
├── EC2 c7i-flex.large — platform server (public subnet)
│   ├── k3s (single-node Kubernetes)
│   │   ├── platform namespace   → CTF web app pod
│   │   ├── challenges namespace → SQLi, XSS, broken-auth pods
│   │   └── network policies     → challenges namespace fully isolated
│   ├── Jenkins (Docker container, port 8080)
│   ├── Platform backend (Docker container, port 3000)
│   └── SonarQube (Docker container, port 9000)
├── EC2 attacker (private subnet, stopped by default)
│   └── Ubuntu with nmap, sqlmap, hydra, gobuster preinstalled
├── EC2 targets (private subnet, stopped by default)
│   ├── easy-target
│   ├── medium-target
│   └── hard-target
├── RDS PostgreSQL (db.t3.micro) — users, scores, active_labs
├── ECR — container registry for platform + challenge images
├── S3 — Terraform remote state
└── VPC
    ├── public subnet (10.0.1.0/24, 10.0.2.0/24) → platform EC2
    └── private subnet (10.0.3.0/24)              → attacker + target EC2s
```

## Challenge Types

### Web Challenges (always running as Kubernetes pods)
- SQL Injection — raw SQL with no sanitization
- XSS — comment board with no output encoding
- Broken Auth — hardcoded credentials / weak session tokens

### Machine Challenges (on-demand EC2 pairs)
- Player clicks Start Lab on the platform
- Backend starts attacker EC2 + target EC2 via AWS SDK
- Player gets live terminal in the browser (xterm.js + WebSocket SSH relay)
- Player hacks target over private subnet, finds flag
- Player submits flag → clicks Stop Lab → EC2s stop, billing stops

## CI/CD Pipeline (Jenkins)

Push to GitHub → Jenkins triggers automatically via webhook:
1. Checkout code from GitHub
2. Docker build — builds backend image from `platform/Dockerfile`
3. Trivy scan — fails pipeline on fixable CRITICAL CVEs
4. Push to ECR — only if Trivy passes

Notes:
- Trivy runs with `--ignore-unfixed` and `--scanners vuln` so Debian `will_not_fix` base-image advisories do not block every release forever.
- SonarQube is configured but not yet wired into the pipeline (pending fix).

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
- ctf-key.pem (get from the person who created the project — never committed to repo)

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

### 4. Set Up EC2

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

Jenkins currently builds, scans, and pushes the backend image to ECR. Deployment to the EC2 host is still manual.

Get the live infrastructure values:

```bash
cd terraform
terraform output ec2_public_ip
terraform output rds_endpoint
```

SSH to the EC2 instance and run:

```bash
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 353863292008.dkr.ecr.us-east-1.amazonaws.com

sudo docker pull 353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<TAG>

sudo docker rm -f ctf-platform || true

sudo docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e JWT_SECRET=<JWT_SECRET> \
  -e DB_HOST=<RDS_ENDPOINT_HOSTNAME_ONLY> \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=ctfpassword123 \
  353863292008.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<TAG>
```

Verify on the EC2 host:

```bash
curl http://localhost:3000/health
sudo docker logs ctf-platform --tail 100
```

Verify externally:

```text
http://<EC2_PUBLIC_IP>:3000/health
```

## Daily Workflow

### Stopping (minimal cost)

Run on EC2 first:
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

Then update two places with new IP:
- GitHub webhook URL
- Jenkins → Manage Jenkins → System → SonarQube server URL

Jenkins job config and pipeline history are preserved in the jenkins_home Docker volume — no reconfiguration needed beyond the IP change.

If the backend container was removed instead of stopped, re-run the manual deploy command from `Deploy the backend container`.

## What Has Been Built

### Done
- Terraform provisions all AWS infrastructure from scratch with one command
- VPC with public subnet (platform) and private subnet (attacker/target machines)
- Security groups: platform EC2, RDS (port 5432 from EC2 only), attacker (SSH from platform only), target (all traffic from attacker only), backend port `3000` open on platform EC2
- IAM role on EC2 with EC2 + ECR permissions for the pipeline
- k3s running on EC2 with platform and challenges namespaces
- Network policy isolating challenges namespace — pods cannot reach platform namespace
- Jenkins running as Docker container, connected to GitHub via webhook
- SonarQube running as Docker container
- Platform backend implemented in `platform/backend/` with auth, challenge listing, flag submission, leaderboard, JWT auth middleware, PostgreSQL connection, and `/health` endpoint
- Backend smoke test added with `npm test`
- Production backend Docker image implemented in `platform/Dockerfile`
- CI/CD pipeline: checkout → Docker build → Trivy vulnerability scan → ECR push
- Trivy gating tuned to ignore unfixed base-image advisories while still failing on fixable CRITICAL vulnerabilities
- Backend image can be pulled from ECR and run manually on the EC2 host on port `3000`

### Not Started
- challenges/sqli/ — vulnerable Express app with raw SQL
- challenges/xss/ — comment board with no output encoding
- challenges/broken-auth/ — hardcoded credentials app
- k8s manifests for deploying challenge pods to challenges namespace
- lab-machines/attacker/setup.sh — installs pentesting tools on Ubuntu
- lab-machines/targets/easy/setup.sh — vulnerable PHP app + weak SSH
- platform/frontend/ — HTML/React: challenge list, leaderboard, xterm.js browser terminal
- Backend deployment automation from Jenkins to EC2
- OWASP ZAP stage in Jenkinsfile
- SonarQube properly wired into pipeline (currently hanging issue — needs fix)

## Project Structure

```
ctf-platform/
├── Jenkinsfile              # CI/CD pipeline — checkout, Docker build, Trivy, ECR push
├── setup.sh                 # EC2 bootstrap — Docker, k3s, namespaces, Jenkins, SonarQube
├── README.md
├── terraform/
│   ├── main.tf              # All AWS resources
│   ├── variables.tf         # Empty for now
│   ├── outputs.tf           # EC2 IP, RDS endpoint, ECR URLs, subnet/SG IDs
│   └── .terraform.lock.hcl
├── platform/
│   ├── Dockerfile           # Backend production image (Node 20 slim)
│   ├── .dockerignore        # Keeps local modules/secrets out of Docker context
│   ├── backend/             # Express API + tests
│   └── frontend/            # NOT YET BUILT
├── challenges/
│   ├── sqli/                # NOT YET BUILT
│   ├── xss/                 # NOT YET BUILT
│   └── broken-auth/         # NOT YET BUILT
└── lab-machines/
    ├── attacker/
    │   └── setup.sh         # NOT YET BUILT
    └── targets/
        ├── easy/
        │   └── setup.sh     # NOT YET BUILT
        ├── medium/
        │   └── setup.sh     # NOT YET BUILT
        └── hard/
            └── setup.sh     # NOT YET BUILT
```

## Progress

- [x] Day 1 — Terraform + AWS infra (VPC, EC2, RDS, ECR, S3, security groups, IAM)
- [x] Day 2 — k3s + Kubernetes namespaces + network policies
- [x] Day 3 — Jenkins + SonarQube + GitHub webhook
- [x] Day 4 — Pipeline: Docker build + Trivy CVE scan + ECR push
- [x] Day 4.5 — Backend image hardening + Trivy policy tuning
- [ ] Day 5 — Web challenge containers (SQLi, XSS, broken-auth)
- [ ] Day 6 — Deploy challenges to k3s
- [ ] Day 7 — Lab machine setup (attacker + target AMIs)
- [x] Day 8 — Platform backend (auth, leaderboard, flag submission, health check)
- [ ] Day 9 — Platform frontend (challenge list, browser terminal)
- [ ] Day 10 — OWASP ZAP + SonarQube fix + backend deployment automation
