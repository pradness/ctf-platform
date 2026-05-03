#!/bin/bash
set -e

ECR_REGISTRY="353863292008.dkr.ecr.us-east-1.amazonaws.com"
AWS_REGION="us-east-1"
DB_HOST="ctf-postgres.cmv86oiq0o6f.us-east-1.rds.amazonaws.com"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com | tr -d '\n')
CHALLENGE_IMAGE="custom-sqli"

echo ">>> Installing Docker..."
sudo apt-get update -y
sudo apt-get install -y docker.io unzip curl
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
sudo chmod 777 /var/run/docker.sock

echo ">>> Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install

echo ">>> Installing k3s..."
curl -sfL https://get.k3s.io | sh -
sleep 30
sudo kubectl get nodes

echo ">>> Creating namespaces..."
sudo kubectl create namespace platform --dry-run=client -o yaml | sudo kubectl apply -f -
sudo kubectl create namespace challenges --dry-run=client -o yaml | sudo kubectl apply -f -

echo ">>> Applying network policies..."
cat <<EOF | sudo kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: isolate-challenges
  namespace: challenges
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: challenges
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: challenges
EOF

cat <<EOF | sudo kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-only
  namespace: platform
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
EOF

echo ">>> Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | sudo docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo ">>> Getting latest ctf-platform image tag..."
LATEST_TAG=$(aws ecr describe-images \
  --repository-name ctf-platform \
  --region ${AWS_REGION} \
  --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' \
  --output text)

echo ">>> Removing old ctf-platform container..."
sudo docker rm -f ctf-platform || true

echo ">>> Starting ctf-platform (tag: ${LATEST_TAG})..."
sudo docker run -d \
  --name ctf-platform \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --user 0:0 \
  -e PORT=3000 \
  -e PUBLIC_IP=${PUBLIC_IP} \
  -e CHALLENGE_IMAGE=${CHALLENGE_IMAGE} \
  -e CHALLENGE_PORT_START=4000 \
  -e CHALLENGE_PORT_END=4100 \
  -e DB_HOST=${DB_HOST} \
  -e DB_PORT=5432 \
  -e DB_NAME=ctfdb \
  -e DB_USER=ctfadmin \
  -e DB_PASSWORD=ctfpassword123 \
  -e JWT_SECRET=supersecretkey123 \
  ${ECR_REGISTRY}/ctf-platform:${LATEST_TAG}

if [ -d "platform/custom-sqli" ]; then
  echo ">>> Building challenge image (${CHALLENGE_IMAGE})..."
  sudo docker build -t ${CHALLENGE_IMAGE} ./platform/custom-sqli
else
  echo ">>> Skipping challenge image build (platform/custom-sqli not found)"
fi

sleep 5
curl http://localhost:3000/health && echo ">>> Backend is up!" || echo ">>> Backend health check failed"

echo ">>> Starting Jenkins..."
sudo docker run -d \
  --name jenkins \
  --restart=unless-stopped \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  jenkins/jenkins:lts

echo ">>> Starting SonarQube..."
sudo docker run -d \
  --name sonarqube \
  --restart=unless-stopped \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:community

echo ">>> Waiting for Jenkins to start..."
sleep 30

echo ">>> Installing AWS CLI inside Jenkins..."
sudo docker exec -u root jenkins bash -c "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o /tmp/awscliv2.zip && unzip /tmp/awscliv2.zip -d /tmp && /tmp/aws/install"

echo ">>> Installing Trivy inside Jenkins..."
sudo docker exec -u root jenkins bash -c "apt-get update -y && apt-get install -y wget gpg && wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg && echo 'deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main' > /etc/apt/sources.list.d/trivy.list && apt-get update && apt-get install -y trivy"

echo ">>> Jenkins initial admin password:"
sudo docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

echo ""
echo ">>> Done."
echo "    Backend:   http://<EC2_IP>:3000/health"
echo "    Jenkins:   http://<EC2_IP>:8080"
echo "    SonarQube: http://<EC2_IP>:9000"