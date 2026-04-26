#!/bin/bash
set -e

echo ">>> Installing Docker..."
sudo apt-get update -y
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

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

echo ">>> Starting Jenkins..."
sudo docker run -d \
  --name jenkins \
  --restart=unless-stopped \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
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
echo ">>> Jenkins initial admin password:"
sudo docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

echo ">>> Done. Jenkins: http://<EC2_IP>:8080 | SonarQube: http://<EC2_IP>:9000"