$ErrorActionPreference = "Stop"

$port = 3088
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\uttam\.gemini\antigravity\brain\c0295b6e-8a45-45f9-88c0-9b92be021d38"
$localDir = "D:\Projects\Sproutnik\public\screenshots"

if (!(Test-Path $localDir)) {
    New-Item -ItemType Directory -Force -Path $localDir | Out-Null
}
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

Write-Host "Starting Next.js production server on port $port..."
$serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx next start -p $port" -PassThru -NoNewWindow

try {
    Write-Host "Waiting for server to become responsive..."
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            $code = (curl.exe -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port/onboarding")
            if ($code -eq "200") {
                $ready = $true
                break
            }
        } catch {
            # continue waiting
        }
    }

    if (!$ready) {
        throw "Server did not respond with 200 within 30 seconds."
    }

    Write-Host "Server is ready! Taking screenshots..."

    $targets = @(
        @{
            Name = "01-unified-welcome.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=welcome";
            Width = 1280;
            Height = 900;
        },
        @{
            Name = "02-location-workspace-desktop.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=0";
            Width = 1440;
            Height = 900;
        },
        @{
            Name = "02-location-workspace-mobile.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=0";
            Width = 375;
            Height = 812;
        },
        @{
            Name = "02-location-workspace-mobile-map.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=0&view=map";
            Width = 375;
            Height = 812;
        },
        @{
            Name = "03-land-area.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=1";
            Width = 1280;
            Height = 900;
        },
        @{
            Name = "04-soil-selection.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=2";
            Width = 1280;
            Height = 900;
        },
        @{
            Name = "05-irrigation.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=3";
            Width = 1280;
            Height = 900;
        },
        @{
            Name = "06-conversational-mode.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=conversation";
            Width = 1280;
            Height = 900;
        },
        @{
            Name = "07-profile-review.png";
            Url = "http://127.0.0.1:$port/onboarding?mode=field-guide&step=6";
            Width = 1280;
            Height = 1100;
        }
    )

    foreach ($t in $targets) {
        $outFile = Join-Path $localDir $t.Name
        $artFile = Join-Path $outDir $t.Name
        Write-Host "Capturing $($t.Name) ($($t.Width)x$($t.Height))..."
        
        $chromeArgs = @(
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-sync",
            "--disable-default-apps",
            "--no-first-run",
            "--hide-scrollbars",
            "--virtual-time-budget=2500",
            "--run-all-compositor-stages-before-draw",
            "--window-size=$($t.Width),$($t.Height)",
            "--screenshot=$outFile",
            $t.Url
        )
        
        $p = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -PassThru -NoNewWindow
        Start-Sleep -Milliseconds 600

        if (Test-Path $outFile) {
            Copy-Item -Path $outFile -Destination $artFile -Force
            Write-Host "Saved: $outFile and $artFile"
        } else {
            Write-Warning "Failed to generate $outFile"
        }
    }

    Write-Host "All screenshots captured successfully!"
} finally {
    Write-Host "Stopping Next.js server..."
    if ($serverProcess -and !$serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Clean up any lingering node next processes on port $port
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}
