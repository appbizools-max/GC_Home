Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\lenovo\.gemini\antigravity-ide\brain\a9c7555f-dae2-40ed-9144-5cff7707a963\.user_uploaded\media_1790165295337.jpg"

$targetDirs = @(
    "E:\Home Clean\GC_Home\assets\branding",
    "E:\Home Clean\GC_Home\user-app\src\assets\branding",
    "E:\Home Clean\GC_Home\admin-panel\src\assets\branding",
    "E:\Home Clean\GC_Home\admin-panel\public\assets\branding"
)

foreach ($dir in $targetDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

# High quality 512x512 optimized for mobile and web
$optSize = 512
$optBmp = New-Object System.Drawing.Bitmap($optSize, $optSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($optBmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$centerX = $optSize / 2.0
$centerY = $optSize / 2.0
$radius = ($optSize / 2.0) - 8.0

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$rect = New-Object System.Drawing.RectangleF(($centerX - $radius), ($centerY - $radius), ($radius * 2), ($radius * 2))
$path.AddEllipse($rect)

$graphics.SetClip($path)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.DrawImage($bmp, 0, 0, $optSize, $optSize)

foreach ($dir in $targetDirs) {
    $destPath = Join-Path $dir "gc-home-logo.png"
    $optBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Saved optimized logo to $destPath"
}

$graphics.Dispose()
$bmp.Dispose()
$optBmp.Dispose()
