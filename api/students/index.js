// Vercel Serverless 函数 - 学生查询API
// 这是一个简单的无状态函数，处理学生查询请求

// 模拟学生数据（演示用）
const sampleStudents = [
  { id: 1, name: '张三', student_id: 'STU001', class: '一班', chinese_score: 85, math_score: 92, english_score: 88, total_score: 265 },
  { id: 2, name: '李四', student_id: 'STU002', class: '一班', chinese_score: 78, math_score: 85, english_score: 81, total_score: 244 },
  { id: 3, name: '王五', student_id: 'STU003', class: '二班', chinese_score: 90, math_score: 88, english_score: 92, total_score: 270 },
  { id: 4, name: '赵六', student_id: 'STU004', class: '二班', chinese_score: 75, math_score: 80, english_score: 79, total_score: 234 },
  { id: 5, name: '孙七', student_id: 'STU005', class: '三班', chinese_score: 88, math_score: 91, english_score: 87, total_score: 266 },
  { id: 6, name: '周八', student_id: 'STU006', class: '三班', chinese_score: 82, math_score: 84, english_score: 83, total_score: 249 },
  { id: 7, name: '吴九', student_id: 'STU007', class: '一班', chinese_score: 91, math_score: 89, english_score: 90, total_score: 270 },
  { id: 8, name: '郑十', student_id: 'STU008', class: '二班', chinese_score: 76, math_score: 81, english_score: 80, total_score: 237 },
];

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

// 按学号查询
function queryById(studentId) {
  return sampleStudents.filter(s => s.student_id === studentId);
}

// 按姓名查询（模糊搜索）
function queryByName(name) {
  return sampleStudents.filter(s => s.name.includes(name));
}

// 按班级查询
function queryByClass(className) {
  return sampleStudents.filter(s => s.class === className);
}

// 获取所有学生
function queryAll() {
  return sampleStudents;
}

// 分页处理
function paginate(data, page, pageSize) {
  const offset = (page - 1) * pageSize;
  const paginatedData = data.slice(offset, offset + pageSize);
  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    data: paginatedData,
    pagination: {
      currentPage: page,
      pageSize,
      totalRecords,
      totalPages
    }
  };
}

// 主处理函数
export default function handler(req, res) {
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

    // 根据查询类型执行不同的查询
    switch (type) {
      case 'id':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按学号查询时，value参数不能为空'
          });
        }
        results = queryById(value);
        break;

      case 'name':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按姓名查询时，value参数不能为空'
          });
        }
        results = queryByName(value);
        break;

      case 'class':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: '按班级查询时，value参数不能为空'
          });
        }
        results = queryByClass(value);
        break;

      case 'all':
        results = queryAll();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'type参数无效，必须为 id、name、class 或 all'
        });
    }

    // 分页处理
    const { data, pagination } = paginate(results, page, pageSize);

    return res.status(200).json({
      success: true,
      data,
      pagination,
      message: data.length > 0 ? '查询成功' : '没有找到匹配的结果'
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
