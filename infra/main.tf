provider "aws" {
  region = "us-east-1"
}

resource "aws_iam_role" "ec2_ssm_role" {
  name = "backend-404-ec2-ssm-role" 
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" } }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "ssm_managed_policy" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_instance_profile" "ec2_ssm_profile" {
  name = "backend-404-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm_role.name
}

resource "aws_security_group" "backend_sg" {
  name        = "backend-404-web-sg-no-ssh" 
  description = "Allow HTTP, HTTPS inbound for shared backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "backend-404-sg" }
}

data "aws_vpc" "default" { default = true }

resource "aws_instance" "backend_404" {
  ami           = "ami-022bbd2ccaf21691f"
  instance_type = "t4g.nano" 

  security_groups      = [aws_security_group.backend_sg.name]
  iam_instance_profile = aws_iam_instance_profile.ec2_ssm_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y git nginx # Install Nginx here
              systemctl enable nginx && systemctl start nginx # Enable Nginx

              # Install Node.js using NVM (recommended for Node projects)
              curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
              . ~/.nvm/nvm.sh
              nvm install --lts # Install the latest LTS version
              nvm use --lts     # Use the latest LTS version
              npm install -g pm2 # Install PM2 globally

              # Create base directories for applications, owned by ec2-user
              mkdir -p /home/ec2-user/discord-bot
              mkdir -p /home/ec2-user/web-backend # Directory for your other project
              chown -R ec2-user:ec2-user /home/ec2-user/discord-bot /home/ec2-user/web-backend
              EOF

  tags = {
    Name = "Backend404Instance"
  }
}

output "instance_public_ip" {
  value = aws_instance.backend_404.public_ip
}
