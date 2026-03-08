@echo off
echo ========================================
echo 启动遗传学学习平台 - 后端服务
echo ========================================
echo.

cd /d "c:\trae_coding\A2UI-main\my-a2ui-project\backend"

echo 检查 Python 环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到 Python，请先安装 Python
    pause
    exit /b 1
)

echo.
echo 启动后端服务...
echo 服务地址: http://127.0.0.1:8000
echo 按 Ctrl+C 停止服务
echo.

python main.py

pause
