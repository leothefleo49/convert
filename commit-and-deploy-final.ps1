$env:PATH = "C:\nvm4w\nodejs;C:\Users\User\Git\cmd;C:\Windows\System32"

Write-Host "1. Committing local changes on master..."
C:\Users\User\Git\cmd\git.exe add -A
C:\Users\User\Git\cmd\git.exe commit -m "Fix CommonFormats WEBM definition and mediaLink initialization"
C:\Users\User\Git\cmd\git.exe push origin master

Write-Host "2. Building Vite bundle..."
C:\nvm4w\nodejs\node.exe node_modules/vite/bin/vite.js build

if (-not (Test-Path "dist\index.html")) {
    Write-Error "dist\index.html missing!"
    exit 1
}

Write-Host "3. Generating cache JSON..."
C:\nvm4w\nodejs\node.exe buildCache.js dist/cache.json
Copy-Item ".nojekyll" "dist\.nojekyll" -Force

Write-Host "4. Staging dist files..."
$t = Join-Path $env:TEMP "convert-final-deploy-ok"
if (Test-Path $t) { Remove-Item $t -Recurse -Force }
Copy-Item "dist" $t -Recurse -Force

Write-Host "5. Switching to gh-pages branch..."
C:\Users\User\Git\cmd\git.exe checkout -B gh-pages
C:\Users\User\Git\cmd\git.exe reset --hard
Get-ChildItem -Exclude ".git" | Remove-Item -Recurse -Force

Write-Host "6. Copying dist to gh-pages root..."
Copy-Item "$t\*" "." -Recurse -Force

Write-Host "7. Force-pushing gh-pages..."
C:\Users\User\Git\cmd\git.exe add -A
C:\Users\User\Git\cmd\git.exe commit -m "Deploy fixed mediaLink engine and fresh cache.json to gh-pages"
C:\Users\User\Git\cmd\git.exe push origin gh-pages --force

Write-Host "8. Returning to master..."
C:\Users\User\Git\cmd\git.exe checkout master
C:\Users\User\Git\cmd\git.exe submodule update --init --recursive
Remove-Item $t -Recurse -Force
Write-Host "ALL_FIXES_DEPLOYED_SUCCESSFULLY!"
