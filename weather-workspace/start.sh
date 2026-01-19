#!/bin/bash

# 天气预报H5应用启动脚本

echo "🌤️  天气预报H5应用启动中..."
echo ""

# 检查文件是否存在
if [ ! -f "workspace/dist/index.html" ]; then
    echo "❌ 错误: 找不到应用文件，请确保在正确的目录中运行"
    exit 1
fi

echo "📁 应用文件位置: $(pwd)/workspace/dist/index.html"
echo ""
echo "🔑 请确保您已经配置了OpenWeatherMap API密钥"
echo "   编辑文件: workspace/dist/js/weather.js"
echo "   替换: YOUR_OPENWEATHERMAP_API_KEY"
echo ""
echo "🌐 在浏览器中打开以下地址开始使用:"
echo "   file://$(pwd)/workspace/dist/index.html"
echo ""
echo "💡 提示: 您也可以使用本地服务器运行应用"
echo "   例如: python -m http.server 8000"
echo "   然后访问: http://localhost:8000/workspace/dist/index.html"

# 尝试启动本地服务器（如果python可用）
if command -v python3 &> /dev/null; then
    echo ""
    echo "🚀 正在启动本地服务器..."
    cd workspace/dist
    python3 -m http.server 8000 &
    SERVER_PID=$!
    echo "✅ 本地服务器已启动: http://localhost:8000"
    echo "   按 Ctrl+C 停止服务器"
    wait $SERVER_PID
elif command -v python &> /dev/null; then
    echo ""
    echo "🚀 正在启动本地服务器..."
    cd workspace/dist
    python -m http.server 8000 &
    SERVER_PID=$!
    echo "✅ 本地服务器已启动: http://localhost:8000"
    echo "   按 Ctrl+C 停止服务器"
    wait $SERVER_PID
else
    echo ""
    echo "⚠️  未找到Python，请手动在浏览器中打开HTML文件"
fi