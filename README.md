# CTF Platform

A self-hosted Capture The Flag platform with intentionally vulnerable challenge containers, deployed on AWS using Terraform, Kubernetes (k3s), Jenkins CI/CD, and SonarQube.

## Architecture

- **EC2** (c7i-flex.large, 4GB RAM, Ubuntu 22) — runs everything
- **k3s** — single-node Kubernetes on EC2
- **RDS** (PostgreSQL) — stores users, scores, flags
- **ECR** — container registry for platform + challenge images
- **Jenkins** — CI/CD pipeline (runs as Docker container on EC2)
- **SonarQube** — static code analysis (runs as Docker container on EC2)
- **S3** — Terraform remote state

## Prerequisites

Install these on your local machine before starting:

- [AWS CLI](https://aws.amazon.com/cli/)
- [Terraform](https://developer.hashicorp.com/terraform/install) v1.0+
- Git

## From Scratch Setup

### 1. AWS Setup

1. Create an AWS account
2. Create an IAM user `ctf-admin` with these policies:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonS3FullAccess`
3. Create access keys for the IAM user and download the CSV
4. Configure AWS CLI:
```bash
aws configure
# Enter Access Key ID, Secret, region (us-east-1), output (json)
```
5. Verify:
```bash
aws sts get-caller-identity
```

### 2. Create EC2 Key Pair

```bash
aws ec2 create-key-pair --key-name ctf-key --query "KeyMaterial" --output text > ctf-key.pem
```

Store `ctf-key.pem` locally in a safe place (e.g. `~/.ssh/`). Never commit it to GitHub.

### 3. Create S3 Bucket for Terraform State

This must be done manually before Terraform runs:

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

Note the outputs — you'll need them:
- `ec2_public_ip`
- `rds_endpoint`
- `ecr_*_url`

### 5. Set Up EC2 (k3s + Jenkins + SonarQube)

SSH into EC2:
```bash
ssh -i ctf-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Download and run the setup script:
```bash
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh
./setup.sh
```

This script:
- Installs Docker
- Installs k3s
- Creates `platform` and `challenges` namespaces
- Applies network policies
- Starts Jenkins on port 8080
- Starts SonarQube on port 9000
- Prints the Jenkins unlock password at the end

### 6. Configure Jenkins

1. Go to `http://<EC2_PUBLIC_IP>:8080`
2. Enter the password printed by the setup script
3. Install suggested plugins
4. Create an admin user
5. New Item → name it `ctf-pipeline` → select Pipeline → OK
6. Build Triggers → check **GitHub hook trigger for GITScm polling**
7. Pipeline → Pipeline script from SCM → Git
8. Repository URL: `https://github.com/pradness/ctf-platform`
9. Branch: `*/main`
10. Script Path: `Jenkinsfile`
11. Save

### 7. Configure SonarQube

1. Go to `http://<EC2_PUBLIC_IP>:9000`
2. Login: `admin` / `admin`
3. Change the password when prompted

### 8. Add GitHub Webhook

In your GitHub repo → Settings → Webhooks → Add webhook:
- Payload URL: `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
- Content type: `application/json`
- Event: Just the push event

## Daily Workflow

### Stopping (zero cost)
```bash
# Exit SSH first
exit

# Destroy all AWS resources
cd terraform
terraform destroy
```

### Starting again
```bash
cd terraform
terraform apply
# Note the new EC2_PUBLIC_IP from outputs

ssh -i ctf-key.pem ubuntu@<NEW_EC2_PUBLIC_IP>
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh
./setup.sh
```

Then reconfigure the Jenkins job (Step 6 above) with the new IP.

## Project Structure

```
ctf-platform/
├── Jenkinsfile          # CI/CD pipeline definition
├── setup.sh             # EC2 bootstrap script
├── README.md
└── terraform/
    ├── main.tf          # All AWS resources
    ├── variables.tf
    ├── outputs.tf
    └── .terraform.lock.hcl
```

## Progress

- [x] Day 1 — Terraform + AWS infra
- [x] Day 2 — k3s + Kubernetes namespaces + network policies
- [x] Day 3 — Jenkins + SonarQube + GitHub webhook
- [ ] Day 4 — Pipeline stages: SonarQube scan + Docker build + Trivy + ECR push
- [ ] Day 5 — Challenge containers (SQLi, XSS, broken-auth)
- [ ] Day 6 — Deploy challenges to k3s
- [ ] Day 7 — Platform backend
- [ ] Day 8 — Platform frontend + full deploy
- [ ] Day 9 — DAST (OWASP ZAP) + full pipeline
- [ ] Day 10 — Harden + demo prep