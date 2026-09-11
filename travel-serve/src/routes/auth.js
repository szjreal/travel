// 路由模块：处理 /api/auth 下的所有请求
import { Router } from 'express';
import pool from '../db/index.js';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';  
const router = Router();

// 注册接口：POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    // 1. 从请求体里拿到用户名和密码
    //（1）前端请求body是JSON格式
//     {
//   "username": "jie",
//   "password": "152634"
// }
// （2）经过express.json()中间件处理后，挂载到req.body对象上
// req.body = {
//   username: "jie",
//   password: "152634"
// }
    const { username, password } = req.body;

    // 2. 查重：看这个用户名是否已被注册
    //pool.query(SQL语句, 参数数组) 是让管家去 MySQL 执行一条 SQL 查询，
    // 返回结果。返回的是一个 Promise，所以要用 await 等它查完。
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE username = ?', [username]
     //如果有，返回[
//   [ { id: 1 } ],               // ← 第0个元素：数组里只有1个对象（正如你所说！）
//   [/* 字段元数据，可以忽略 */]
// ]
// 没有则返回
// [
//   [],                          // ← 第0个元素：空数组！一条都没查到
//   [/* 字段元数据，可以忽略 */]
// ]
    );
    if (rows.length > 0) {
      return res.json({ code: 1, msg: '用户名已存在' });
    }

    // 3. 直接存入数据库（明文密码）
    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',[username, password]
      
    );

    // 4. 返回成功
    res.json({ code: 0, msg: '注册成功' });
  } catch (err) {
    // 出错时返回 500
    res.status(500).json({ code: 1, msg: '服务器错误: ' + err.message });
  }
});

// 登录接口：POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // 1. 拿到前端传来的用户名和密码
    const { username, password } = req.body;

    // 2. 按用户名查数据库
    //返回rows = [
//   {
//     id: 2,
//     username: "jie",
//     password: "123456",
//     avatar: "data:image/png;...",
//     nickname: "song",
//     created_at: "2026-07-31 11:..."
//   }
// ]
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    // 3. 判断用户是否存在
    if (!user) {
      return res.json({ code: 1, msg: '用户名或密码错误' });
    }

    // 4. 比对密码（明文直接 ===）
    if (password !== user.password) {
      return res.json({ code: 1, msg: '用户名或密码错误' });
    }

    // 5. 密码正确，签发 JWT token
    //jwt.sign() 是第三方库 jsonwebtoken 提供的函数，
    //作用就是「盖章发证」——把你要带的信息 + 你的密钥 + 配置 = 生成一串不可伪造的 token 字符串。
    //token变成
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqaWUiLCJpYXQiOjE3MjUzNDUwMDAsImV4cCI6MTcyNTk0OTgwMH0.abc123DEF456ghi789JKL012mno345PQR678stu901VWX
    //包含头部（死数据）+载荷（用户信息）+签名（加密后的字符串）
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    // 6. 返回 token 和用户信息给前端
    res.json({
      code: 0,
      msg: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        nickname: user.nickname
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, msg: '服务器错误: ' + err.message });
  }
});

// 获取当前登录用户信息：GET /api/auth/user
// 第二个参数 auth 是中间件，先验证 token 才能进到下面的处理函数
router.get('/user', auth, async (req, res) => {
  try {
    // req.user.id 是中间件解出来的
    const [rows] = await pool.query(
      'SELECT id, username, avatar, nickname, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = rows[0];

    if (!user) {
      return res.json({ code: 1, msg: '用户不存在' });
    }

    res.json({ code: 0, user });
  } catch (err) {
    res.status(500).json({ code: 1, msg: '服务器错误: ' + err.message });
  }
});

// 更换头像：POST /api/auth/avatar（直接存 base64）
router.post('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.json({ code: 1, msg: '未收到头像数据' });
    }
    // 更新数据库
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, req.user.id]
    );
    res.json({ code: 0, msg: '头像更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: '服务器错误: ' + err.message });
  }
});

// 修改昵称：POST /api/auth/nickname
router.post('/nickname', auth, async (req, res) => {
  try {
    const { nickname } = req.body;
    // 校验：昵称不能为空，长度 2-20
    if (!nickname || !nickname.trim()) {
      return res.json({ code: 1, msg: '昵称不能为空' });
    }
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return res.json({ code: 1, msg: '昵称长度需在 2-20 个字符之间' });
    }
    await pool.query(
      'UPDATE users SET nickname = ? WHERE id = ?',
      [trimmed, req.user.id]
    );
    res.json({ code: 0, msg: '昵称修改成功' });
  } catch (err) {
    console.error('修改昵称失败:', err.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});
// 收藏行程：POST /api/auth/favorite
router.post('/favorite', auth, async (req, res) => {
  try {
    const { city, budget, days, plan_data } = req.body;
    if (!city || !plan_data) {
      return res.json({ code: 1, msg: '参数不完整' });
    }

    // 先查重，避免重复收藏同一条行程
    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND city = ? AND days = ?',
      [req.user.id, city, days]
    );
    if (existing.length > 0) {
      return res.json({ code: 0, msg: '该行程已收藏过', alreadyFavorite: true });
    }

    await pool.query(
      'INSERT INTO favorites (user_id, city, budget, days, plan_data) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, city, budget, days, JSON.stringify(plan_data)]
    );
    res.json({ code: 0, msg: '收藏成功' });
  } catch (err) {
    console.error('收藏失败:', err.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 获取我的收藏列表：GET /api/auth/favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, city, budget, days, plan_data, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    // 把 plan_data 从字符串解析回对象
    const list = rows.map(item => ({
       // ① 展开原有字段（id, city, budget, days, created_at）
      ...item,
      //.parse把字符串转回 JS 对象
      //? :是三元运算符，如果item.plan_data存在，就解析为对象，否则返回null
      plan_data: item.plan_data ? JSON.parse(item.plan_data) : null
    }));
    res.json({ code: 0, data: list });
  } catch (err) {
    console.error('获取收藏列表失败:', err.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 删除收藏：POST /api/auth/favorite/delete
router.post('/favorite/delete', auth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ code: 1, msg: '缺少收藏 ID' });
    }
    await pool.query(
      'DELETE FROM favorites WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    console.error('删除收藏失败:', err.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 检查是否已收藏：GET /auth/favorite/check?city=xxx&days=xx
router.get('/favorite/check', auth, async (req, res) => {
  try {
    const { city, days } = req.query;
    if (!city || !days) {
      return res.json({ code: 1, msg: '参数不完整' });
    }
    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND city = ? AND days = ?',
      [req.user.id, city, days]
    );
    //如果查到id，则rows.length > 0为true，否则为false
    res.json({ code: 0, favorited: rows.length > 0 });
  } catch (err) {
    console.error('检查收藏状态失败:', err.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

export default router;