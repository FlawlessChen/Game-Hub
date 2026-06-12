param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$sceneDir = Join-Path $Root 'assets\scenes'
$effectDir = Join-Path $Root 'assets\effects'
New-Item -ItemType Directory -Force -Path $sceneDir, $effectDir | Out-Null

function New-Canvas {
  param([int]$Width, [int]$Height)

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  [PSCustomObject]@{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Png {
  param($Canvas, [string]$Path)

  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Bitmap.Dispose()
}

function New-SolidBrush {
  param([string]$Color)
  [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
}

function New-AlphaBrush {
  param([int]$Alpha, [int]$Red, [int]$Green, [int]$Blue)
  [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($Alpha, $Red, $Green, $Blue))
}

function New-ColorPen {
  param([string]$Color, [float]$Width)
  [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($Color), $Width)
}

function New-LinearBrush {
  param([System.Drawing.Rectangle]$Rectangle, [string]$Start, [string]$End, [float]$Angle)
  [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $Rectangle,
    [System.Drawing.ColorTranslator]::FromHtml($Start),
    [System.Drawing.ColorTranslator]::FromHtml($End),
    $Angle
  )
}

function Fill-RoundRect {
  param($Graphics, $Brush, [float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius)

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $Graphics.FillPath($Brush, $path)
  $path.Dispose()
}

function Draw-Polygon {
  param($Graphics, $Brush, [System.Drawing.PointF[]]$Points)
  $Graphics.FillPolygon($Brush, $Points)
}

function Draw-Star {
  param($Graphics, $Brush, [float]$CenterX, [float]$CenterY, [float]$OuterRadius, [float]$InnerRadius, [int]$Points)

  $vertices = [System.Collections.Generic.List[System.Drawing.PointF]]::new()
  for ($index = 0; $index -lt $Points * 2; $index += 1) {
    $radius = if ($index % 2 -eq 0) { $OuterRadius } else { $InnerRadius }
    $angle = -[Math]::PI / 2 + $index * [Math]::PI / $Points
    $vertices.Add([System.Drawing.PointF]::new(
      $CenterX + [Math]::Cos($angle) * $radius,
      $CenterY + [Math]::Sin($angle) * $radius
    ))
  }
  $Graphics.FillPolygon($Brush, $vertices.ToArray())
}

function Draw-Coin {
  param($Graphics, [float]$X, [float]$Y, [float]$Radius)

  $rect = [System.Drawing.RectangleF]::new($X - $Radius, $Y - $Radius, $Radius * 2, $Radius * 2)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddEllipse($rect)

  $brush = [System.Drawing.Drawing2D.PathGradientBrush]::new($path)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 255, 252, 184)
  $brush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 217, 119, 6))

  $Graphics.FillEllipse($brush, $rect)
  $Graphics.DrawEllipse((New-ColorPen '#92400e' 5), $rect)
  $Graphics.DrawLine((New-ColorPen '#fff7b8' 7), $X - $Radius * 0.38, $Y - $Radius * 0.1, $X + $Radius * 0.38, $Y - $Radius * 0.1)
  $Graphics.FillEllipse((New-SolidBrush '#fff7b8'), $X - $Radius * 0.24, $Y - $Radius * 0.36, $Radius * 0.24, $Radius * 0.24)

  $brush.Dispose()
  $path.Dispose()
}

function Draw-Fruit {
  param($Graphics, [float]$X, [float]$Y, [float]$Radius, [string]$Color, [string]$LeafColor)

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddEllipse($X - $Radius, $Y - $Radius, $Radius * 2, $Radius * 2)

  $brush = [System.Drawing.Drawing2D.PathGradientBrush]::new($path)
  $brush.CenterPoint = [System.Drawing.PointF]::new($X - $Radius * 0.35, $Y - $Radius * 0.38)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 255, 235, 214)
  $brush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.ColorTranslator]::FromHtml($Color))

  $Graphics.FillEllipse($brush, $X - $Radius, $Y - $Radius, $Radius * 2, $Radius * 2)
  $Graphics.FillEllipse((New-AlphaBrush 80 255 255 255), $X - $Radius * 0.46, $Y - $Radius * 0.46, $Radius * 0.45, $Radius * 0.45)
  $Graphics.DrawLine((New-ColorPen '#7c2d12' 8), $X - $Radius * 0.15, $Y - $Radius * 0.94, $X + $Radius * 0.1, $Y - $Radius * 1.17)
  $Graphics.FillEllipse((New-SolidBrush $LeafColor), $X, $Y - $Radius * 1.2, $Radius * 0.9, $Radius * 0.38)

  $brush.Dispose()
  $path.Dispose()
}

