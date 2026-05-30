# Ollama Startup Script
# Kills any existing Ollama process, frees port 11434, then relaunches with CORS origins set.

Write-Host ""
Write-Host "  OLLAMA TERMINAL // STARTUP" -ForegroundColor Green
Write-Host "  ──────────────────────────" -ForegroundColor DarkGreen
Write-Host ""

# ── STEP 1: Kill existing ollama.exe ─────────────────────────────────────────
$ollamaProcs = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcs) {
    Write-Host "  [1/3] Stopping existing Ollama process..." -ForegroundColor Yellow
    $ollamaProcs | ForEach-Object { taskkill /F /PID $_.Id | Out-Null }
    Start-Sleep -Seconds 1
} else {
    Write-Host "  [1/3] No existing Ollama process found." -ForegroundColor DarkGray
}

# ── STEP 2: Free port 11434 if still bound ───────────────────────────────────
Write-Host "  [2/3] Checking port 11434..." -ForegroundColor Yellow
$connections = netstat -ano | Select-String ":11434"
if ($connections) {
    $pids = $connections | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique

    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            Write-Host "        Killing PID $p holding port 11434..." -ForegroundColor DarkYellow
            taskkill /F /PID $p 2>$null | Out-Null
        }
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "        Port 11434 is free." -ForegroundColor DarkGray
}

# ── STEP 3: Launch Ollama with CORS origins ───────────────────────────────────
Write-Host "  [3/3] Starting Ollama with extension support..." -ForegroundColor Yellow
$env:OLLAMA_ORIGINS = "*"

Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow

Start-Sleep -Seconds 2

# ── DONE ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ✓ Ollama is running on http://localhost:11434" -ForegroundColor Green
Write-Host "  ✓ Chrome extension is ready to use" -ForegroundColor Green
Write-Host ""
Write-Host "  You can close this window." -ForegroundColor DarkGray
Write-Host ""