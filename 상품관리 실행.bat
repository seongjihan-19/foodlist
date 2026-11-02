@echo off
rem 더블클릭으로 상품 관리 앱 실행: 처음이면 패키지 설치 후 개발 서버를 켜고 브라우저를 연다
chcp 65001 > nul
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

where npm > nul 2> nul
if errorlevel 1 (
  echo [오류] Node.js를 찾을 수 없습니다. https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist node_modules (
  echo 처음 실행이라 필요한 패키지를 설치합니다. 1~2분 걸릴 수 있습니다...
  call npm install
  if errorlevel 1 (
    echo [오류] 패키지 설치에 실패했습니다. 위 메시지를 확인하세요.
    pause
    exit /b 1
  )
)

echo.
echo 상품 관리를 시작합니다. 잠시 후 브라우저가 열립니다.
echo 사용을 마치려면 이 창을 닫으세요.
echo.
call npm run dev -- --open
pause
