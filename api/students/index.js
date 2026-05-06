// Vercel Serverless 函数 - 学生查询API (使用真实数据库)
import db from '../db-serverless.js';

// 解析查询参数
function parseParams(req) {
  const { type = 'all', value = '', page = '1', pageSize = '10' } = req.query || {};
  
  return {
    type,
    value,
    page: Math.max(1, parseInt(page, 10) || 1),
    pageSize: Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10))
  };
}

// 主处理函数
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '只允许GET请求'
    });
  }

  try {
    const { type, value, page, pageSize } = parseParams(req);
    let results = [];
    let totalRecords = 0;
    const offset = (page - 1) * pageSize;

    // 根据查询类型执行不同的查询
    switch (type) {
      case 'id':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按学号查询时，value参数不能为空'
          });
        }
        results = await db.queryStudentById(value);
        totalRecords = results.length;
        break;

      case 'name':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按姓名查询时，value参数不能为空'
          });
        }
        results = await db.queryStudentByName(value, pageSize, offset);
        totalRecords = await db.getStudentCount('name', value);
        break;

      case 'class':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按班级查询时，value参数不能为空'
          });
        }
        results = await db.queryStudentByClass(value, pageSize, offset);
        totalRecords = await db.getStudentCount('class', value);
        break;

      case 'all':
        results = await db.queryAllStudents(pageSize, offset);
        totalRecords = await db.getStudentCount('all');
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'type参数无效，必须为 id、name、class 或 all'
        });
    }

    // 计算分页信息
    const totalPages = Math.ceil(totalRecords / pageSize);
    const pagination = {
      currentPage: page,
      pageSize,
      totalRecords,
      totalPages
    };

    return res.status(200).json({
      success: true,
      data: results,
      pagination,
      message: results.length > 0 ? '查询成功' : '没有找到匹配的结果'
    });
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message || '未知错误'
    });
  }
}
