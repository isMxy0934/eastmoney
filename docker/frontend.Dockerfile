# Stage 1: Build the React application
FROM node:20-alpine as build-stage

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY web/package*.json ./

# 安装依赖 (使用淘宝源加速)
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install

# 复制源代码
COPY web/ .

# 构建项目
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine as production-stage

# 复制构建产物到 Nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
