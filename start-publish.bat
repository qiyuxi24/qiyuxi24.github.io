@echo off
rem ==========================================
rem  qiyuxi24.github.io 发布工作台
rem   GUI 编辑 Markdown / 图片上传 / 公式预览 / 一键发布
rem ==========================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org/
  pause
  exit /b 1
)

echo 正在启动发布工作台...
echo 浏览器将自动打开 http://localhost:3456/
echo 关闭本窗口即停止服务。
echo.
start "" http://localhost:3456/
node scripts/publish-server.mjs 3456
pause
