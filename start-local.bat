@echo off
rem 本地预览：直接双击 index.html / reader.html（file:// 协议）会被浏览器
rem 拦截 fetch，导致文章列表和正文无法加载。此脚本起一个本地服务器再打开页面。
cd /d "%~dp0"
echo.
echo  ==========================================
echo   qiyuxi24.github.io 本地预览服务器
echo   （热重载：保存文件后浏览器自动刷新）
echo  ==========================================
echo.
start "" http://localhost:8899/
node scripts/serve-local.mjs 8899
pause
