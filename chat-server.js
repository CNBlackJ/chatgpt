const WebSocket = require('ws');
const http = require('http');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('局域网群聊服务器运行中\n');
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储连接的客户端信息
const clients = new Map();
let clientId = 0;

// 广播消息给所有连接的客户端
function broadcast(data, excludeClient = null) {
    const message = JSON.stringify(data);
    
    wss.clients.forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 处理新的WebSocket连接
wss.on('connection', (ws) => {
    // 为新客户端分配唯一ID
    const id = clientId++;
    clients.set(id, { ws, nickname: null });
    
    console.log(`新客户端连接，ID: ${id}，当前连接数: ${clients.size}`);
    
    // 发送当前在线人数给所有客户端
    broadcast({
        type: 'userCount',
        count: clients.size
    });
    
    // 处理收到的消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const client = clients.get(id);
            
            // 处理用户加入
            if (data.type === 'join' && data.sender) {
                client.nickname = data.sender;
                console.log(`用户加入: ${data.sender} (ID: ${id})`);
                
                // 广播用户加入消息
                broadcast({
                    type: 'join',
                    sender: data.sender,
                    timestamp: data.timestamp,
                    userCount: clients.size
                }, ws);
                
                // 向新加入的用户发送欢迎消息
                ws.send(JSON.stringify({
                    type: 'system',
                    content: `欢迎加入群聊，当前有 ${clients.size} 人在线`,
                    timestamp: new Date().toISOString()
                }));
            }
            // 处理用户离开
            else if (data.type === 'leave' && client.nickname) {
                console.log(`用户离开: ${client.nickname} (ID: ${id})`);
                
                // 广播用户离开消息
                broadcast({
                    type: 'leave',
                    sender: client.nickname,
                    timestamp: data.timestamp,
                    userCount: clients.size - 1
                });
            }
            // 处理聊天消息
            else if (data.type === 'message' && client.nickname && data.content) {
                console.log(`消息来自 ${client.nickname}: ${data.content}`);
                
                // 广播聊天消息
                broadcast({
                    type: 'message',
                    sender: client.nickname,
                    content: data.content,
                    timestamp: data.timestamp
                });
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        const client = clients.get(id);
        clients.delete(id);
        
        console.log(`客户端断开连接，ID: ${id}，当前连接数: ${clients.size}`);
        
        // 如果是已登录用户，广播离开消息
        if (client && client.nickname) {
            broadcast({
                type: 'leave',
                sender: client.nickname,
                timestamp: new Date().toISOString(),
                userCount: clients.size
            });
        } else {
            // 发送当前在线人数给所有客户端
            broadcast({
                type: 'userCount',
                count: clients.size
            });
        }
    });
    
    // 处理错误
    ws.on('error', (error) => {
        console.error(`客户端错误 (ID: ${id}):`, error);
    });
});

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`WebSocket 服务地址: ws://localhost:${PORT}`);
    console.log(`局域网内其他设备可通过 ws://你的IP地址:${PORT} 连接`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});
    