# Get Network Information for Local Development Sharing
# PowerShell script to display network information for sharing local development server

Write-Host "🌐 ChatOS Network Information" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""

# Get local IP addresses
Write-Host "📡 Local IP Addresses:" -ForegroundColor Yellow
Write-Host ""

try {
    # Get all network adapters with IP addresses
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -ne '127.0.0.1' -and 
        $_.IPAddress -ne '169.254.*' -and
        $_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual'
    }
    
    if ($adapters.Count -eq 0) {
        Write-Host "❌ No network adapters found with valid IP addresses" -ForegroundColor Red
    } else {
        foreach ($adapter in $adapters) {
            $interfaceAlias = (Get-NetIPAddress -IPAddress $adapter.IPAddress).InterfaceAlias
            Write-Host "  📍 $($adapter.IPAddress) ($interfaceAlias)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Error getting network information: $($_.Exception.Message)" -ForegroundColor Red
    
    # Fallback to ipconfig
    Write-Host "🔄 Trying alternative method..." -ForegroundColor Yellow
    try {
        $ipconfig = ipconfig | Select-String "IPv4 Address"
        if ($ipconfig) {
            Write-Host "  From ipconfig:" -ForegroundColor Gray
            foreach ($line in $ipconfig) {
                $ip = ($line -split ':')[1].Trim()
                if ($ip -ne '127.0.0.1') {
                    Write-Host "  📍 $ip" -ForegroundColor Cyan
                }
            }
        }
    } catch {
        Write-Host "❌ Could not determine IP address" -ForegroundColor Red
    }
}

Write-Host ""

# Development server URLs
Write-Host "🚀 Development Server URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Local:    http://localhost:8080" -ForegroundColor Green
Write-Host "  Local:    http://127.0.0.1:8080" -ForegroundColor Green

# Network URLs for each IP
try {
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -ne '127.0.0.1' -and 
        $_.IPAddress -notlike '169.254.*'
    }
    
    foreach ($adapter in $adapters) {
        Write-Host "  Network:  http://$($adapter.IPAddress):8080" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  Network:  http://[your-ip]:8080" -ForegroundColor Cyan
}

Write-Host ""

# Firewall information
Write-Host "🔥 Firewall Information:" -ForegroundColor Yellow
Write-Host ""
Write-Host "To allow external access, ensure port 8080 is open:" -ForegroundColor White
Write-Host "  • Windows Firewall may block incoming connections" -ForegroundColor Gray
Write-Host "  • Vite dev server allows network access by default" -ForegroundColor Gray
Write-Host "  • Router/network firewall may also need configuration" -ForegroundColor Gray
Write-Host ""

# External access options
Write-Host "🌍 External Access Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "For testing from external networks:" -ForegroundColor White
Write-Host ""
Write-Host "1. ngrok (recommended):" -ForegroundColor Cyan
Write-Host "   npm install -g ngrok" -ForegroundColor Gray
Write-Host "   ngrok http 8080" -ForegroundColor Gray
Write-Host "   → Provides secure HTTPS tunnel" -ForegroundColor Gray
Write-Host ""
Write-Host "2. localtunnel:" -ForegroundColor Cyan
Write-Host "   npx localtunnel --port 8080" -ForegroundColor Gray
Write-Host "   → Quick temporary tunnel" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Cloudflare Tunnel:" -ForegroundColor Cyan
Write-Host "   cloudflared tunnel --url http://localhost:8080" -ForegroundColor Gray
Write-Host "   → Enterprise-grade tunnel" -ForegroundColor Gray
Write-Host ""

# QR Code suggestion
Write-Host "📱 Mobile Testing:" -ForegroundColor Yellow
Write-Host ""
Write-Host "For easy mobile access, generate QR codes:" -ForegroundColor White
Write-Host "  • Use online QR generator with your network URL" -ForegroundColor Gray
Write-Host "  • Or install: npm install -g qrcode-terminal" -ForegroundColor Gray
Write-Host "  • Then: qrcode-terminal 'http://[your-ip]:8080'" -ForegroundColor Gray
Write-Host ""

# Security notes
Write-Host "🔒 Security Notes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Development server security considerations:" -ForegroundColor Red
Write-Host "  • Only share on trusted networks" -ForegroundColor Gray
Write-Host "  • Development server is not production-ready" -ForegroundColor Gray
Write-Host "  • API keys in guest mode are session-only" -ForegroundColor Gray
Write-Host "  • Monitor for unauthorized access" -ForegroundColor Gray
Write-Host ""

# Testing instructions
Write-Host "🧪 Testing Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Share these URLs with testers:" -ForegroundColor White
Write-Host "  1. Provide network URL: http://[ip]:8080" -ForegroundColor Gray
Write-Host "  2. Ask them to test both guest and auth modes" -ForegroundColor Gray
Write-Host "  3. Have them follow TESTING_CHECKLIST.md" -ForegroundColor Gray
Write-Host "  4. Collect feedback on functionality and UX" -ForegroundColor Gray
Write-Host ""

# Status check
Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host ""

# Check if development server is running
$devServerRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Development server is running" -ForegroundColor Green
    $devServerRunning = $true
} catch {
    Write-Host "❌ Development server is not running" -ForegroundColor Red
    Write-Host "   Start with: npm run dev" -ForegroundColor Gray
}

# Check if Supabase is running (if applicable)
try {
    $response = Invoke-WebRequest -Uri "http://localhost:54323" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Supabase Studio is running (http://localhost:54323)" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Supabase Studio not detected (using remote instance)" -ForegroundColor Blue
}

Write-Host ""

if ($devServerRunning) {
    Write-Host "🎉 Ready for testing!" -ForegroundColor Green
    Write-Host "Share the network URLs above with your testers." -ForegroundColor White
} else {
    Write-Host "⚠️  Start the development server first:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")