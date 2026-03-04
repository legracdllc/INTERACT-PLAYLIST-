param(
  [string]$OutDir = "public/mascots"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$items = @(
  @{ File = "fraction-paws.png"; Name = "Fraction Paws"; Concept = "Fractions"; C1 = "#3b82f6"; C2 = "#0ea5e9" },
  @{ File = "multiply-mane.png"; Name = "Multiply Mane"; Concept = "Multiplication"; C1 = "#f97316"; C2 = "#ef4444" },
  @{ File = "divide-roar.png"; Name = "Divide Roar"; Concept = "Division"; C1 = "#fb7185"; C2 = "#ef4444" },
  @{ File = "geo-cub.png"; Name = "Geo Cub"; Concept = "Geometry"; C1 = "#22c55e"; C2 = "#16a34a" },
  @{ File = "measure-king.png"; Name = "Measure King"; Concept = "Measurement"; C1 = "#f59e0b"; C2 = "#f97316" },
  @{ File = "perimeter-pouncer.png"; Name = "Perimeter Pouncer"; Concept = "Perimeter"; C1 = "#f59e0b"; C2 = "#fb923c" },
  @{ File = "area-cub.png"; Name = "Area Cub"; Concept = "Area"; C1 = "#84cc16"; C2 = "#22c55e" },
  @{ File = "graph-guardian.png"; Name = "Graph Guardian"; Concept = "Graphs"; C1 = "#2563eb"; C2 = "#0ea5e9" },
  @{ File = "place-value-prince.png"; Name = "Place Value Prince"; Concept = "Place Value"; C1 = "#ef4444"; C2 = "#f97316" },
  @{ File = "timely-tamer.png"; Name = "Timely Tamer"; Concept = "Telling Time"; C1 = "#2563eb"; C2 = "#6366f1" }
)

function ToColor([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

foreach ($item in $items) {
  $bmp = New-Object System.Drawing.Bitmap(1024, 1024)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::White)

  $rect = New-Object System.Drawing.Rectangle(0, 0, 1024, 1024)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    (ToColor $item.C1),
    (ToColor $item.C2),
    135
  )
  $g.FillRectangle($brush, $rect)

  $header = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 255, 255, 255))
  $footer = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 0, 0, 0))
  $g.FillRectangle($header, 0, 0, 1024, 160)
  $g.FillRectangle($footer, 0, 860, 1024, 164)

  $lionBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 255, 205, 54))
  $maneBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 245, 112, 28))
  $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 30, 41, 59))
  $mouthBrush = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 30, 41, 59), 10)

  # Mane
  $g.FillEllipse($maneBrush, 286, 240, 452, 452)
  # Face
  $g.FillEllipse($lionBrush, 350, 300, 324, 324)
  # Ears
  $g.FillEllipse($lionBrush, 305, 335, 94, 94)
  $g.FillEllipse($lionBrush, 625, 335, 94, 94)
  # Eyes
  $g.FillEllipse($eyeBrush, 440, 420, 44, 44)
  $g.FillEllipse($eyeBrush, 538, 420, 44, 44)
  # Mouth
  $g.DrawArc($mouthBrush, 470, 500, 80, 50, 10, 160)

  $fontTitle = New-Object System.Drawing.Font("Segoe UI", 56, [System.Drawing.FontStyle]::Bold)
  $fontConcept = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
  $fontLabel = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
  $textBrushDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 15, 23, 42))
  $textBrushLight = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 255, 255, 255))

  $g.DrawString($item.Name, $fontTitle, $textBrushDark, 68, 42)
  $g.DrawString("Math Mascot", $fontLabel, $textBrushLight, 392, 745)
  $g.DrawString($item.Concept, $fontConcept, $textBrushLight, 320, 915)

  $outPath = Join-Path $OutDir $item.File
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Created $outPath"

  $brush.Dispose()
  $header.Dispose()
  $footer.Dispose()
  $lionBrush.Dispose()
  $maneBrush.Dispose()
  $eyeBrush.Dispose()
  $mouthBrush.Dispose()
  $fontTitle.Dispose()
  $fontConcept.Dispose()
  $fontLabel.Dispose()
  $textBrushDark.Dispose()
  $textBrushLight.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}
