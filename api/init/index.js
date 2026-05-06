// 数据库初始化端点
import db from '../db-serverless.js';
import { sampleStudents } from '../sample-data.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只允许POST请求'
    });
  }

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
      let skippedCount = 0;
      
      for (const student of sampleStudents) {
        try {
          await db.insertStudent(student);
          insertedCount++;
        } catch (error) {
          if (error.message.includes('duplicate') || error.message.includes('Duplicate')) {
            console.log(`⚠️  学号 ${student.student_id} 已存在，跳过`);
            skippedCount++;
          } else {
            throw error;
          }
        }
      }
      console.log(`✓ 成功导入 ${insertedCount} 条学生数据，跳过 ${skippedCount} 条重复数据`);
    } else {
      console.log('\n⚠️  数据库已包含数据，跳过数据导入');
    }

    // 第3步：验证数据
    const count = await db.getStudentCount('all');
    console.log(`\n✓ 数据库初始化完成！当前数据库包含 ${count} 条学生记录`);

    return res.status(200).json({
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
      error: error.message || '未知错误'
    });
  }
}
