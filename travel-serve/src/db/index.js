// 数据库连接池模块
import mysql from 'mysql2/promise';
import 'dotenv/config';

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,  // 连接不够时等待
  connectionLimit: 10,       // 最大连接数
  queueLimit: 0
});
// 导出连接池
export default pool;