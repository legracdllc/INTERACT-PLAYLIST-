param(
  [string]$Source = "public/mascots/reference.png",
  [string]$OutDir = "public/mascots"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Source image not found: $Source"
}

Add-Type -AssemblyName System.Drawing

$names = @(
  "fraction-paws",
  "multiply-mane",
  "divide-roar",
  "geo-cub",
  "measure-king",
  "perimeter-pouncer",
  "area-cub",
  "graph-guardian",
  "place-value-prince",
  "timely-tamer"
)

# Coordinates tuned for the provided 1536x1024 reference image.
$rects = @(
  @{ X = 48;   Y = 249; W = 266; H = 399 },
  @{ X = 330;  Y = 249; W = 266; H = 399 },
  @{ X = 612;  Y = 249; W = 266; H = 399 },
  @{ X = 894;  Y = 249; W = 266; H = 399 },
  @{ X = 1176; Y = 249; W = 266; H = 399 },
  @{ X = 48;   Y = 566; W = 266; H = 399 },
  @{ X = 330;  Y = 566; W = 266; H = 399 },
  @{ X = 612;  Y = 566; W = 266; H = 399 },
  @{ X = 894;  Y = 566; W = 266; H = 399 },
  @{ X = 1176; Y = 566; W = 266; H = 399 }
)

if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$src = New-Object System.Drawing.Bitmap($Source)

try {
  for ($i = 0; $i -lt $names.Count; $i++) {
    $r = $rects[$i]
    $cardRect = New-Object System.Drawing.Rectangle($r.X, $r.Y, $r.W, $r.H)
    $card = $src.Clone($cardRect, $src.PixelFormat)

    # Export each as a square poster canvas.
    $size = 1024
    $canvas = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $targetW = 900
    $targetH = [int]([math]::Round($targetW * ($card.Height / [double]$card.Width)))
    if ($targetH -gt 900) {
      $targetH = 900
      $targetW = [int]([math]::Round($targetH * ($card.Width / [double]$card.Height)))
    }

    $x = [int](($size - $targetW) / 2)
    $y = [int](($size - $targetH) / 2)
    $g.DrawImage($card, $x, $y, $targetW, $targetH)

    $outPath = Join-Path $OutDir "$($names[$i]).png"
    $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $canvas.Dispose()
    $card.Dispose()
    Write-Output "Created $outPath"
  }
}
finally {
  $src.Dispose()
}
