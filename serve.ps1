param(
    [int]$Port = 54821,
    [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

function Get-ContentType {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".css" { return "text/css; charset=utf-8" }
        ".js" { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".svg" { return "image/svg+xml" }
        default { return "application/octet-stream" }
    }
}

function Send-Response {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [byte[]]$Body,
        [string]$ContentType = "text/plain; charset=utf-8"
    )

    $header = @(
        "HTTP/1.1 $StatusCode $StatusText",
        "Content-Type: $ContentType",
        "Content-Length: $($Body.Length)",
        "Connection: close",
        ""
        ""
    ) -join "`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    $Stream.Write($Body, 0, $Body.Length)
    $Stream.Flush()
}

$rootFullPath = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()

        try {
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                $client.Close()
                continue
            }

            while ($reader.Peek() -ge 0) {
                $line = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($line)) {
                    break
                }
            }

            $parts = $requestLine.Split(" ")
            if ($parts.Length -lt 2) {
                Send-Response -Stream $stream -StatusCode 400 -StatusText "Bad Request" -Body ([System.Text.Encoding]::UTF8.GetBytes("400"))
                $client.Close()
                continue
            }

            $relativePath = $parts[1].TrimStart("/")
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $relativePath = $relativePath.Split("?")[0]
            $safePath = $relativePath -replace '/', '\'
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $rootFullPath $safePath))

            if (-not $fullPath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                Send-Response -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Body ([System.Text.Encoding]::UTF8.GetBytes("403"))
                $client.Close()
                continue
            }

            if (-not (Test-Path $fullPath -PathType Leaf)) {
                Send-Response -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body ([System.Text.Encoding]::UTF8.GetBytes("404"))
                $client.Close()
                continue
            }

            $body = [System.IO.File]::ReadAllBytes($fullPath)
            $contentType = Get-ContentType -Path $fullPath
            Send-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
        }
        finally {
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
