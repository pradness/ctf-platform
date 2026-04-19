output "ec2_public_ip" {
  value = aws_instance.ctf_server.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "ecr_platform_url" {
  value = aws_ecr_repository.platform.repository_url
}

output "ecr_sqli_url" {
  value = aws_ecr_repository.sqli.repository_url
}

output "ecr_xss_url" {
  value = aws_ecr_repository.xss.repository_url
}

output "ecr_broken_auth_url" {
  value = aws_ecr_repository.broken_auth.repository_url
}