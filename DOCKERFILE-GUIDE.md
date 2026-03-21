# Dockerfile 编写指南

本文档指导如何为不同类型的项目编写 `Dockerfile` 和 `.dockerignore`。

---

## 一、.dockerignore（通用）

无论什么项目，以下内容都应排除：

```
# 依赖和构建产物
node_modules/
dist/
build/
__pycache__/
*.pyc
.venv/
venv/

# 版本控制
.git/
.gitignore

# 日志
*.log

# 本地环境变量
.env
.env.*

# 编辑器配置
.vscode/
.idea/

# Docker 自身文件
Dockerfile
.dockerignore
```

---

## 二、Dockerfile 模板

根据你的项目类型，选择对应的模板。

---

### 情况 A：纯前端（React / Vue / Vite）

构建静态文件，用 nginx 提供服务。最终镜像约 20 MB。

```dockerfile
# ---- Stage 1: 构建 ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: 静态服务 ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> `dist` 是 Vite 的默认输出目录；如果你用 webpack 或其他工具，请改为实际输出目录（如 `build`）。

---

### 情况 B：纯后端

#### Node.js

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

> `server.js` 替换为你的实际入口文件。端口与代码中监听的端口保持一致。

#### Python（FastAPI / Flask）

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# FastAPI 示例，Flask 请改为对应启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 情况 C：前端 + 后端（分离部署，推荐）

前后端分别构建独立镜像，用 `docker-compose.yml` 组合运行。

**前端 Dockerfile**（同情况 A）

**后端 Dockerfile**（同情况 B，根据语言选择）

**docker-compose.yml**

```yaml
services:
  frontend:
    build:
      context: ./frontend   # 前端目录
    ports:
      - "80:80"

  backend:
    build:
      context: ./backend    # 后端目录
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

> 如果前后端在同一个仓库，`context` 改为对应的子目录路径。

---

### 情况 D：前端 + 后端（合并为单镜像）

适合小型项目，简化部署。用多阶段构建，后端提供静态文件服务。

以 **Node.js 后端 + 前端** 为例：

```dockerfile
# ---- Stage 1: 构建前端 ----
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---- Stage 2: 后端 + 静态文件 ----
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ .
# 将前端构建产物复制到后端可访问的目录
COPY --from=frontend-builder /app/frontend/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> 后端需要配置静态文件服务，将 `public/` 目录下的文件对外提供（如 Express 的 `express.static('public')`）。

---

## 三、关键参数说明

| 参数 | 说明 |
|------|------|
| `FROM node:18-alpine` | 基础镜像，`alpine` 版体积最小；可按需改为 `20-alpine`、`20` 等 |
| `WORKDIR /app` | 容器内工作目录，统一用 `/app` 即可 |
| `COPY package*.json ./` | 先复制依赖文件，利用 Docker 层缓存，加速后续构建 |
| `npm ci` | 比 `npm install` 更严格，适合构建环境 |
| `EXPOSE` | 声明容器监听的端口，需与代码中实际端口一致 |
| `--omit=dev` | 生产环境跳过安装开发依赖，减小镜像体积 |
