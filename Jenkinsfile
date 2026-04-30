pipeline {
    agent any

    environment {
        AWS_REGION   = 'us-east-1'
        ECR_REGISTRY = '353863292008.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_NAME   = 'ctf-platform'
        IMAGE_TAG    = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build -t ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                        -f platform/Dockerfile platform/
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    trivy image \
                        --exit-code 1 \
                        --severity CRITICAL \
                        --ignore-unfixed \
                        --scanners vuln \
                        --no-progress \
                        ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed'
        }
        success {
            echo "Image ${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} pushed to ECR"
        }
    }
}
