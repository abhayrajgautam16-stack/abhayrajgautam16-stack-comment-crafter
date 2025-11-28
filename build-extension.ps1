# Build CommentCraft Extension
# This script builds the extension with environment variables

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Environment variables loaded from .env"
} else {
    Write-Host "⚠️  No .env file found"
}

# Build with Vite
Write-Host "🔨 Building extension..."
node node_modules/vite/bin/vite.js build

# Copy additional files
Write-Host "📋 Copying manifest and options files..."
Copy-Item "manifest.json" "dist/manifest.json" -Force
Copy-Item "options.html" "dist/options.html" -Force  
Copy-Item "options.js" "dist/options.js" -Force

Write-Host "✅ Build complete! Extension ready in /dist folder"
Write-Host "📦 Load 'dist' folder in Chrome developer mode"
