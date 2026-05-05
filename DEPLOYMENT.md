# 学生成绩查询系统 - 部署指南

## 项目完成状态

✅ **项目代码已全部生成完成！**

所有前端、后端、数据库相关代码文件都已创建，现在需要按照以下步骤完成部署。

---

## 📋 部署前准备清单

### 本地开发环境设置

#### 步骤 1：安装依赖

```bash
# 安装前端依赖
cd D:\git_code\mygit\grade-query-system\frontend
npm install

# 安装后端依赖
cd ../api
npm install
```

#### 步骤 2：获取 PostgreSQL 连接字符串

1. **登录 Vercel** (https://vercel.com)
2. **进入你的项目** → 选择要部署的项目（如果还没有，稍后会创建）
3. **导航到 Storage** → 选择 **Postgres**
4. **如果没有 PostgreSQL 数据库：**
   - 点击 "Create Database" → 选择 "Postgres"
   - 创建数据库（选择最近的地区）
   - 等待数据库创建完成
5. **复制连接字符串：**
   - 在 Postgres 数据库设置中，找到 "Connection Strings"
   - 复制 Node.js 版本的连接字符串 (应该类似于 `postgresql://user:password@...`)

#### 步骤 3：配置本地环境变量

编辑项目根目录的 `.env.local` 文件，替换连接字符串：

```
POSTGRES_URL=你复制的PostgreSQL连接字符串
NODE_ENV=development
```

**重要：** `.env.local` 已在 `.gitignore` 中，不会被上传到 Git。

---

## 🗄️ 初始化数据库

在 `api` 目录下运行初始化脚本：

```bash
cd api
node init-db.js
```

**预期输出：**
```
🚀 开始初始化数据库...
📋 正在创建数据库表...
✓ 数据库表创建成功或已存在
📊 正在导入 50 条样例数据...
✓ 成功导入 50 条学生数据
✓ 数据库初始化完成！当前数据库包含 50 条学生记录
```

---

## 🚀 本地开发测试

### 启动后端服务器

**终端 1：**
```bash
cd D:\git_code\mygit\grade-query-system\api
npm start
```

**预期输出：**
```
✓ 服务器运行在 http://localhost:3000
✓ API 端点: http://localhost:3000/api/students
✓ 健康检查: http://localhost:3000/api/health
```

### 启动前端开发服务器

**终端 2（新的终端窗口）：**
```bash
cd D:\git_code\mygit\grade-query-system\frontend
npm run dev
```

**预期输出：**
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 测试应用

1. **打开浏览器** 访问 `http://localhost:5173`
2. **看到主页面** - "📚 学生成绩查询系统" 标题和查询表单
3. **测试功能：**
   - ✅ 按学号查询（输入 "2024001"）
   - ✅ 按姓名查询（输入 "张"，支持模糊搜索）
   - ✅ 按班级查询（输入 "高一(1)班"）
   - ✅ 显示全部（默认显示 50 条）
   - ✅ 分页功能（每页 10 条，可改为 20 或 50）
   - ✅ 总分计算（应该等于三科成绩之和）

---

## 📤 部署到 Vercel

### 步骤 1：创建 GitHub 仓库

1. **登录 GitHub** (https://github.com)
2. **点击右上角 "+" → "New repository"**
3. **填写仓库信息：**
   - Repository name: `grade-query-system`
   - Description: "Student Grade Query System - Vue + Node.js + PostgreSQL"
   - Public（可选）
   - **不要** 初始化 README、.gitignore 或 license
4. **点击 "Create repository"**

### 步骤 2：推送本地代码到 GitHub

```bash
cd D:\git_code\mygit\grade-query-system

# 添加 GitHub 远程仓库
git remote add origin https://github.com/你的用户名/grade-query-system.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 3：在 Vercel 导入项目

1. **登录 Vercel** (https://vercel.com)
2. **点击 "New Project"**
3. **选择 "Import Git Repository"**
4. **搜索并选择** `grade-query-system` 仓库
5. **点击 "Import"**

### 步骤 4：配置 Vercel 项目

在 Vercel 项目导入页面：

**Build and Output Settings 应该自动识别为：**
- Framework: 无（自定义）
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/dist`
- Install Command: `npm install`

**如果没有自动识别，手动设置以上值。**

### 步骤 5：配置环境变量

1. **进入 Project Settings** → **Environment Variables**
2. **添加环境变量：**
   - 名字: `POSTGRES_URL`
   - 值: 你的 PostgreSQL 连接字符串（从 Vercel Storage Postgres 复制）
3. **点击 "Save"**

### 步骤 6：开始部署

1. **点击 "Deploy"** 按钮
2. Vercel 会自动：
   - 从 GitHub 拉取代码
   - 安装依赖
   - 构建前端（`npm run build`）
   - 部署 Serverless Functions (后端)
   - 部署静态文件（前端）

### 步骤 7：验证部署

部署完成后：

1. **访问生成的 Vercel URL** (格式类似 `https://grade-query-system-xxx.vercel.app`)
2. **测试所有功能：**
   - ✅ 页面加载正常
   - ✅ 查询功能正常
   - ✅ 分页功能正常
   - ✅ API 调用成功
3. **检查浏览器控制台** - 不应该有错误信息

---

## 🔍 常见问题解决

### Q1: 数据库初始化时报错 "Connection refused"
**A:** 检查 `.env.local` 中的 `POSTGRES_URL` 是否正确。确保：
- 连接字符串有效
- PostgreSQL 数据库已在 Vercel 中创建
- 网络连接正常

### Q2: 本地运行时 API 返回 500 错误
**A:** 检查：
- 后端服务器是否正在运行（`npm start` in api 目录）
- 数据库是否正确初始化（运行 `node init-db.js`）
- 环境变量是否正确设置

### Q3: Vercel 部署失败
**A:** 检查：
- GitHub 仓库是否正确推送了所有文件
- `vercel.json` 配置是否正确
- `POSTGRES_URL` 环境变量是否在 Vercel 中配置
- 构建日志中是否有错误信息（在 Vercel 控制台查看）

### Q4: 前端无法连接后端 API
**A:** 确保：
- 在生产环境中，前端使用相对路径 `/api`（已在代码中设置）
- `vercel.json` 中的 rewrites 规则正确
- API 端点名称正确

---

## 📊 项目结构回顾

```
grade-query-system/
├── frontend/                    # Vue 3 前端应用
│   ├── src/
│   │   ├── components/          # Vue 组件
│   │   │   ├── SearchForm.vue   # 查询表单
│   │   │   └── ResultTable.vue  # 结果表格
│   │   ├── views/
│   │   │   └── SearchPage.vue   # 主页面
│   │   ├── App.vue              # 根组件
│   │   ├── main.js              # 入口文件
│   │   └── style.css            # 全局样式
│   ├── package.json
│   ├── vite.config.js           # Vite 配置
│   ├── index.html
│   └── .gitignore
│
├── api/                         # Node.js 后端
│   ├── students.js              # Express 服务器 + API 路由
│   ├── db.js                    # 数据库连接和查询函数
│   ├── init-db.js               # 数据库初始化脚本
│   ├── sample-data.js           # 50 条样例学生数据
│   ├── package.json
│   └── .gitignore
│
├── vercel.json                  # Vercel 部署配置
├── .env.local                   # 本地环境变量（不上传 Git）
├── .gitignore                   # Git 忽略文件
├── README.md                    # 项目说明
└── DEPLOYMENT.md                # 本部署指南
```

---

## ✅ 部署检查清单

- [ ] 本地依赖已安装（npm install）
- [ ] PostgreSQL 数据库已在 Vercel 中创建
- [ ] `.env.local` 已配置正确的 POSTGRES_URL
- [ ] 数据库初始化脚本已成功运行（50 条数据已导入）
- [ ] 后端服务器在本地正常运行（`npm start`）
- [ ] 前端开发服务器在本地正常运行（`npm run dev`）
- [ ] 所有本地测试都已通过
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建并导入 GitHub 仓库
- [ ] `POSTGRES_URL` 环境变量已在 Vercel 中配置
- [ ] Vercel 部署已完成
- [ ] 生产环境所有功能都能正常使用

---

## 🎉 完成！

恭喜！现在你有一个完整的、可以部署到 Vercel 的学生成绩查询系统！

**核心特性：**
- ✅ 按学号查询
- ✅ 按姓名查询（模糊搜索）
- ✅ 按班级查询
- ✅ 分页显示（每页 10/20/50 条）
- ✅ 自动计算总分
- ✅ 美观的 UI（Element Plus）
- ✅ 完整的错误处理
- ✅ 生产就绪的部署配置

---

**有任何问题？** 查看 README.md 或检查浏览器/服务器日志。
