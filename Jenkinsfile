stage('SonarQube Scan') {
    steps {
        withSonarQubeEnv('sonarqube') {
            sh '''
                docker run --rm \
                    -e SONAR_HOST_URL="${SONAR_HOST_URL}" \
                    -e SONAR_TOKEN="${SONAR_AUTH_TOKEN}" \
                    -v "${WORKSPACE}:/usr/src" \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=ctf-platform \
                    -Dsonar.sources=. \
                    -Dsonar.text.exclusions="**/*" \
                    -Dsonar.exclusions="**/*.zip,**/*.tar,**/*.gz"
            '''
        }
    }
}