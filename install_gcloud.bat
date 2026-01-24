@echo off
echo 🚀 Downloading and launching Google Cloud SDK Installer...
echo This will open the official Google Cloud installer window.
powershell -Command "Invoke-WebRequest -Uri https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe -OutFile $env:TEMP\GoogleCloudSDKInstaller.exe; Start-Process $env:TEMP\GoogleCloudSDKInstaller.exe"
echo.
echo ⚠️  Please follow the installer prompts.
echo 🔄 After installation, CLOSE and REOPEN your terminal to use 'gcloud'.
pause