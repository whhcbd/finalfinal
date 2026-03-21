# Docker 打包指南

本文档记录将前端项目打包为 Docker 镜像的完整流程。

> **说明**：以下命令中的 `<your-app>` 替换为你的项目名（如 `my-project`）。

---

## 前置条件

- 本地已安装并启动 **Docker Desktop**
- 项目根目录已有 `Dockerfile` 和 `.dockerignore`

---

## 第一步：构建镜像

在项目根目录执行：

```powershell
docker build -t <your-app>:v1.0 .
```

- `-t <your-app>:v1.0`：镜像名称和版本号，按需修改
- `.`：使用当前目录的 Dockerfile

> **国内网络提示**：如果拉取基础镜像超时，在 Docker Desktop → Settings → Docker Engine 中添加镜像加速器：
> ```json
> {
>   "registry-mirrors": [
>     "https://mirror.ccs.tencentyun.com",
>     "https://hub-mirror.c.163.com"
>   ]
> }
> ```

---

## 第二步：本地测试

```powershell
docker run --rm -p 8080:80 --name test-app <your-app>:v1.0
```

浏览器访问 `http://localhost:8080`，确认页面正常后按 `Ctrl+C` 停止。

---

## 第三步：打包镜像文件

PowerShell 下没有 `gzip`，直接导出为 `.tar` 文件：

```powershell
docker save -o <your-app>.tar <your-app>:v1.0
```

---

## 常用命令速查

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（含已停止）
docker ps -a

# 查看镜像列表
docker images
```
