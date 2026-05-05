import { sql } from '@vercel/postgres';
import { sampleStudents } from './sample-data.js';

// 创建表的SQL语句
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    class VARCHAR(50) NOT NULL,
    chinese_score DECIMAL(5,2),
    math_score DECIMAL(5,2),
    english_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
  CREATE INDEX IF NOT EXISTS idx_name ON students(name);
  CREATE INDEX IF NOT EXISTS idx_class ON students(class);
`;

// Vercel Serverless Function处理程序
export default async function handler(req, res) {
  // 仅允许GET和POST请求
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 开始初始化数据库...');

    // 第1步：创建表
    console.log('📋 正在创建数据库表...');
    await sql.query(createTablesSQL);
    console.log('✓ 数据库表创建成功或已存在');

    // 第2步：检查表是否为空
    const countResult = await sql`SELECT COUNT(*) as count FROM students`;
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount === 0) {
      console.log('\n📊 正在导入 50 条样例数据...');
      let insertedCount = 0;
      
      for (const student of sampleStudents) {
        try {
          await sql`
            INSERT INTO students (name, student_id, class, chinese_score, math_score, english_score)
            VALUES (${student.name}, ${student.student_id}, ${student.class}, ${student.chinese_score}, ${student.math_score}, ${student.english_score})
          `;
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
      console.log(`\n⚠️  数据库已包含 ${currentCount} 条数据，跳过数据导入`);
    }

    // 第3步：验证数据
    const finalCountResult = await sql`SELECT COUNT(*) as count FROM students`;
    const finalCount = parseInt(finalCountResult.rows[0].count, 10);

    console.log(`\n✓ 数据库初始化完成！当前数据库包含 ${finalCount} 条学生记录`);

    return res.status(200).json({
      success: true,
      message: '数据库初始化成功',
      data: {
        totalRecords: finalCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error.message);
    return res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: error.message
    });
  }
}
