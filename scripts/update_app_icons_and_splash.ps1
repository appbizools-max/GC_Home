Add-Type -AssemblyName System.Drawing

$rootDir = "d:\N OFFICE\New Cleaning App\GC_Home"
$iconPath = Join-Path $rootDir "user-app\assets\icon.png"
$splashPath = Join-Path $rootDir "user-app\assets\splash.png"

if (!(Test-Path $iconPath)) {
    Write-Error "Icon file not found at $iconPath"
    exit 1
}
if (!(Test-Path $splashPath)) {
    Write-Error "Splash file not found at $splashPath"
    exit 1
}

Write-Host "Loading source images..."
$iconBmp = [System.Drawing.Bitmap]::FromFile($iconPath)
$splashBmp = [System.Drawing.Bitmap]::FromFile($splashPath)

# 1. Copy icon.png & splash.png to branding folders
$brandingDirs = @(
    (Join-Path $rootDir "user-app\src\assets\branding"),
    (Join-Path $rootDir "admin-panel\src\assets\branding"),
    (Join-Path $rootDir "admin-panel\public\assets\branding")
)

foreach ($bDir in $brandingDirs) {
    if (!(Test-Path $bDir)) {
        New-Item -ItemType Directory -Path $bDir -Force | Out-Null
    }
    Copy-Item $iconPath (Join-Path $bDir "icon.png") -Force
    Copy-Item $splashPath (Join-Path $bDir "splash.png") -Force
    Copy-Item $iconPath (Join-Path $bDir "gc-home-logo.png") -Force
    Write-Host "Updated branding images in: $bDir"
}

# Also update user-app/assets/adaptive-icon.png and user-app/assets/gc-home-logo.png
Copy-Item $iconPath (Join-Path $rootDir "user-app\assets\adaptive-icon.png") -Force
Copy-Item $iconPath (Join-Path $rootDir "user-app\assets\gc-home-logo.png") -Force

# Helper function to generate high-quality scaled bitmap
function Create-ScaledBitmap($sourceBmp, $targetW, $targetH, $padRatio = 1.0, $isRound = $false) {
    $outBmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $rect = New-Object System.Drawing.RectangleF(0, 0, $targetW, $targetH)
        $path.AddEllipse($rect)
        $g.SetClip($path)
        # Background white for round icon
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillEllipse($brush, 0, 0, $targetW, $targetH)
        $brush.Dispose()
    }

    $destW = [int]($targetW * $padRatio)
    $destH = [int]($targetH * $padRatio)
    $destX = [int](($targetW - $destW) / 2)
    $destY = [int](($targetH - $destH) / 2)

    $g.DrawImage($sourceBmp, $destX, $destY, $destW, $destH)
    $g.Dispose()
    return $outBmp
}

# 2. Update Android Native Drawables (splashscreen_image.png)
$drawableDensities = @{
    "drawable-mdpi"    = 480
    "drawable-hdpi"    = 640
    "drawable-xhdpi"   = 800
    "drawable-xxhdpi"  = 1024
    "drawable-xxxhdpi" = 1280
}

$resDir = Join-Path $rootDir "user-app\android\app\src\main\res"

foreach ($dName in $drawableDensities.Keys) {
    $targetDir = Join-Path $resDir $dName
    if (Test-Path $targetDir) {
        $size = $drawableDensities[$dName]
        $splashOut = Create-ScaledBitmap $splashBmp $size $size 0.95 $false
        $destFile = Join-Path $targetDir "splashscreen_image.png"
        $splashOut.Save($destFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $splashOut.Dispose()
        Write-Host "Generated native splash: $destFile ($size x $size)"
    }
}

# 3. Update Android Native Mipmaps (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png)
$mipmapDensities = @{
    "mipmap-mdpi"    = @{ icon = 48;  foreground = 108 }
    "mipmap-hdpi"    = @{ icon = 72;  foreground = 162 }
    "mipmap-xhdpi"   = @{ icon = 96;  foreground = 216 }
    "mipmap-xxhdpi"  = @{ icon = 144; foreground = 324 }
    "mipmap-xxxhdpi" = @{ icon = 192; foreground = 432 }
}

foreach ($mName in $mipmapDensities.Keys) {
    $targetDir = Join-Path $resDir $mName
    if (Test-Path $targetDir) {
        $iconSize = $mipmapDensities[$mName].icon
        $fgSize = $mipmapDensities[$mName].foreground

        # ic_launcher.png (square/masked base)
        $iconOut = Create-ScaledBitmap $iconBmp $iconSize $iconSize 1.0 $false
        $destIcon = Join-Path $targetDir "ic_launcher.png"
        $iconOut.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)
        $iconOut.Dispose()

        # ic_launcher_round.png
        $roundOut = Create-ScaledBitmap $iconBmp $iconSize $iconSize 0.92 $true
        $destRound = Join-Path $targetDir "ic_launcher_round.png"
        $roundOut.Save($destRound, [System.Drawing.Imaging.ImageFormat]::Png)
        $roundOut.Dispose()

        # ic_launcher_foreground.png (safe zone centered for adaptive icon)
        $fgOut = Create-ScaledBitmap $iconBmp $fgSize $fgSize 0.72 $false
        $destFg = Join-Path $targetDir "ic_launcher_foreground.png"
        $fgOut.Save($destFg, [System.Drawing.Imaging.ImageFormat]::Png)
        $fgOut.Dispose()

        Write-Host "Generated launcher icons in: $mName (icon: ${iconSize}px, fg: ${fgSize}px)"
    }
}

$iconBmp.Dispose()
$splashBmp.Dispose()
Write-Host "All icons and splash images updated successfully!"
