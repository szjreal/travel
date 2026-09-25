import express from 'express';
import travelService from '../service/travelService.js';
import {createStreamResponse} from '../untils/streamUtils.js';
import pool from '../db/index.js';
import auth from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 推荐景点接口
router.post("/recommend", async (req, res) => {
    const {city, budget, days} = req.body;
    if (!city || !budget || !days) {
        return res.status(400).json({ success: false, message: '参数错误' });
    }
    const result = await travelService.recommend(city, budget, days);
    return res.json(result);
});

// SSE 流式对话 + 存储消息
router.post("/chat", async (req, res) => {
    const { message, history = [], session_id, scene } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: '参数错误' });
    }

    // 从请求头提取 token 获取 user_id（可选，未登录则不存储）
    let userId = null;
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        }
    } catch (e) { /* token 无效，不存储，但不影响对话 */ }

    // 如果有 user_id 但无 session_id，新建 chat_sessions 记录
    let currentSessionId = session_id;
    if (userId && !currentSessionId && scene !== 'pk') {
        const title = message.substring(0, 30);
        const [result] = await pool.execute(
            'INSERT INTO chat_sessions (user_id, title, scene, message_count) VALUES (?, ?, ?, 0)',
            [userId, title, scene || 'general']
        );
        currentSessionId = result.insertId;
    }

    // 如果有 user_id，存储用户消息到 chat_messages
    if (userId && currentSessionId) {
        await pool.execute(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [currentSessionId, 'user', message]
        );
    }

    const stream = createStreamResponse(res);

    // 如果新建了 session，先发送 session_id 事件
    if (userId && !session_id && currentSessionId) {
        stream.send({ type: 'session', session_id: currentSessionId });
    }

    let fullAiResponse = '';

    const result = await travelService.chat(message, history, (chunk) => {
        stream.send({ type: 'chunk', content: chunk });
        fullAiResponse += chunk;
    });

    stream.end();

    // AI 回复完成后，存储完整 AI 消息并更新 message_count
    if (userId && currentSessionId && fullAiResponse) {
        await pool.execute(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [currentSessionId, 'ai', fullAiResponse]
        );
        await pool.execute(
            'UPDATE chat_sessions SET message_count = message_count + 2, updated_at = NOW() WHERE id = ?',
            [currentSessionId]
        );
    }
});

// ============ 新增 GET API（均需 auth 中间件） ============

// 会话列表
router.get("/sessions", auth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, title, scene, tag, tag_type, message_count, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
            [req.user.id]
        );
        res.json({ code: 0, data: rows });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取会话列表失败' });
    }
});

// 会话消息
router.get("/sessions/:id/messages", auth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [req.params.id]
        );
        res.json({ code: 0, data: rows });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取会话消息失败' });
    }
});

// 分页历史
router.get("/history", auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        // LIMIT/OFFSET 直接拼数字，MySQL2 预处理参数化有时会因类型报错
        const [rows] = await pool.execute(
            `SELECT id, title, scene, tag, tag_type, message_count, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
            [req.user.id]
        );
        const [countRows] = await pool.execute(
            'SELECT COUNT(*) as total FROM chat_sessions WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ code: 0, data: { list: rows, total: countRows[0].total } });
    } catch (e) {
        console.error('[/history] error:', e);
        res.status(500).json({ code: 1, msg: '获取历史记录失败' });
    }
});

// 统计数据
router.get("/stats", auth, async (req, res) => {
    try {
        const [chatCount] = await pool.execute('SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?', [req.user.id]);
        const [favCount] = await pool.execute('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?', [req.user.id]);
        const [cityCount] = await pool.execute('SELECT COUNT(DISTINCT city) as count FROM favorites WHERE user_id = ?', [req.user.id]);
        const [monthActive] = await pool.execute("SELECT COUNT(DISTINCT DATE(updated_at)) as count FROM chat_sessions WHERE user_id = ? AND updated_at >= DATE_FORMAT(NOW(), '%Y-%m-01')", [req.user.id]);
        const [spotCount] = await pool.execute("SELECT COUNT(*) as count FROM chat_messages m JOIN chat_sessions s ON m.session_id = s.id WHERE s.user_id = ? AND m.content LIKE '%景点%'", [req.user.id]);
        res.json({ code: 0, data: { chatCount: chatCount[0].count, favoriteCount: favCount[0].count, cityCount: cityCount[0].count, monthActive: monthActive[0].count, spotCount: spotCount[0].count } });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取统计数据失败' });
    }
});

// 近7天趋势
router.get("/chat-trend", auth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT DATE(created_at) as date, COUNT(*) as count FROM chat_messages m JOIN chat_sessions s ON m.session_id = s.id WHERE s.user_id = ? AND m.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date ASC",
            [req.user.id]
        );
        res.json({ code: 0, data: rows });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取趋势数据失败' });
    }
});

// 最近3条会话
router.get("/recent-chats", auth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, title, tag, tag_type, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3',
            [req.user.id]
        );
        res.json({ code: 0, data: rows });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取最近会话失败' });
    }
});

// 场景排行
router.get("/scene-ranking", auth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT scene, COUNT(*) as count FROM chat_sessions WHERE user_id = ? GROUP BY scene ORDER BY count DESC',
            [req.user.id]
        );
        const total = rows.reduce((sum, r) => sum + r.count, 0);
        const data = rows.map(r => ({ scene: r.scene, count: r.count, percent: total > 0 ? Math.round(r.count / total * 100) : 0 }));
        res.json({ code: 0, data });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '获取场景排行失败' });
    }
});

// 删除会话（POST 方式）
router.post("/sessions/:id/delete", auth, async (req, res) => {
    try {
        await pool.execute('DELETE FROM chat_messages WHERE session_id = ?', [req.params.id]);
        await pool.execute('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ code: 0, msg: '删除成功' });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '删除失败' });
    }
});

export default router;
