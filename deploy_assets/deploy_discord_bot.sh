#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables for easy modification
BOT_DIR="/home/ec2-user/discord-bot"
NGINX_CONF_SOURCE="$BOT_DIR/deploy_assets/nginx_discord_bot.conf" # Source path on EC2
NGINX_CONF_DEST="/etc/nginx/conf.d/discord-bot.conf"              # Destination for Nginx
DISCORD_BOT_WEB_PORT=3000                                         # Make sure this matches your Node.js app's listen port

echo "--- Starting Deployment for Discord Bot on EC2 Instance ---"

# --- Source NVM for Node.js/npm commands ---
# This ensures Node.js and npm are in the PATH for the ec2-user.
# The `ec2-user` must execute this section.
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
echo "NVM sourced for ec2-user."

# --- Application Deployment ---
echo "Creating application directory if it doesn't exist: $BOT_DIR"
mkdir -p "$BOT_DIR"
cd "$BOT_DIR" || {
  echo "Failed to change directory to $BOT_DIR"
  exit 1
}
echo "Current directory: $(pwd)"

echo "Pulling latest code from Git..."
git pull origin main || {
  echo "Git pull failed"
  exit 1
}

echo "Installing/updating Node.js dependencies..."
npm install || {
  echo "npm install failed"
  exit 1
}

# --- Environment Variables (.env file) ---
# IMPORTANT: Secrets are passed as environment variables to this script
# from the GitHub Actions runner. We write them to the .env file here.
echo "Updating .env file with secrets..."
echo "BOT_TOKEN=$BOT_TOKEN" >.env
echo "CLIENT_ID=$CLIENT_ID" >>.env
echo "GUILD_ID=$GUILD_ID" >>.env # Optional
echo "DISCORD_BOT_WEB_PORT=$DISCORD_BOT_WEB_PORT" >>.env
echo "Environment variables for Discord bot updated."

# --- PM2 Process Management ---
echo "Managing PM2 process for Discord bot..."
# Run PM2 commands as the ec2-user, since PM2 is setup for that user.
# `su - ec2-user -c` executes the command as ec2-user within their login environment.
su - ec2-user -c "cd $BOT_DIR && pm2 restart index.js --name \"discord-bot\" || pm2 start index.js --name \"discord-bot\"" || {
  echo "PM2 operation failed for Discord bot"
  exit 1
}
echo "Discord bot restarted/started with PM2."

# --- Discord Slash Commands Reload ---
echo "Reloading Discord slash commands..."
su - ec2-user -c "node $BOT_DIR/scripts/deploy-commands.js" || {
  echo "Discord command deployment failed"
  exit 1
}
echo "Discord commands reloaded."

# --- Nginx Configuration ---
echo "Copying Nginx configuration snippet..."
sudo cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" || {
  echo "Failed to copy Nginx config"
  exit 1
}
echo "Nginx config snippet copied from $NGINX_CONF_SOURCE to $NGINX_CONF_DEST."

echo "Testing Nginx configuration..."
if sudo nginx -t; then
  echo "Nginx configuration valid. Reloading Nginx..."
  sudo systemctl reload nginx || {
    echo "Nginx reload failed."
    exit 1
  }
  echo "Nginx reloaded successfully."
else
  echo "Nginx configuration test failed. Check logs."
  exit 1 # Fail the script if Nginx config is bad
fi

echo "--- Discord Bot Deployment Complete! ---"
