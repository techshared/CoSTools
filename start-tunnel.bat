@echo off
REM Start Cloudflare Tunnel for CoSTools
REM Place this in Windows Startup folder (shell:startup) to auto-start on boot

echo Starting Cloudflare Tunnel for CoSTools...
wsl cloudflared tunnel run costools
echo Tunnel stopped.
