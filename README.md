
# CTF Platform

A self-hosted Capture The Flag platform combining DevSecOps infrastructure with real machine-access challenges. Players can solve web-based challenges (SQLi, XSS, broken-auth) and get full browser terminal access to attack real machines.

## Architecture

```
AWS (Terraform-provisioned)
├── EC2 c7i-flex.large — platform server (public subnet)
│   └── k3s
│       ├── platform namespace  → CTF web app
│       ├── challenges namespace → SQLi, XSS, broken-auth pods
│       └── Jenkins + SonarQube  → Docker containers
├── EC2 attacker (private subnet, stopped by default)
│   └── Kali-style Ubuntu — nmap, sqlmap, hydra, gobuster
├── EC2 targets (private subnet, stopped by default)
│   ├── easy-target
│   ├── medium-target
│   └── hard-target
├── RDS PostgreSQL — users, scores, active_labs
├── ECR — platform + challenge images
├── S3 — Terraform state
└── VPC
    ├── public subnet  → platform EC2
    └── private subnet → attacker + target EC2s
```

## Challenge Types

### Web Challenges (always running, Kubernetes pods)
- SQL Injection
- Cross-Site Scripting (XSS)
- Broken Authentication

### Machine Challenges (on-demand EC2 pairs)
- Player clicks Start Lab
- Attacker EC2 + Target EC2 start up (~45 seconds)
- Player gets live Kali terminal in the browser via WebSocket SSH
- Player hacks the target over the private subnet
- Player submits flag → clicks Stop Lab → EC2s stop

## Prerequisites

- AWS CLI configured
- Terraform v1.0+
- Git

## From Scratch Setup

### 1. AWS IAM Setup

Create IAM user `ctf-admin` with these policies:
- `AmazonEC2FullAccess`
- `AmazonRDSFullAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonS3FullAccess`

```bash
aws configure
aws sts get-caller-identity
```

### 2. Create EC2 Key Pair

```bash
aws ec2 create-key-pair --key-name ctf-key --query "KeyMaterial" --output text > ctf-key.pem
```

Store `ctf-key.pem` in `~/.ssh/`. Never commit it.

### 3. Create S3 Bucket for Terraform State

```bash
aws s3api create-bucket --bucket ctf-tf-state-s3-1 --region us-east-1
aws s3api put-bucket-versioning --bucket ctf-tf-state-s3-1 --versioning-configuration Status=Enabled
```

### 4. Provision Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Note the outputs — needed for every subsequent step.

### 5. Set Up EC2

```bash
ssh -i ctf-key.pem ubuntu@<EC2_PUBLIC_IP>
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh
./setup.sh
```

### 6. Configure Jenkins

1. Go to `http://<EC2_PUBLIC_IP>:8080`
2. Enter password printed by setup.sh
3. Install suggested plugins
4. Create admin user
5. New Item → `ctf-pipeline` → Pipeline → OK
6. Build Triggers → GitHub hook trigger for GITScm polling
7. Pipeline → Pipeline script from SCM → Git
8. Repository URL: `https://github.com/pradness/ctf-platform`
9. Branch: `*/main` → Save

### 7. Configure SonarQube

1. Go to `http://<EC2_PUBLIC_IP>:9000`
2. Login: `admin` / `admin` → change password

### 8. GitHub Webhook

Repo → Settings → Webhooks → Add webhook:
- Payload URL: `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
- Content type: `application/json`
- Event: push only

## Daily Workflow

```bash
# Stop everything (zero cost)
terraform destroy

# Start again
terraform apply
ssh -i ctf-key.pem ubuntu@<NEW_EC2_PUBLIC_IP>
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh && ./setup.sh
```

Reconfigure Jenkins job with new IP after each restart.

## Project Structure

```
ctf-platform/
├── Jenkinsfile
├── setup.sh
├── README.md
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── .terraform.lock.hcl
├── platform/
│   ├── Dockerfile
│   ├── backend/
│   │   ├── index.js
│   │   ├── db.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── challenges.js
│   │       ├── leaderboard.js
│   │       └── labs.js
│   └── frontend/
│       ├── index.html
│       └── Terminal.jsx
├── challenges/
│   ├── sqli/
│   ├── xss/
│   └── broken-auth/
└── lab-machines/
    ├── attacker/
    │   └── setup.sh
    └── targets/
        ├── easy/
        │   └── setup.sh
        ├── medium/
        │   └── setup.sh
        └── hard/
            └── setup.sh
```

## Progress

- [x] Day 1 — Terraform + AWS infra
- [x] Day 2 — k3s + Kubernetes namespaces + network policies
- [x] Day 3 — Jenkins + SonarQube + GitHub webhook
- [ ] Day 4 — Pipeline stages: SonarQube + Docker + Trivy + ECR
- [ ] Day 5 — Web challenge containers
- [ ] Day 6 — Deploy web challenges to k3s
- [ ] Day 7 — Lab machine setup (attacker + target AMIs)
- [ ] Day 8 — Platform backend (auth, challenges, labs, WebSocket SSH)
- [ ] Day 9 — Platform frontend (challenge list, browser terminal)
- [ ] Day 10 — Full pipeline + DAST + hardening