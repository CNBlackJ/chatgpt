const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 路由 - 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API路由示例
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        time: new Date().toISOString(),
        message: '服务器运行正常'
    });
});

// 处理404错误
app.use((req, res) => {
    res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Web服务器运行在 http://localhost:${PORT}`);
    console.log(`您可以通过局域网IP访问: http://您的IP地址:${PORT}`);
});