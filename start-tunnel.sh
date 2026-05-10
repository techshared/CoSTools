#!/bin/bash
# Start Cloudflare Tunnel for CoSTools
# Run this when WSL starts, or add to Windows startup
nohup cloudflared tunnel run costools > /tmp/cloudflared.log 2>&1 &
echo "Cloudflare Tunnel started. PID: $!"
echo "Web: https://fstool.123tips.cn"
echo "Bot: https://fstool.123tips.cn/webhook/event"
