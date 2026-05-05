# 学生成绩查询系统

一个完整的全栈应用，使用 Vue 3 前端、Node.js 后端和 PostgreSQL 数据库，部署在 Vercel 上。

## 功能特性

- 按学号查询学生成绩
- 按姓名查询学生成绩（支持模糊搜索）
- 按班级查询学生成绩
- 分页显示查询结果（每页 10 条）
- 实时计算总分

## 技术栈

- **前端**：Vue 3 + Vite + Element Plus
- **后端**：Node.js + Express.js
- **数据库**：PostgreSQL (Vercel Postgres)
- **部署**：Vercel

## 开发流程

### 1. 本地开发环境配置

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../api
npm install

# 初始化数据库（需要 POSTGRES_URL）
node init-db.js

# 启动后端（在 api 目录）
npm start

# 启动前端（新终端，在 frontend 目录）
npm run dev
```

### 2. 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量 `POSTGRES_URL`
4. 部署

## 项目结构

```
grade-query-system/
├── frontend/          # Vue 3 前端应用
├── api/              # Node.js 后端 Serverless Functions
├── vercel.json       # Vercel 配置
├── .gitignore
├── .env.local        # 本地环境变量（不上传 Git）
└── README.md
```

## 数据库初始化

运行 `node api/init-db.js` 自动创建表并导入 50 条样例数据。

## API 文档

### GET /api/students

查询学生成绩。

**查询参数：**
- `type` (string, required): 查询类型 - `'id'`, `'name'`, `'class'`, `'all'`
- `value` (string, optional): 查询值（type 为 'all' 时可省略）
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 10

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "student_id": "2024001",
      "class": "高一(1)班",
      "chinese_score": 85,
      "math_score": 92,
      "english_score": 88,
      "total_score": 265
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalRecords": 50,
    "totalPages": 5
  },
  "message": "查询成功"
}
```

## 许可证

MIT