function New-CoinCatchScene {
  $canvas = New-Canvas 840 1360
  $graphics = $canvas.Graphics

  $background = New-LinearBrush ([System.Drawing.Rectangle]::new(0, 0, 840, 1360)) '#fff8df' '#f59e0b' 90
  $graphics.FillRectangle($background, 0, 0, 840, 1360)
  $background.Dispose()

  $sky = New-LinearBrush ([System.Drawing.Rectangle]::new(0, 0, 840, 720)) '#fff7d0' '#facc15' 90
  $graphics.FillRectangle($sky, 0, 0, 840, 720)
  $sky.Dispose()

  $graphics.FillEllipse((New-AlphaBrush 66 255 255 255), -170, 110, 520, 410)
  $graphics.FillEllipse((New-AlphaBrush 47 255 255 240), 520, -90, 450, 430)

  for ($index = 0; $index -lt 20; $index += 1) {
    $x = ($index * 97 + 23) % 840
    $y = 100 + (($index * 139) % 850)
    $radius = 22 + (($index * 11) % 28)
    Draw-Coin $graphics $x $y $radius
  }

  for ($index = 0; $index -lt 42; $index += 1) {
    $x = ($index * 53 + 19) % 840
    $y = 70 + (($index * 89) % 880)
    $graphics.DrawLine((New-ColorPen '#fff7b8' 3), $x - 10, $y, $x + 10, $y)
    $graphics.DrawLine((New-ColorPen '#fff7b8' 3), $x, $y - 10, $x, $y + 10)
  }

  $graphics.FillRectangle((New-AlphaBrush 199 137 58 18), 0, 1090, 840, 270)
  $graphics.FillRectangle((New-SolidBrush '#b45309'), 0, 1110, 840, 84)
  for ($index = 0; $index -lt 11; $index += 1) {
    $graphics.FillRectangle((New-AlphaBrush 85 255 247 237), -80 + $index * 95, 1110, 42, 250)
  }

  Fill-RoundRect $graphics (New-SolidBrush '#f59e0b') 72 1026 696 68 30
  for ($index = 0; $index -lt 8; $index += 1) {
    Draw-Star $graphics (New-SolidBrush '#fff7b8') (110 + $index * 94) (1215 + (($index % 2) * 42)) 18 7 5
  }

  Save-Png $canvas (Join-Path $sceneDir 'coin-catch-market.png')
}

