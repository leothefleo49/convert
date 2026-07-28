$env:PATH = "C:\nvm4w\nodejs;C:\Users\User\Git\cmd;C:\Windows\System32"

Write-Host "1. Committing to master branch..."
C:\Users\User\Git\cmd\git.exe add -A
C:\Users\User\Git\cmd\git.exe commit -m "Add Cache-Control meta tags and cache buster for cache.json"
C:\Users\User\Git\cmd\git.exe push origin master

Write-Host "2. Building production bundle..."
C:\nvm4w\nodejs\node.exe node_modules/vite/bin/vite.js build

Write-Host "3. Generating format cache..."
C:\nvm4w\nodejs\node.exe buildCache.js dist/cache.json

Write-Host "4. Staging dist files..."
$tempDir = Join-Path $env:TEMP "convert-dist-temp-2"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Copy-Item -Path "dist" -Destination $tempDir -Recurse -Force

Write-Host "5. Switching to gh-pages branch..."
C:\Users\User\Git\cmd\git.exe checkout -B gh-pages
Get-ChildItem -Exclude ".git" | Remove-Item -Recurse -Force

Write-Host "6. Copying built files to gh-pages..."
Copy-Item -Path "$tempDir\*" -Destination "." -Recurse -Force

Write-Host "7. Committing and force-pushing to gh-pages..."
C:\Users\User\Git\cmd\git.exe add -A
C:\Users\User\Git\cmd\git.exe commit -m "Deploy fresh build with submodules and cache buster"
C:\Users\User\Git\cmd\git.exe push origin gh-pages --force

Write-Host "8. Returning to master branch..."
C:\Users\User\Git\cmd\git.exe checkout master
Remove-Item $tempDir -Recurse -Force

Write-Host "DEPLOYMENT COMPLETE!"
