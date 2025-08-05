#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables for easy modification
BOT_DIR="/home/ec2-user/discord-bot"
NGINX_CONF_SOURCE="$BOT_DIR/deploy_assets/nginx_discord_bot.conf" # Source path on EC2
NGINX_CONF_DEST="/etc/nginx/conf.d/discord-bot.conf"              # Destination for Nginx
DISCORD_BOT_WEB_PORT=3000                                         # Make sure this matches your Node.js app's listen port

echo "--- Starting Deployment for Discord Bot on EC2 Instance ---"

# Ensure application directory exists and has correct permissions (run as root via SSM)
echo "Ensuring application directory exists and has correct permissions: $BOT_DIR"
sudo mkdir -p "$BOT_DIR"
sudo chown -R ec2-user:ec2-user "$BOT_DIR"
echo "Directory $BOT_DIR created/verified and owned by ec2-user."

# --- All Application-Related Steps (Git, npm, .env, PM2, Discord Commands) ---
# These must run as `ec2-user` to ensure correct permissions and environment (NVM, PM2).
# We'll use `su - ec2-user -c` for each logical block.
# The double-quotes around the `su -c` command content are crucial for variable expansion.

echo "Executing application deployment steps as ec2-user..."
su - ec2-user -c "
  cd \"$BOT_DIR\" || { echo \"Failed to change directory to $BOT_DIR as ec2-user\"; exit 1; }
  echo \"Current directory as ec2-user: \$(pwd)\"
  git config --global --add safe.directory \"$BOT_DIR\" || { echo \"Failed to add safe.directory for Git\"; exit 1; }
  echo \"Added $BOT_DIR to Git's safe.directory list.\"
  if [ -d .git ]; then
    echo \"Repository already exists. Pulling latest code from Git...\"
    git pull origin main || { echo \"Git pull failed as ec2-user\"; exit 1; }
  else
    echo \"Repository does not exist. Cloning repository...\"
    git clone \"https://github.com/escuadron-404/kernel-bot.git\" . || {
      echo \"Git clone failed as ec2-user\"
      exit 1
    }
  fi
  echo \"Git operations complete.\"

  # --- Node.js Dependencies ---
  echo \"Installing/updating Node.js dependencies...\"
  npm install || { echo \"npm install failed as ec2-user\"; exit 1; }
  echo \"Node.js dependencies installed.\"

  # --- Environment Variables (.env file) ---
  echo \"Updating .env file with secrets...\"
  echo \"DISCORD_TOKEN=$DISCORD_TOKEN\" >.env
  echo \"CLIENT_ID=$CLIENT_ID\" >>.env
  echo \"GUILD_ID=$GUILD_ID\" >>.env
  echo \"OFFERS_CHANNEL_ID=$OFFERS_CHANNEL_ID\" >>.env
  echo \"DISCORD_BOT_WEB_PORT=$DISCORD_BOT_WEB_PORT\" >>.env
  echo \"Environment variables for Discord bot updated.\"

  # --- PM2 Process Management ---
  echo \"Managing PM2 process for Discord bot...\"
  # Use pm2 restart/start to ensure it's running
  pm2 restart discord-bot || pm2 start ./src/index.js --name discord-bot || {
    echo \"PM2 operation failed for Discord bot\"
    exit 1
  }
  echo \"Discord bot restarted/started with PM2.\"

" || {
  echo "Critical application deployment steps failed as ec2-user. See above errors."
  exit 1
}

# --- Nginx Configuration (requires sudo, so outside the su - ec2-user -c block) ---
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
