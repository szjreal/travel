// JWT 鉴权中间件：验证 token，把用户信息挂到 req.user
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    // 1. 从请求头拿到 token
    // 请求头格式：Authorization: Bearer xxxxx.xxxxx.xxxxx
    const token = req.headers.authorization?.split(' ')[1];

    // 2. 没有 token → 未登录
    if (!token) {
      return res.status(401).json({ code: 1, msg: '请先登录' });
    }

    // 3. 验证 token 并解出载荷
    // verify 会在 token 无效或过期时抛错
    //token 没被篡改 → 返回载荷 { id: 1, username: 'test1', iat: ..., exp: ... }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. 把解出的用户信息挂到 req 上，后续接口能用 req.user.id
    req.user = decoded;

    // 5. next() 放行，进入下一个中间件或路由处理函数
    next();
  } catch (err) {
    // token 无效或过期
    return res.status(401).json({ code: 1, msg: 'token无效或已过期，请重新登录' });
  }
};

export default auth;