$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command npm -ErrorAction SilentlyContinue) -or -not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js 20.19+ (or 22.12+) and npm are required.'
}
$nodeVersionText = (& node --version 2>$null).Trim()
$nodeVersion = [regex]::Match($nodeVersionText, '^v(?<major>\d+)\.(?<minor>\d+)')
if (-not $nodeVersion.Success) { throw "Could not read the installed Node.js version: $nodeVersionText" }
$nodeMajor = [int]$nodeVersion.Groups['major'].Value
$nodeMinor = [int]$nodeVersion.Groups['minor'].Value
$supportedNode = ($nodeMajor -eq 20 -and $nodeMinor -ge 19) -or ($nodeMajor -eq 22 -and $nodeMinor -ge 12) -or ($nodeMajor -gt 22)
if (-not $supportedNode) { throw "Node.js 20.19+ or 22.12+ is required; found $nodeVersionText." }

if (-not (Test-Path 'server/.env')) {
  Copy-Item 'server/.env.example' 'server/.env'
}

if (-not (Test-Path 'node_modules/.bin/concurrently') -or -not (Test-Path 'server/node_modules/.bin/tsx') -or -not (Test-Path 'client/node_modules/.bin/vite')) {
  npm run install:all
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}

$mongoUri = $env:MONGODB_URI
if (-not $mongoUri) {
  $uriLine = Get-Content 'server/.env' | Where-Object { $_ -match '^\s*MONGODB_URI\s*=' } | Select-Object -First 1
  if ($uriLine) { $mongoUri = ($uriLine -replace '^\s*MONGODB_URI\s*=','').Trim().Trim([char]34,[char]39) }
}
if (-not $mongoUri) { $mongoUri = 'mongodb://127.0.0.1:27017/fastfood_db' }

function Test-FastFoodMongo {
  $probeCode = "const m=require('./server/node_modules/mongoose');m.connect(process.env.FASTFOOD_MONGO_PROBE_URI,{serverSelectionTimeoutMS:2500}).then(async()=>{await m.connection.db.admin().command({ping:1});await m.disconnect()}).catch(async()=>{await m.disconnect().catch(()=>{});process.exit(1)})"
  $env:FASTFOOD_MONGO_PROBE_URI = $mongoUri
  try {
    & node -e $probeCode 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } finally {
    Remove-Item Env:FASTFOOD_MONGO_PROBE_URI -ErrorAction SilentlyContinue
  }
}

$ready = Test-FastFoodMongo
if ($ready) {
  Write-Host 'Using the MongoDB server configured in MONGODB_URI.'
} else {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'MongoDB is not reachable. Start a local MongoDB server or install and start Docker Desktop.'
  }
  docker compose up -d mongodb
  if ($LASTEXITCODE -ne 0) { throw 'Could not start the MongoDB container. Check whether the configured host port is already in use.' }
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (Test-FastFoodMongo) { $ready = $true; break }
    Start-Sleep -Seconds 2
  }
}
if (-not $ready) { throw 'MongoDB did not become ready. Check Docker Desktop or the connection string in server/.env.' }

$countCode = "const m=require('./server/node_modules/mongoose');m.connect(process.env.FASTFOOD_MONGO_PROBE_URI).then(async()=>{const names=['stores','customers','menuitems','shippers','orders','reviews'];const counts=await Promise.all(names.map(n=>m.connection.db.collection(n).countDocuments()));console.log(counts.reduce((a,b)=>a+b,0));await m.disconnect()}).catch(async()=>{await m.disconnect().catch(()=>{});process.exit(1)})"
$env:FASTFOOD_MONGO_PROBE_URI = $mongoUri
try { $total = & node -e $countCode } finally { Remove-Item Env:FASTFOOD_MONGO_PROBE_URI -ErrorAction SilentlyContinue }
if ($LASTEXITCODE -ne 0) { throw 'Could not count records in the configured MongoDB database.' }
if ([int]($total | Out-String).Trim() -eq 0) {
  npm run seed
  if ($LASTEXITCODE -ne 0) { throw 'Could not seed the demo database.' }
} else {
  Write-Host "MongoDB already has $($total.Trim()) records; the demo seed was left unchanged."
}

Write-Host 'Starting FastFood. Open http://localhost:5173. Press Ctrl+C to stop the app.'
npm run dev
