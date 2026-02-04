# Alpha-Orion Development Environment Fixer (PowerShell)
# Diagnoses and helps resolve issues with gcloud, terraform, and shellcheck.

$ErrorActionPreference = "SilentlyContinue"

function Write-Log { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

function Check-GCloud {
    Write-Log "Checking for Google Cloud SDK (gcloud)..."
    if (Get-Command gcloud) {
        Write-Success "gcloud is already in your PATH."
        return
    }

    Write-Warning "gcloud not found in PATH. Searching for standard installations..."
    
    $pathsToCheck = @(
        "${env:ProgramFiles(x86)}\Google\Cloud SDK\google-cloud-sdk\bin",
        "${env:ProgramFiles}\Google\Cloud SDK\google-cloud-sdk\bin",
        "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin",
        "C:\google-cloud-sdk\bin"
    )

    $gcloudPath = $null
    foreach ($path in $pathsToCheck) {
        if (Test-Path $path) {
            $gcloudPath = $path
            break
        }
    }

    if ($null -eq $gcloudPath) {
        Write-Error "Could not auto-detect Google Cloud SDK location."
        Write-Host "👉 Please install it from: https://cloud.google.com/sdk/docs/install"
    } else {
        Write-Success "Found SDK at: $gcloudPath"
        
        # Add to current session
        $env:PATH += ";$gcloudPath"
        
        # Add to user environment permanently
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentPath -notlike "*$gcloudPath*") {
            Write-Warning "Adding Google Cloud SDK to your User PATH..."
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$gcloudPath", "User")
            Write-Success "Successfully updated your User PATH."
            Write-Host "👉 Restart your terminal to apply changes permanently."
        } else {
            Write-Success "Your User PATH already includes the Google Cloud SDK path."
        }
    }
}

function Check-Terraform {
    Write-Log "Checking for Terraform..."
    if (Get-Command terraform) {
        Write-Success "Terraform is installed."
    } else {
        Write-Error "Terraform is not installed."
        Write-Warning "This is required for infrastructure deployment."
        Write-Host "👉 Please install it from: https://developer.hashicorp.com/terraform/downloads"
    }
}

function Check-ShellCheck {
    Write-Log "Checking for ShellCheck (for VS Code extension)..."
    if (Get-Command shellcheck) {
        Write-Success "ShellCheck is installed."
    } else {
        Write-Error "ShellCheck is not installed."
        Write-Warning "This is required for the ShellCheck VS Code extension."
        Write-Host "👉 To fix this, run one of the following in PowerShell (Admin):"
        Write-Warning "Note: The package manager may first update itself, which can take a few minutes. Please be patient."
        
        if (Get-Command choco) {
            Write-Success "Chocolatey is installed. Run:"
            Write-Host "   choco install shellcheck" -ForegroundColor Green
        } elseif (Get-Command scoop) {
            Write-Success "Scoop is installed. Run:"
            Write-Host "   scoop install shellcheck" -ForegroundColor Green
        } else {
            Write-Warning "Package manager not found."
            Write-Host "   1. Install Chocolatey: https://chocolatey.org/install"
            Write-Host "   2. Then run: choco install shellcheck"
        }
    }
}

Write-Host "🚀 Alpha-Orion Development Environment Diagnostics"
Write-Host "================================================="
Check-GCloud
Write-Host "-------------------------------------------------"
Check-Terraform
Write-Host "-------------------------------------------------"
Check-ShellCheck
Write-Host "================================================="
Write-Success "Diagnostics complete."