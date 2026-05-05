import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import { sampleStudents } from './sample-data.js';
import db from './db.js';

dotenv.config({ path: '../.env.local' });

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 1. 初始化表
    console.log('\n📋 正在创建数据库表...');
    await db.initializeDatabase();
    
    // 2. 检查表是否为空
    const isEmpty = await db.isTableEmpty();
    
    if (isEmpty) {
      console.log('\n📊 正在导入 50 条样例数据...');
      let insertedCount = 0;
      for (const student of sampleStudents) {
        try {
          await db.insertStudent(student);
          insertedCount++;
        } catch (error) {
          if (error.message.includes('duplicate key')) {
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
    
    // 3. 验证数据
    const count = await db.getStudentCount('all');
    console.log(`\n✓ 数据库初始化完成！当前数据库包含 ${count} 条学生记录`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

initDatabase();
