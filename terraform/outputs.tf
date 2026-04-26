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

output "private_subnet_id" {
  value = aws_subnet.private.id
}

output "attacker_sg_id" {
  value = aws_security_group.attacker_sg.id
}

output "target_sg_id" {
  value = aws_security_group.target_sg.id
}

output "platform_instance_profile" {
  value = aws_iam_instance_profile.platform_profile.name
}