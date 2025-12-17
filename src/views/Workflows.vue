<template>
  <div class="workflows-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon"><Compass /></el-icon>
          工作流管理
        </h1>
        <p class="page-desc">AI工作流编排 - 敬请期待</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="large" disabled>
          <el-icon><Plus /></el-icon>
          创建工作流
        </el-button>
      </div>
    </div>

    <div class="coming-soon-wrapper">
      <div class="coming-soon-card">
        <div class="icon-wrapper">
          <el-icon class="large-icon"><Compass /></el-icon>
        </div>
        <h2 class="coming-soon-title">工作流功能开发中</h2>
        <p class="coming-soon-desc">
          即将支持可视化工作流编排，敬请期待！
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>可视化流程设计</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>多智能体协作</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>条件分支控制</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>工作流监控</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Compass, Plus, Check } from '@element-plus/icons-vue'
</script>

<style scoped>
.workflows-container {
  padding: 0;
}

/* ========== 页面头部 ========== */
.page-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 32px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 
    0 20px 60px rgba(240, 147, 251, 0.3),
    0 8px 24px rgba(245, 87, 108, 0.2);
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 2.2rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-icon {
  font-size: 2.2rem;
}

.page-desc {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.95;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ========== Coming Soon 卡片 ========== */
.coming-soon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.coming-soon-card {
  background: white;
  border-radius: 24px;
  padding: 60px;
  text-align: center;
  max-width: 600px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.05);
  border: 2px solid #f5f5f5;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-wrapper {
  margin-bottom: 24px;
}

.large-icon {
  font-size: 5rem;
  color: #f093fb;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.coming-soon-title {
  margin: 0 0 16px 0;
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.coming-soon-desc {
  margin: 0 0 40px 0;
  font-size: 1.1rem;
  color: #64748b;
  line-height: 1.6;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: linear-gradient(135deg, #fef3f7 0%, #fef1f4 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.2);
}

.feature-icon {
  font-size: 1.3rem;
  color: #f093fb;
  flex-shrink: 0;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    padding: 28px;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .coming-soon-card {
    padding: 40px 28px;
  }

  .coming-soon-title {
    font-size: 1.6rem;
  }

  .feature-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }

  .page-desc {
    font-size: 0.95rem;
  }

  .large-icon {
    font-size: 4rem;
  }
}
</style>
