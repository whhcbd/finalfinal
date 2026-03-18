@echo off
echo ========================================
echo 启动遗传学学习平台 - 前端服务
echo ========================================
echo.

cd /d "c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app"

echo 检查 Node.js 环境...
node --version
if errorlevel 1 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 检查依赖是否已安装...
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
)

echo.
echo 启动前端开发服务器...
echo 服务地址: http://localhost:5173
echo 按 Ctrl+C 停止服务
echo.

npm run dev

pause
