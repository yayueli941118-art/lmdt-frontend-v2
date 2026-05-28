<template>
  <div class="placeholder">
    <div class="placeholder-content">
      <h1>{{ $route.meta.title }}</h1>
      <p>🚧 模块开发中，敬请期待</p>
      <router-link to="/" class="back-btn">← 返回首页</router-link>
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  min-height: 100vh;
  background: #0b0f19;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-content {
  text-align: center;
  color: #e2e8f0;
}
.placeholder-content h1 {
  font-size: 32px;
  margin-bottom: 16px;
}
.placeholder-content p {
  color: #64748b;
  font-size: 18px;
  margin-bottom: 24px;
}
.back-btn {
  color: #6366f1;
  text-decoration: none;
  font-size: 16px;
}
.back-btn:hover {
  color: #818cf8;
}
</style>
