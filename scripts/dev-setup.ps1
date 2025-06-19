# ChatOS Development Setup Script
# PowerShell script to automate local development environment setup

param(
    [switch]$SkipInstall,
    [switch]$SkipSupabase,
    [switch]$Help
)

if ($Help) {
    Write-Host "ChatOS Development Setup Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\scripts\dev-setup.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipInstall    Skip npm install step"
    Write-Host "  -SkipSupabase   Skip Supabase setup"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    Write-Host "This script will:"
    Write-Host "  1. Check prerequisites"
    Write-Host "  2. Install dependencies"
    Write-Host "  3. Set up Supabase (if available)"
    Write-Host "  4. Start development server"
    exit 0
}

Write-Host "🚀 ChatOS Development Setup" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node --version
        $versionNumber = [version]($nodeVersion -replace 'v', '')
        $minVersion = [version]"18.0.0"
        
        if ($versionNumber -ge $minVersion) {
            Write-Host "✅ Node.js $nodeVersion (>= 18.0.0)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Node.js $nodeVersion (< 18.0.0 required)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        return $false
    }
}

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

$prereqsPassed = $true

# Check Node.js
if (-not (Test-NodeVersion)) {
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    $prereqsPassed = $false
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $prereqsPassed = $false
}

# Check Git
if (Test-Command "git") {
    Write-Host "✅ Git installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git not found (recommended for version control)" -ForegroundColor Yellow
}

# Check Supabase CLI (optional)
if (Test-Command "supabase") {
    Write-Host "✅ Supabase CLI installed" -ForegroundColor Green
    $supabaseAvailable = $true
} else {
    Write-Host "⚠️  Supabase CLI not found (optional for local development)" -ForegroundColor Yellow
    Write-Host "   Install with: npm install -g supabase" -ForegroundColor Gray
    $supabaseAvailable = $false
}

Write-Host ""

if (-not $prereqsPassed) {
    Write-Host "❌ Prerequisites check failed. Please install missing requirements." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed!" -ForegroundColor Green
Write-Host ""

# Install dependencies
if (-not $SkipInstall) {
    Write-Host "📦 Installing Dependencies..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping dependency installation" -ForegroundColor Yellow
    Write-Host ""
}

# Environment setup
Write-Host "🔧 Environment Setup..." -ForegroundColor Yellow
Write-Host ""

# Check for .env file
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "📋 .env.example available - copy and configure:" -ForegroundColor Cyan
        Write-Host "   copy .env.example .env" -ForegroundColor Gray
        Write-Host "   Then edit .env with your configuration" -ForegroundColor Gray
    }
}

# Check hardcoded Supabase values
Write-Host "⚠️  Note: Supabase URL and keys are currently hardcoded in:" -ForegroundColor Yellow
Write-Host "   - src/lib/supabase/client.ts" -ForegroundColor Gray
Write-Host "   - src/services/aiProviderService.ts" -ForegroundColor Gray
Write-Host "   Consider moving these to environment variables for production" -ForegroundColor Gray
Write-Host ""

# Supabase setup
if ($supabaseAvailable -and -not $SkipSupabase) {
    Write-Host "🗄️  Supabase Setup..." -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path "supabase/config.toml") {
        Write-Host "✅ Supabase config found" -ForegroundColor Green
        
        Write-Host "Starting Supabase local development..." -ForegroundColor Cyan
        try {
            supabase start
            Write-Host "✅ Supabase started successfully!" -ForegroundColor Green
            Write-Host "📊 Supabase Studio: http://localhost:54323" -ForegroundColor Cyan
        }
        catch {
            Write-Host "⚠️  Failed to start Supabase (continuing anyway)" -ForegroundColor Yellow
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Supabase config not found - using remote instance" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Supabase setup" -ForegroundColor Yellow
    Write-Host ""
}

# Development server info
Write-Host "🌐 Development Server Info" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Local URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Network URL: http://[your-ip]:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Scripts:" -ForegroundColor White
Write-Host "  npm run dev     - Start development server" -ForegroundColor Gray
Write-Host "  npm run build   - Build for production" -ForegroundColor Gray
Write-Host "  npm run preview - Preview production build" -ForegroundColor Gray
Write-Host "  npm run lint    - Run ESLint" -ForegroundColor Gray
Write-Host ""

# Testing info
Write-Host "🧪 Testing Information" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before testing, ensure you have:" -ForegroundColor White
Write-Host "  ✅ At least one AI provider API key" -ForegroundColor Gray
Write-Host "  ✅ TESTING_CHECKLIST.md for comprehensive testing" -ForegroundColor Gray
Write-Host "  ✅ Browser DevTools open for monitoring" -ForegroundColor Gray
Write-Host ""
Write-Host "Test both modes:" -ForegroundColor White
Write-Host "  🔓 Guest Mode: Continue as Guest → Add API keys → Test chat" -ForegroundColor Gray
Write-Host "  🔐 Auth Mode: Sign up/Login → Add API keys → Test chat" -ForegroundColor Gray
Write-Host ""

# Network access info
Write-Host "🌍 Network Access" -ForegroundColor Yellow
Write-Host "================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To share local access:" -ForegroundColor White
Write-Host "  1. Find your IP address: ipconfig" -ForegroundColor Gray
Write-Host "  2. Share: http://[your-ip]:8080" -ForegroundColor Gray
Write-Host "  3. Ensure firewall allows port 8080" -ForegroundColor Gray
Write-Host ""
Write-Host "For external testing:" -ForegroundColor White
Write-Host "  • Use ngrok: ngrok http 8080" -ForegroundColor Gray
Write-Host "  • Use localtunnel: npx localtunnel --port 8080" -ForegroundColor Gray
Write-Host ""

# Final instructions
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Configure .env file (if needed)" -ForegroundColor Gray
Write-Host "  2. Start development server: npm run dev" -ForegroundColor Gray
Write-Host "  3. Open http://localhost:8080 in browser" -ForegroundColor Gray
Write-Host "  4. Follow TESTING_CHECKLIST.md for comprehensive testing" -ForegroundColor Gray
Write-Host "  5. Test both guest and authenticated flows" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green

# Ask if user wants to start dev server
Write-Host "Would you like to start the development server now? (y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y' -or $response -eq 'yes') {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host ""
    Write-Host "👍 Run 'npm run dev' when you're ready to start!" -ForegroundColor Cyan
}