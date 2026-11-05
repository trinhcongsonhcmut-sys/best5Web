@echo off
rem ============================================================
rem  BAHA 3D SHOWCASE - mo website bang 1 cu bam dup
rem  Lan dau se tu cai thu vien (can Internet). Cac lan sau mo ngay.
rem ============================================================
setlocal
cd /d "%~dp0"
title BAHA 3D Showcase
echo.
echo  BAHA 3D SHOWCASE
echo  ----------------

where node >nul 2>nul
if errorlevel 1 (
  echo  [LOI] Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Dang cai thu vien lan dau, vui long cho...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo  [LOI] npm install that bai. & pause & exit /b 1 )
)

echo  Dang dong goi ban moi nhat...
call npm run build
if errorlevel 1 ( echo  [LOI] Build that bai. & pause & exit /b 1 )

echo.
echo  Website: http://localhost:5181/   (dong cua so nay de tat)
echo   /            Gallery
echo   /beauty  /fnb  /real-estate  /fashion  /automotive
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5181/"
call npx vite preview --port 5181 --strictPort --host
pause
