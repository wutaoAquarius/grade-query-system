# 数据库配置说明

## 概述

本项目使用PostgreSQL数据库存储学生成绩数据。为了在Vercel上正确运行，需要配置数据库连接。

## 前置条件

1. 有一个PostgreSQL数据库（可以使用Prisma、Neon、Supabase等服务）
2. 获取数据库的连接字符串（POSTGRES_URL）

## 配置步骤

### 1. 获取PostgreSQL连接字符串

根据你使用的数据库服务获取连接字符串：

- **Prisma Data Platform**: https://www.prisma.io/
- **Neon**: https://neon.tech/
- **Supabase**: https://supabase.com/
- **AWS RDS**: https://aws.amazon.com/rds/postgresql/
- **DigitalOcean**: https://www.digitalocean.com/products/managed-databases

连接字符串通常格式为：
```
postgresql://user:password@host:port/database?options
```

或

```
postgres://user:password@host:port/database?options
```

### 2. 在本地 .env.local 中配置（用于开发）

在项目根目录的 `.env.local` 文件中：

```env
POSTGRES_URL=your_connection_string_here
NODE_ENV=development
```

### 3. 在Vercel项目中配置（用于生产）

**方法A: 通过Vercel Web界面**

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 `grade-query-system`
3. 进入 **Settings** > **Environment Variables**
4. 点击 **Add New**
5. 输入：
   - Name: `POSTGRES_URL`
   - Value: 你的PostgreSQL连接字符串
6. 选择环境：**Production**（或所有环境）
7. 点击 **Save**
8. 在 **Deployments** 中点击最新部署右侧的按钮，选择 **Redeploy** 重新部署

**方法B: 使用Vercel CLI**

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add POSTGRES_URL

# 输入你的连接字符串

# 重新部署
vercel deploy --prod
```

### 4. 初始化数据库表

部署后，调用初始化端点创建表和导入测试数据：

```bash
curl -X POST https://your-domain.vercel.app/api/init
```

或使用浏览器访问：
```
https://your-domain.vercel.app/api/init
```

**返回示例（成功）：**
```json
{
  "success": true,
  "message": "数据库初始化成功",
  "data": {
    "totalRecords": 50,
    "timestamp": "2026-05-06T10:30:00.000Z"
  }
}
```

## API端点说明

### 查询学生成绩

**GET** `/api/students`

查询参数：
- `type`: 查询类型 (all|id|name|class)
- `value`: 查询值（当type非all时）
- `page`: 页码（默认: 1）
- `pageSize`: 每页条数（默认: 10，最大: 100）

**示例：**

1. 查询所有学生（分页）
```
GET /api/students?page=1&pageSize=10
```

2. 按学号查询
```
GET /api/students?type=id&value=STU001
```

3. 按姓名模糊查询
```
GET /api/students?type=name&value=张&page=1&pageSize=10
```

4. 按班级查询
```
GET /api/students?type=class&value=一班&page=1&pageSize=10
```

**返回示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "student_id": "STU001",
      "class": "一班",
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

### 初始化数据库

**POST** `/api/init`

初始化数据库表并导入50条测试数据。

**返回示例：**
```json
{
  "success": true,
  "message": "数据库初始化成功",
  "data": {
    "totalRecords": 50,
    "timestamp": "2026-05-06T10:30:00.000Z"
  }
}
```

## 故障排查

### 问题: "POSTGRES_URL 环境变量未设置"

**解决方案：**
1. 检查你是否在Vercel的Environment Variables中添加了POSTGRES_URL
2. 确保选择了正确的环境（Production）
3. 重新部署项目

### 问题: "数据库连接失败"

**解决方案：**
1. 验证连接字符串是否正确
2. 检查数据库是否在线
3. 检查防火墙设置，确保允许你的IP访问
4. 查看Vercel的函数日志找到详细错误信息

### 问题: "duplicate key value violates unique constraint"

**解决方案：**
1. 表中已有相同学号的记录
2. 调用 `/api/clear` 清空表（如果有）
3. 重新运行初始化

## 数据库表结构

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  class VARCHAR(50) NOT NULL,
  chinese_score DECIMAL(5,2),
  math_score DECIMAL(5,2),
  english_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_id ON students(student_id);
CREATE INDEX idx_name ON students(name);
CREATE INDEX idx_class ON students(class);
```

## 测试数据

初始化时会导入50条测试数据，包括：
- 学号: STU001 ~ STU050
- 班级: 一班, 二班, 三班
- 成绩: 各科成绩在70-100之间

## 安全建议

1. **不要在代码中硬编码连接字符串**
   - 始终使用环境变量

2. **使用强密码**
   - 数据库密码要足够复杂

3. **限制数据库访问**
   - 只允许Vercel的IP访问
   - 定期更新密码

4. **备份数据**
   - 定期备份数据库
   - 使用数据库提供商的备份功能

5. **监控日志**
   - 查看Vercel的函数日志
   - 监控数据库的访问日志

## 更多信息

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [@vercel/postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
