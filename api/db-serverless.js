// Serverless兼容的数据库模块 - 使用@vercel/postgres
import { sql } from '@vercel/postgres';

// 初始化数据库表
export async function initializeDatabase() {
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

    await sql.query(createTableSQL);
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
    const result = await sql`
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE student_id = ${studentId}
      LIMIT 1
    `;
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 按姓名查询（模糊搜索）
export async function queryStudentByName(name, limit = 100, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE name LIKE ${'%' + name + '%'}
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 按班级查询
export async function queryStudentByClass(className, limit = 100, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      WHERE class = ${className}
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 获取所有学生（分页）
export async function queryAllStudents(limit = 100, offset = 0) {
  try {
    const result = await sql`
      SELECT 
        id, name, student_id, class, 
        chinese_score, math_score, english_score,
        (COALESCE(chinese_score, 0) + COALESCE(math_score, 0) + COALESCE(english_score, 0))::DECIMAL(5,2) as total_score
      FROM students 
      ORDER BY id
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    throw error;
  }
}

// 获取查询结果总数
export async function getStudentCount(type, value = null) {
  try {
    let result;
    
    if (type === 'id') {
      result = await sql`SELECT COUNT(*) FROM students WHERE student_id = ${value}`;
    } else if (type === 'name') {
      result = await sql`SELECT COUNT(*) FROM students WHERE name LIKE ${'%' + value + '%'}`;
    } else if (type === 'class') {
      result = await sql`SELECT COUNT(*) FROM students WHERE class = ${value}`;
    } else {
      result = await sql`SELECT COUNT(*) FROM students`;
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
    const result = await sql`
      INSERT INTO students (name, student_id, class, chinese_score, math_score, english_score)
      VALUES (${student.name}, ${student.student_id}, ${student.class}, ${student.chinese_score}, ${student.math_score}, ${student.english_score})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('插入学生数据失败:', error.message);
    throw error;
  }
}

// 检查表是否为空
export async function isTableEmpty() {
  try {
    const result = await sql`SELECT COUNT(*) FROM students`;
    return parseInt(result.rows[0].count, 10) === 0;
  } catch (error) {
    console.error('检查表是否为空失败:', error.message);
    throw error;
  }
}

// 清空表（用于重新初始化）
export async function clearTable() {
  try {
    await sql`DELETE FROM students`;
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
