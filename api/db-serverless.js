// Serverless兼容的数据库模块 - 支持多种连接方式
import { sql } from '@vercel/postgres';
import { Client } from 'pg';

let useVercelPostgres = false;
let usePgClient = false;

// 尝试初始化连接
async function initConnection() {
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error('未找到有效的数据库连接字符串 (DATABASE_URL, POSTGRES_URL, or PRISMA_DATABASE_URL)');
  }

  // 检测是否为pooled connection（@vercel/postgres格式）
  if (connectionString.includes('vercel') || connectionString.includes('pgbouncer') || connectionString.includes('pooler')) {
    useVercelPostgres = true;
    console.log('✓ 使用Vercel Postgres库 (pooled connection)');
  } else {
    // 使用原生pg库处理direct connection
    usePgClient = true;
    console.log('✓ 使用pg库 (direct connection)');
  }
}

// 初始化数据库表
export async function initializeDatabase() {
  try {
    await initConnection();

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

    if (useVercelPostgres) {
      await sql.query(createTableSQL);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      await client.query(createTableSQL);
      await client.end();
    }

    console.log('✓ 数据库表创建成功或已存在');
    return true;
  } catch (error) {
    console.error('✗ 创建表失败:', error.message);
    throw error;
  }
}

// 按学号查询单个学生
export async function queryStudentById(studentId) {
  try {
    await initConnection();

    const query = `
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE student_id = $1
      LIMIT 1
    `;

    let result;
    if (useVercelPostgres) {
      result = await sql(query, [studentId]);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, [studentId]);
      await client.end();
    }

    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 按姓名查询（模糊搜索）
export async function queryStudentByName(name, limit = 100, offset = 0) {
  try {
    await initConnection();

    const query = `
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE name LIKE $1
      LIMIT $2 OFFSET $3
    `;

    let result;
    if (useVercelPostgres) {
      result = await sql(query, [`%${name}%`, limit, offset]);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, [`%${name}%`, limit, offset]);
      await client.end();
    }

    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 按班级查询
export async function queryStudentByClass(className, limit = 100, offset = 0) {
  try {
    await initConnection();

    const query = `
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE class = $1
      LIMIT $2 OFFSET $3
    `;

    let result;
    if (useVercelPostgres) {
      result = await sql(query, [className, limit, offset]);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, [className, limit, offset]);
      await client.end();
    }

    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 获取所有学生（分页）
export async function queryAllStudents(limit = 100, offset = 0) {
  try {
    await initConnection();

    const query = `
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      ORDER BY id
      LIMIT $1 OFFSET $2
    `;

    let result;
    if (useVercelPostgres) {
      result = await sql(query, [limit, offset]);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, [limit, offset]);
      await client.end();
    }

    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 获取查询结果总数
export async function getStudentCount(type, value = null) {
  try {
    await initConnection();

    let query;
    let params;

    if (type === 'id') {
      query = 'SELECT COUNT(*) FROM students WHERE student_id = $1';
      params = [value];
    } else if (type === 'name') {
      query = 'SELECT COUNT(*) FROM students WHERE name LIKE $1';
      params = [`%${value}%`];
    } else if (type === 'class') {
      query = 'SELECT COUNT(*) FROM students WHERE class = $1';
      params = [value];
    } else {
      query = 'SELECT COUNT(*) FROM students';
      params = [];
    }

    let result;
    if (useVercelPostgres) {
      result = await sql(query, params);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, params);
      await client.end();
    }

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('获取数据总数失败:', error.message);
    throw error;
  }
}

// 插入学生数据
export async function insertStudent(student) {
  try {
    await initConnection();

    const query = `
      INSERT INTO students (name, student_id, class, chinese_score, math_score, english_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      student.name,
      student.student_id,
      student.class,
      student.chinese_score,
      student.math_score,
      student.english_score
    ];

    let result;
    if (useVercelPostgres) {
      result = await sql(query, params);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, params);
      await client.end();
    }

    return result.rows[0];
  } catch (error) {
    console.error('插入学生数据失败:', error.message);
    throw error;
  }
}

// 检查表是否为空
export async function isTableEmpty() {
  try {
    await initConnection();

    const query = 'SELECT COUNT(*) FROM students';

    let result;
    if (useVercelPostgres) {
      result = await sql(query, []);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      result = await client.query(query, []);
      await client.end();
    }

    return parseInt(result.rows[0].count, 10) === 0;
  } catch (error) {
    console.error('检查表是否为空失败:', error.message);
    throw error;
  }
}

// 清空表（用于重新初始化）
export async function clearTable() {
  try {
    await initConnection();

    const query = 'DELETE FROM students';

    if (useVercelPostgres) {
      await sql(query, []);
    } else {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
      });
      await client.connect();
      await client.query(query, []);
      await client.end();
    }

    console.log('✓ 表已清空');
  } catch (error) {
    console.error('清空表失败:', error.message);
    throw error;
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
