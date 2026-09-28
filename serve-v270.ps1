$Root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$Prefix = 'http://127.0.0.1:8765/'
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($Prefix)
$listener.Start()

$Mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8';
  '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.webmanifest'='application/manifest+json; charset=utf-8';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp';
  '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.txt'='text/plain; charset=utf-8';
  '.md'='text/markdown; charset=utf-8'; '.woff'='font/woff'; '.woff2'='font/woff2'
}

Write-Host "Afei Stone Age V2.70 server: $Prefix"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $raw = $ctx.Request.Url.AbsolutePath
      $relative = [Uri]::UnescapeDataString($raw.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'game.html' }
      $full = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
      if (-not ($full.StartsWith($Root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or $full -eq $Root)) {
        $ctx.Response.StatusCode = 403
        $ctx.Response.Close()
        continue
      }
      if (-not [System.IO.File]::Exists($full)) {
        $ctx.Response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
        $ctx.Response.Close()
        continue
      }
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      if ($Mime.ContainsKey($ext)) { $ctx.Response.ContentType = $Mime[$ext] }
      $data = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentLength64 = $data.Length
      if ($ctx.Request.HttpMethod -ne 'HEAD') { $ctx.Response.OutputStream.Write($data,0,$data.Length) }
      $ctx.Response.Close()
    } catch {
      try { $ctx.Response.StatusCode = 500; $ctx.Response.Close() } catch {}
    }
  }
}
finally {
  if ($listener) { $listener.Stop(); $listener.Close() }
}
