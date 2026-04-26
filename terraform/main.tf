terraform {
  backend "s3" {
    bucket = "ctf-tf-state-s3-1"
    key    = "ctf/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "ctf-vpc" }
}

# Public subnet — platform EC2 lives here
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags = { Name = "ctf-public-subnet" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  tags = { Name = "ctf-public-subnet-b" }
}

# Private subnet — attacker + target EC2s live here
resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = false
  tags = { Name = "ctf-private-subnet" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "ctf-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "ctf-route-table" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "ec2_sg" {
  name   = "ctf-ec2-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "ctf-ec2-sg" }
}

resource "aws_security_group" "rds_sg" {
  name   = "ctf-rds-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "ctf-rds-sg" }
}

# Attacker SG — SSH from platform EC2 only, all outbound to private subnet
resource "aws_security_group" "attacker_sg" {
  name   = "ctf-attacker-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.3.0/24"]
  }
  tags = { Name = "ctf-attacker-sg" }
}

# Target SG — all traffic from attacker SG only, nothing else
resource "aws_security_group" "target_sg" {
  name   = "ctf-target-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.attacker_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.3.0/24"]
  }
  tags = { Name = "ctf-target-sg" }
}

# EC2 — platform server
resource "aws_instance" "ctf_server" {
  ami                    = "ami-05e86b3611c60b0b4"
  instance_type          = "c7i-flex.large"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = "ctf-key"
  iam_instance_profile   = aws_iam_instance_profile.platform_profile.name

  root_block_device {
    volume_size = 30
  }

  tags = { Name = "ctf-server" }
}

# IAM role — lets platform backend start/stop lab EC2s
resource "aws_iam_role" "platform_role" {
  name = "ctf-platform-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "platform_ec2_policy" {
  name = "ctf-platform-ec2-policy"
  role = aws_iam_role.platform_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances",
        "ec2:RunInstances",
        "ec2:TerminateInstances"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "platform_profile" {
  name = "ctf-platform-profile"
  role = aws_iam_role.platform_role.name
}

# RDS
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "ctf-rds-subnet-group"
  subnet_ids = [aws_subnet.public.id, aws_subnet.public_b.id]
  tags = { Name = "ctf-rds-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "ctf-postgres"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "ctfdb"
  username               = "ctfadmin"
  password               = "ctfpassword123"
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  tags = { Name = "ctf-postgres" }
}

# ECR Repositories
resource "aws_ecr_repository" "platform" {
  name                 = "ctf-platform"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "sqli" {
  name                 = "ctf-sqli"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "xss" {
  name                 = "ctf-xss"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "broken_auth" {
  name                 = "ctf-broken-auth"
  image_tag_mutability = "MUTABLE"
}