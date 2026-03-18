@echo off
echo ========================================
echo 重启后端服务（修复 A2UI 包装器后）
echo ========================================
echo.

cd /d "c:\trae_coding\A2UI-main\my-a2ui-project\backend"

echo 正在停止旧的后端服务...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *main.py*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 启动后端服务...
echo 服务地址: http://127.0.0.1:8000
echo.
echo 修复说明:
echo - 已添加自动包装器修复功能
echo - LLM 返回的 A2UI JSON 会自动添加缺失的 literalString/literalBoolean 等包装器
echo - 查看日志中的 "自动修复了 X 个缺失的类型包装器" 信息
echo.
echo 按 Ctrl+C 停止服务
echo.

python main.py

pause
