// Serverless兼容的数据库模块 - 使用native PostgreSQL驱动
import { Client } from 'pg';
import { Pool } from 'pg';

let client = null;
let pool = null;

// 获取数据库连接池
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL 环境变量未配置');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('池中发生错误:', err);
    });

    console.log('✓ 数据库连接池创建成功');
  }

  return pool;
}

// 获取数据库客户端（从池中获取）
async function getClient() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    console.log('✓ 从连接池获取客户端成功');
    return client;
  } catch (error) {
    console.error('✗ 从连接池获取客户端失败:', error.message);
    throw error;
  }
}

// 创建表
export async function initializeDatabase() {
  const client = await getClient();
  
  try {
    const createTableSQL = `
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

    await client.query(createTableSQL);
    console.log('✓ 数据库表创建成功或已存在');
    return true;
  } catch (error) {
    console.error('✗ 创建表失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 按学号查询单个学生
export async function queryStudentById(studentId) {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        CAST(COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0) AS DECIMAL(5,2)) as total_score
      FROM students 
      WHERE student_id = $1
      LIMIT 1`,
      [studentId]
    );
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 按姓名查询（模糊搜索）
export async function queryStudentByName(name, limit = 100, offset = 0) {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        CAST(COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0) AS DECIMAL(5,2)) as total_score
      FROM students 
      WHERE name LIKE $1
      LIMIT $2 OFFSET $3`,
      [`%${name}%`, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 按班级查询
export async function queryStudentByClass(className, limit = 100, offset = 0) {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        CAST(COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0) AS DECIMAL(5,2)) as total_score
      FROM students 
      WHERE class = $1
      LIMIT $2 OFFSET $3`,
      [className, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 获取所有学生（分页）
export async function queryAllStudents(limit = 100, offset = 0) {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        CAST(COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0) AS DECIMAL(5,2)) as total_score
      FROM students 
      ORDER BY id
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 获取查询结果总数
export async function getStudentCount(type, value = null) {
  const client = await getClient();
  
  try {
    let result;
    
    if (type === 'id') {
      result = await client.query('SELECT COUNT(*) FROM students WHERE student_id = $1', [value]);
    } else if (type === 'name') {
      result = await client.query('SELECT COUNT(*) FROM students WHERE name LIKE $1', [`%${value}%`]);
    } else if (type === 'class') {
      result = await client.query('SELECT COUNT(*) FROM students WHERE class = $1', [value]);
    } else {
      result = await client.query('SELECT COUNT(*) FROM students');
    }
    
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('获取数据总数失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 插入学生数据
export async function insertStudent(student) {
  const client = await getClient();
  
  try {
    const result = await client.query(
      `INSERT INTO students (name, student_id, class, chinese_score, math_score, english_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [student.name, student.student_id, student.class, student.chinese_score, student.math_score, student.english_score]
    );
    return result.rows[0];
  } catch (error) {
    console.error('插入学生数据失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 检查表是否为空
export async function isTableEmpty() {
  const client = await getClient();
  
  try {
    const result = await client.query('SELECT COUNT(*) FROM students');
    return parseInt(result.rows[0].count, 10) === 0;
  } catch (error) {
    console.error('检查表是否为空失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 清空表（用于重新初始化）
export async function clearTable() {
  const client = await getClient();
  
  try {
    await client.query('DELETE FROM students');
    console.log('✓ 表已清空');
  } catch (error) {
    console.error('清空表失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 关闭连接池
export async function closeConnection() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('✓ 数据库连接池已关闭');
    } catch (error) {
      console.error('关闭连接池失败:', error.message);
      throw error;
    }
  }
}

export default {
  getClient,
  initializeDatabase,
  queryStudentById,
  queryStudentByName,
  queryStudentByClass,
  queryAllStudents,
  getStudentCount,
  insertStudent,
  isTableEmpty,
  clearTable,
  closeConnection
};
