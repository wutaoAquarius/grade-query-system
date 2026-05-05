import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import { sampleStudents } from './sample-data.js';

dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// GET /api/students - 查询学生成绩
app.get('/api/students', async (req, res) => {
  try {
    const { type = 'all', value, page = '1', pageSize = '10' } = req.query;
    
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));
    const offset = (currentPage - 1) * size;
    
    let data = [];
    let totalRecords = 0;
    
    // 根据查询类型执行不同的查询
    if (type === 'id') {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: '按学号查询时，value 参数不能为空'
        });
      }
      data = await db.queryStudentById(value);
      totalRecords = data.length;
    } else if (type === 'name') {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: '按姓名查询时，value 参数不能为空'
        });
      }
      data = await db.queryStudentByName(value, size, offset);
      totalRecords = await db.getStudentCount('name', value);
    } else if (type === 'class') {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: '按班级查询时，value 参数不能为空'
        });
      }
      data = await db.queryStudentByClass(value, size, offset);
      totalRecords = await db.getStudentCount('class', value);
    } else if (type === 'all') {
      data = await db.queryAllStudents(size, offset);
      totalRecords = await db.getStudentCount('all');
    } else {
      return res.status(400).json({
        success: false,
        message: 'type 参数无效，必须为 id、name、class 或 all'
      });
    }
    
    const totalPages = Math.ceil(totalRecords / size);
    
    return res.json({
      success: true,
      data: data,
      pagination: {
        currentPage,
        pageSize: size,
        totalRecords,
        totalPages
      },
      message: data.length > 0 ? '查询成功' : '没有找到匹配的结果'
    });
  } catch (error) {
    console.error('API 错误:', error.message);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 初始化数据库端点
app.post('/api/init', async (req, res) => {
  try {
    console.log('🚀 开始初始化数据库...');

    // 第1步：初始化表
    console.log('📋 正在创建数据库表...');
    await db.initializeDatabase();
    console.log('✓ 数据库表创建成功或已存在');

    // 第2步：检查表是否为空
    const isEmpty = await db.isTableEmpty();

    if (isEmpty) {
      console.log('\n📊 正在导入 50 条样例数据...');
      let insertedCount = 0;
      
      for (const student of sampleStudents) {
        try {
          await db.insertStudent(student);
          insertedCount++;
        } catch (error) {
          if (error.message.includes('duplicate')) {
            console.log(`⚠️  学号 ${student.student_id} 已存在，跳过`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✓ 成功导入 ${insertedCount} 条学生数据`);
    } else {
      console.log('\n⚠️  数据库已包含数据，跳过数据导入');
    }

    // 第3步：验证数据
    const count = await db.getStudentCount('all');
    console.log(`\n✓ 数据库初始化完成！当前数据库包含 ${count} 条学生记录`);

    return res.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        totalRecords: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    return res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: error.message
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`\n✓ 服务器运行在 http://localhost:${PORT}`);
  console.log(`✓ API 端点: http://localhost:${PORT}/api/students`);
  console.log(`✓ 健康检查: http://localhost:${PORT}/api/health\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;
