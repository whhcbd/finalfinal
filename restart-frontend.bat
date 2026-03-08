@echo off
echo ========================================
echo 重启前端服务（修复 Lit DOM 错误后）
echo ========================================
echo.

cd /d "c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app"

echo 正在停止旧的开发服务器...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 清理缓存...
if exist ".vite" (
    rmdir /s /q ".vite"
    echo Vite 缓存已清理
)

echo.
echo 启动前端开发服务器...
echo 服务地址: http://localhost:5173
echo.
echo 修复说明:
echo - 已修复 Lit DOM 冲突错误
echo - ChatOrchestrator 现在返回数据而不是直接操作 DOM
echo - ChatModule 通过 Lit 响应式系统更新内容
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev

pause
