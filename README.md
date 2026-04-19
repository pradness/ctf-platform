# ctf-platform
A CTF competition platform for DEVOPS project
checking webhook


Next time you spin up a fresh EC2, just run:
```bash
ssh -i ctf-key.pem ubuntu@<NEW_IP>
curl -o setup.sh https://raw.githubusercontent.com/pradness/ctf-platform/main/setup.sh
chmod +x setup.sh
./setup.sh
```
Then only manual step remaining is the Jenkins UI configuration (creating the job + pointing to repo) which takes 2 minutes. 