function New-FruitSliceScene {
  $canvas = New-Canvas 840 1360
  $graphics = $canvas.Graphics

  $background = New-LinearBrush ([System.Drawing.Rectangle]::new(0, 0, 840, 1360)) '#fffaf0' '#6ecf68' 35
  $graphics.FillRectangle($background, 0, 0, 840, 1360)
  $background.Dispose()

  $graphics.FillEllipse((New-AlphaBrush 53 255 255 255), -180, 720, 520, 420)
  $graphics.FillEllipse((New-AlphaBrush 37 255 255 255), 560, -80, 420, 420)

  $board = New-LinearBrush ([System.Drawing.Rectangle]::new(70, 910, 700, 360)) '#f9d493' '#c77924' 90
  Fill-RoundRect $graphics $board 70 910 700 360 38
  $board.Dispose()

  for ($index = 0; $index -lt 8; $index += 1) {
    $x = 115 + $index * 86
    $graphics.DrawLine((New-ColorPen '#ffe4b5' 5), $x, 930, $x - 42, 1252)
  }

  $graphics.FillEllipse((New-AlphaBrush 51 0 0 0), 120, 1190, 610, 80)

  Draw-Fruit $graphics 260 600 88 '#fb3f3f' '#36d979'
  Draw-Fruit $graphics 575 460 82 '#22c55e' '#4ade80'
  Draw-Fruit $graphics 245 340 72 '#f97316' '#42de83'
  Draw-Fruit $graphics 585 710 48 '#3b82f6' '#8b5cf6'

  for ($index = 0; $index -lt 54; $index += 1) {
    $x = ($index * 61 + 25) % 840
    $y = 100 + (($index * 97) % 760)
    $size = 8 + (($index * 5) % 15)
    $brush = switch ($index % 3) {
      0 { New-AlphaBrush 187 255 247 214 }
      1 { New-AlphaBrush 136 255 255 255 }
      default { New-AlphaBrush 153 253 230 138 }
    }
    $graphics.FillEllipse($brush, $x, $y, $size, $size)
  }

  $slashPen = New-ColorPen '#ffffff' 42
  $slashPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $slashPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($slashPen, 90, 850, 770, 210)

  $innerPen = New-ColorPen '#dffaff' 12
  $innerPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $innerPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($innerPen, 105, 836, 755, 224)

  Save-Png $canvas (Join-Path $sceneDir 'fruit-slice-board.png')
}

function New-CoinSpark {
  $canvas = New-Canvas 128 128
  $graphics = $canvas.Graphics
  $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddEllipse(10, 10, 108, 108)
  $brush = [System.Drawing.Drawing2D.PathGradientBrush]::new($path)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb(210, 255, 255, 255)
  $brush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(0, 255, 214, 64))

  $graphics.FillEllipse($brush, 10, 10, 108, 108)
  Draw-Star $graphics (New-SolidBrush '#fff7b8') 64 64 46 15 8
  Draw-Star $graphics (New-SolidBrush '#ffffff') 64 64 25 8 8

  $brush.Dispose()
  $path.Dispose()
  Save-Png $canvas (Join-Path $effectDir 'coin-spark.png')
}

function New-SliceGlint {
  $canvas = New-Canvas 192 96
  $graphics = $canvas.Graphics
  $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

  $pen = New-ColorPen '#ffffff' 16
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($pen, 18, 70, 174, 26)

  $pen2 = New-ColorPen '#fde68a' 5
  $pen2.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen2.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($pen2, 28, 66, 164, 30)

  Draw-Star $graphics (New-SolidBrush '#ffffff') 151 31 18 5 4
  Draw-Star $graphics (New-SolidBrush '#fde68a') 36 66 11 4 4

  Save-Png $canvas (Join-Path $effectDir 'slice-glint.png')
}

function New-FruitSplash {
  $canvas = New-Canvas 128 128
  $graphics = $canvas.Graphics
  $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

  $graphics.FillEllipse((New-AlphaBrush 221 255 255 255), 36, 36, 56, 56)
  for ($index = 0; $index -lt 12; $index += 1) {
    $angle = $index * [Math]::PI * 2 / 12
    $x = 64 + [Math]::Cos($angle) * (25 + ($index % 3) * 8)
    $y = 64 + [Math]::Sin($angle) * (23 + ($index % 4) * 7)
    $width = 13 + ($index % 4) * 4
    $height = 9 + ($index % 3) * 5
    $graphics.FillEllipse((New-AlphaBrush 187 255 255 255), $x - $width / 2, $y - $height / 2, $width, $height)
  }

  Save-Png $canvas (Join-Path $effectDir 'fruit-splash.png')
}

New-CoinCatchScene
New-FruitSliceScene
New-CoinSpark
New-SliceGlint
New-FruitSplash

Get-ChildItem -Path $sceneDir, $effectDir -File |
  Sort-Object FullName |
  Select-Object FullName, Length
