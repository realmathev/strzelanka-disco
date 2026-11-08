Add-Type -AssemblyName System.Drawing
$W=1280;$H=720
$bmp=New-Object System.Drawing.Bitmap $W,$H
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode='AntiAlias';$g.TextRenderingHint='AntiAliasGridFit'
$ink=[System.Drawing.Color]::FromArgb(21,17,14)
$g.Clear([System.Drawing.Color]::FromArgb(244,231,197))

# sunburst rays from the centre
$cx=640;$cy=400
$cols=@([System.Drawing.Color]::FromArgb(211,36,42),[System.Drawing.Color]::FromArgb(247,197,30))
$n=28
for($i=0;$i -lt $n;$i++){
  $a1=[math]::PI*2*$i/$n;$a2=[math]::PI*2*($i+1)/$n
  $pts=@(
    (New-Object System.Drawing.PointF $cx,$cy),
    (New-Object System.Drawing.PointF ($cx+2000*[math]::Cos($a1)),($cy+2000*[math]::Sin($a1))),
    (New-Object System.Drawing.PointF ($cx+2000*[math]::Cos($a2)),($cy+2000*[math]::Sin($a2))))
  $b=New-Object System.Drawing.SolidBrush $cols[$i%2]
  $g.FillPolygon($b,$pts)
}
# halftone dots
$dot=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45,21,17,14))
for($y=0;$y -lt $H;$y+=14){for($x=(($y/14)%2)*7;$x -lt $W;$x+=14){$r=2+4*($y/$H);$g.FillEllipse($dot,$x,$y,$r,$r)}}

# disco ball
$g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230,230,235))),540,-20,200,200)
$pen=New-Object System.Drawing.Pen $ink,3
$g.DrawEllipse($pen,540,-20,200,200)
for($k=1;$k -lt 6;$k++){$g.DrawArc($pen,540+$k*14,-20,200-$k*28,200,0,360);$g.DrawLine($pen,540,-20+$k*33,740,-20+$k*33)}
$g.DrawLine((New-Object System.Drawing.Pen $ink,4),640,-20,640,-60)

function Outlined($text,$size,$x,$y,$fill,$rot,$shadow){
  $fam=New-Object System.Drawing.FontFamily 'Impact'
  $gp=New-Object System.Drawing.Drawing2D.GraphicsPath
  $gp.AddString($text,$fam,0,$size,(New-Object System.Drawing.PointF 0,0),[System.Drawing.StringFormat]::GenericDefault)
  $m=New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate($x,$y);$m.Rotate($rot)
  $gp.Transform($m)
  $sh=$gp.Clone();$m2=New-Object System.Drawing.Drawing2D.Matrix;$m2.Translate($shadow,$shadow);$sh.Transform($m2)
  $g.FillPath((New-Object System.Drawing.SolidBrush $ink),$sh)
  $g.DrawPath((New-Object System.Drawing.Pen $ink,($size/9)),$sh)
  $g.FillPath((New-Object System.Drawing.SolidBrush $fill),$gp)
  $p=New-Object System.Drawing.Pen $ink,($size/16);$p.LineJoin='Round'
  $g.DrawPath($p,$gp)
}
Outlined 'DISCO' 190 150 110 ([System.Drawing.Color]::FromArgb(247,197,30)) -4 10
Outlined 'SHOOTING GALLERY' 104 90 312 ([System.Drawing.Color]::FromArgb(255,248,230)) -4 10

# yellow caption box
$cap=New-Object System.Drawing.Rectangle 60,590,830,90
$g.FillRectangle((New-Object System.Drawing.SolidBrush $ink),($cap.X+8),($cap.Y+8),$cap.Width,$cap.Height)
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(247,197,30))),$cap)
$g.DrawRectangle((New-Object System.Drawing.Pen $ink,4),$cap)
$f=New-Object System.Drawing.Font('Arial Narrow',[single]28,[System.Drawing.FontStyle]::Bold)
$g.DrawString('11:14 PM. THE DJ WON''T STOP.',$f,(New-Object System.Drawing.SolidBrush $ink),(New-Object System.Drawing.PointF 78,606))
$f2=New-Object System.Drawing.Font('Arial Narrow',[single]24,[System.Drawing.FontStyle]::Bold)
$g.DrawString('GRAB A GUN. CO-OP UP TO 4 PLAYERS.',$f2,(New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(211,36,42))),(New-Object System.Drawing.PointF 78,642))

# BLAM burst
$burst=@();$pts=24
for($i=0;$i -lt $pts*2;$i++){$ang=[math]::PI*$i/$pts;$rad=if($i%2 -eq 0){130}else{80};$burst+=New-Object System.Drawing.PointF (1020+$rad*[math]::Cos($ang)),(520+$rad*[math]::Sin($ang))}
$g.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,248,230))),$burst)
$g.DrawPolygon((New-Object System.Drawing.Pen $ink,5),$burst)
Outlined 'BLAM!' 70 935 478 ([System.Drawing.Color]::FromArgb(211,36,42)) 8 4

# vignette frame
$g.DrawRectangle((New-Object System.Drawing.Pen $ink,16),0,0,$W,$H)
$bmp.Save('thumbnail.png',[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose()


