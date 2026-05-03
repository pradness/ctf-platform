# Setup Guide

This guide is for anyone who wants to host their own instance of CTF Platform.

It is based on the deployment notes in this repository and keeps the public README focused on the architecture and project overview.

## What You Need

- AWS account with permissions for EC2, RDS, ECR, IAM, VPC, S3, and CloudWatch.
- Terraform installed locally.
- Git and SSH access to the host EC2 instance.
- Docker available on the EC2 host after bootstrap.
- A GitHub repository for the code and webhook integration.

## Architecture Summary

- One public EC2 instance hosts the platform runtime and the DevOps tools.
- PostgreSQL runs in AWS RDS.
- Backend images are stored in ECR.
- Terraform stores remote state in S3.
- Jenkins is triggered by GitHub webhooks and uses Trivy for image scanning.
- Challenge containers are started from the backend and exposed on dynamic host ports.

## 1. Provision AWS Infrastructure

Run Terraform from the repo root:

```bash
cd terraform
terraform init
terraform apply
```

After apply finishes, note the EC2 public IP and the RDS endpoint from the outputs.

If you are reusing an existing environment, re-run Terraform after code changes so security groups and infrastructure updates stay in sync.

## 2. Bootstrap The EC2 Host

SSH into the EC2 instance and run the bootstrap script from the repository or from your deployment source:

```bash
ssh -i ctf-key.pem ubuntu@<EC2_PUBLIC_IP>
chmod +x setup.sh
sudo ./setup.sh
```

This host setup installs the runtime dependencies used by the platform, including Docker, Jenkins, SonarQube, and the additional orchestration pieces needed for challenge isolation.

## 3. Configure Jenkins

Open Jenkins in the browser at http://<EC2_PUBLIC_IP>:8080 and finish the initial setup.

Then create a pipeline job that uses Jenkinsfile from the repository.

Recommended settings:

- Enable the GitHub webhook trigger.
- Point the pipeline at the main branch.
- Use the repository’s Jenkinsfile as the pipeline definition.
- Add a Secret Text credential for the SonarQube token if you use SonarQube in your workflow.

If Jenkins is running inside Docker, make sure it has access to the Docker socket so it can build and run images.

## 4. Install The CI Tools On The Host

The deployment notes install AWS CLI and Trivy inside the Jenkins container. Keep those tools available if you want the pipeline to match the repo behavior.

The important pieces are:

- AWS CLI for pushing images to ECR.
- Trivy for vulnerability scanning.
- Docker socket access for builds and deployments.

## 5. Deploy The Backend

The backend is the main runtime for the platform. It exposes authentication, challenge listing, challenge container control, flag submission, and the leaderboard API.

Typical runtime environment variables:

```bash
PORT=3000
JWT_SECRET=<your-secret>
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=ctfdb
DB_USER=ctfadmin
DB_PASSWORD=<your-db-password>
PUBLIC_IP=<ec2-public-ip>
CHALLENGE_IMAGE=custom-sqli
CHALLENGE_PORT_START=4000
CHALLENGE_PORT_END=4100
```

Pull and run the backend image from ECR after Jenkins publishes it:

```bash
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
sudo docker pull <account>.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<tag>
sudo docker rm -f ctf-platform || true
sudo docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PORT=3000 \
  -e PUBLIC_IP=<ec2-public-ip> \
  -e CHALLENGE_IMAGE=custom-sqli \
  -e CHALLENGE_PORT_START=4000 \
  -e CHALLENGE_PORT_END=4100 \
  -e JWT_SECRET=<your-secret> \
  -e DB_HOST=<rds-endpoint> \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=<your-db-password> \
  <account>.dkr.ecr.us-east-1.amazonaws.com/ctf-platform:<tag>
```

Verify the backend with:

```bash
curl http://localhost:3000/health
```

## 6. Deploy Challenge Images

The backend expects challenge targets to be available as Docker images. The repository includes a standalone SQL injection target in platform/custom-sqli.

Build it on the host if you are not pulling it from a registry:

```bash
cd platform/custom-sqli
sudo docker build -t custom-sqli .
```

The backend launches containers with the flag injected as an environment variable and maps them to a free port in the configured range.

## 7. Configure The Frontend

The frontend is a Vite app. Set its API base URL before building or serving it:

```bash
VITE_API_BASE_URL=http://<ec2-public-ip>:3000
```

The app uses this value to call the backend routes for login, challenges, container control, submissions, and leaderboard data.

## 8. Hook Up GitHub Webhooks

Update the repository webhook so Jenkins can receive push events:

```text
http://<EC2_PUBLIC_IP>:8080/github-webhook/
```

If the EC2 public IP changes, update the webhook target as well.

## 9. Validate The Deployment

Check the following after everything starts:

- http://<EC2_PUBLIC_IP>:3000/health returns OK.
- Jenkins opens on port 8080.
- SonarQube opens on port 9000 if enabled.
- The frontend can authenticate against the backend.
- Challenge containers start and stop correctly from the dashboard.
- The leaderboard returns data from PostgreSQL.

## 10. Common Troubleshooting

- If challenge start fails, confirm that the backend container can access /var/run/docker.sock.
- If Jenkins cannot push to ECR, recheck AWS credentials and the IAM role attached to the EC2 instance.
- If the frontend cannot reach the backend, confirm VITE_API_BASE_URL and the EC2 security group rules.
- If the leaderboard is empty, verify the PostgreSQL tables were initialized and that submissions exist.

## Reference Files

- terraform/main.tf defines the AWS infrastructure.
- Jenkinsfile defines the CI/CD pipeline.
- DEPLOYMENT.md contains the more operational deployment checklist.
- platform/backend/init.sql initializes the database schema.