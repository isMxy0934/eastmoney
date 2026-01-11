# 使用官方 Python 3.11 精简版镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
# 防止 Python 生成 .pyc 文件
ENV PYTHONDONTWRITEBYTECODE=1
# 确保 Python 输出直接打印到终端，不被缓存
ENV PYTHONUNBUFFERED=1
# 设置时区为上海
ENV TZ=Asia/Shanghai

# 安装系统依赖（如果 AkShare 或其他库需要编译依赖）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libffi-dev \
    curl \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
# 使用清华源加速下载
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制项目代码
COPY src/ ./src/
COPY config/ ./config/
COPY api_server.py .
COPY main.py .

# 创建必要的目录
RUN mkdir -p reports/commodities reports/sentiment funds.db

# 暴露端口 (改为 9000)
EXPOSE 9000

# 启动命令 (指定端口 9000)
CMD ["python", "api_server.py", "--port", "9000"]