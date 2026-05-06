// Serverless兼容的数据库模块 - 使用pg库支持direct connection
import { Client } from 'pg';

// 获取数据库连接字符串
function getConnectionString() {
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error('未找到有效的数据库连接字符串 (DATABASE_URL, POSTGRES_URL, or PRISMA_DATABASE_URL)');
  }

  return connectionString;
}

// 创建数据库客户端
async function createClient() {
  const client = new Client({
    connectionString: getConnectionString()
  });
  await client.connect();
  return client;
}

// 初始化数据库表
export async function initializeDatabase() {
  const client = await createClient();
  
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
    await client.end();
  }
}

// 按学号查询单个学生
export async function queryStudentById(studentId) {
  const client = await createClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
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
    await client.end();
  }
}

// 按姓名查询（模糊搜索）
export async function queryStudentByName(name, limit = 100, offset = 0) {
  const client = await createClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
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
    await client.end();
  }
}

// 按班级查询
export async function queryStudentByClass(className, limit = 100, offset = 0) {
  const client = await createClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
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
    await client.end();
  }
}

// 获取所有学生（分页）
export async function queryAllStudents(limit = 100, offset = 0) {
  const client = await createClient();
  
  try {
    const result = await client.query(
      `SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
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
    await client.end();
  }
}

// 获取查询结果总数
export async function getStudentCount(type, value = null) {
  const client = await createClient();
  
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
    await client.end();
  }
}

// 插入学生数据
export async function insertStudent(student) {
  const client = await createClient();
  
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
    await client.end();
  }
}

// 检查表是否为空
export async function isTableEmpty() {
  const client = await createClient();
  
  try {
    const result = await client.query('SELECT COUNT(*) FROM students');
    return parseInt(result.rows[0].count, 10) === 0;
  } catch (error) {
    console.error('检查表是否为空失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// 清空表（用于重新初始化）
export async function clearTable() {
  const client = await createClient();
  
  try {
    await client.query('DELETE FROM students');
    console.log('✓ 表已清空');
  } catch (error) {
    console.error('清空表失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

export default {
  initializeDatabase,
  queryStudentById,
  queryStudentByName,
  queryStudentByClass,
  queryAllStudents,
  getStudentCount,
  insertStudent,
  isTableEmpty,
  clearTable
};
