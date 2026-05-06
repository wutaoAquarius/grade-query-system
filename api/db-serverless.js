// Serverless兼容的数据库模块 - 使用native PostgreSQL驱动
import { Client } from 'pg';

let client = null;

// 获取数据库客户端
async function getClient() {
  if (!client) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL 环境变量未配置');
    }

    client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log('✓ 数据库连接成功');
    } catch (error) {
      console.error('✗ 数据库连接失败:', error.message);
      throw error;
    }
  }

  return client;
}

// 创建表
export async function initializeDatabase() {
  const db = await getClient();
  
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

    await db.query(createTableSQL);
    console.log('✓ 数据库表创建成功或已存在');
    return true;
  } catch (error) {
    console.error('✗ 创建表失败:', error.message);
    throw error;
  }
}

// 按学号查询单个学生
export async function queryStudentById(studentId) {
  const db = await getClient();
  
  try {
    const result = await db.query(
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
  }
}

// 按姓名查询（模糊搜索）
export async function queryStudentByName(name, limit = 100, offset = 0) {
  const db = await getClient();
  
  try {
    const result = await db.query(
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
  }
}

// 按班级查询
export async function queryStudentByClass(className, limit = 100, offset = 0) {
  const db = await getClient();
  
  try {
    const result = await db.query(
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
  }
}

// 获取所有学生（分页）
export async function queryAllStudents(limit = 100, offset = 0) {
  const db = await getClient();
  
  try {
    const result = await db.query(
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
  }
}

// 获取查询结果总数
export async function getStudentCount(type, value = null) {
  const db = await getClient();
  
  try {
    let result;
    
    if (type === 'id') {
      result = await db.query('SELECT COUNT(*) FROM students WHERE student_id = $1', [value]);
    } else if (type === 'name') {
      result = await db.query('SELECT COUNT(*) FROM students WHERE name LIKE $1', [`%${value}%`]);
    } else if (type === 'class') {
      result = await db.query('SELECT COUNT(*) FROM students WHERE class = $1', [value]);
    } else {
      result = await db.query('SELECT COUNT(*) FROM students');
    }
    
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('获取数据总数失败:', error.message);
    throw error;
  }
}

// 插入学生数据
export async function insertStudent(student) {
  const db = await getClient();
  
  try {
    const result = await db.query(
      `INSERT INTO students (name, student_id, class, chinese_score, math_score, english_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [student.name, student.student_id, student.class, student.chinese_score, student.math_score, student.english_score]
    );
    return result.rows[0];
  } catch (error) {
    console.error('插入学生数据失败:', error.message);
    throw error;
  }
}

// 检查表是否为空
export async function isTableEmpty() {
  const db = await getClient();
  
  try {
    const result = await db.query('SELECT COUNT(*) FROM students');
    return parseInt(result.rows[0].count, 10) === 0;
  } catch (error) {
    console.error('检查表是否为空失败:', error.message);
    throw error;
  }
}

// 清空表（用于重新初始化）
export async function clearTable() {
  const db = await getClient();
  
  try {
    await db.query('DELETE FROM students');
    console.log('✓ 表已清空');
  } catch (error) {
    console.error('清空表失败:', error.message);
    throw error;
  }
}

// 关闭连接
export async function closeConnection() {
  if (client) {
    try {
      await client.end();
      client = null;
      console.log('✓ 数据库连接已关闭');
    } catch (error) {
      console.error('关闭连接失败:', error.message);
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
