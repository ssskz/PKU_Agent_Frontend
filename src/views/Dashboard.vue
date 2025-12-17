<template>
  <div class="tile-dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">你好，{{ displayName }} 👋</h1>
        <p class="welcome-subtitle">{{ currentDate }} · 欢迎使用PKU-RAG智能体平台</p>
      </div>
      <div class="quick-stats">
        <div class="quick-stat-item">
          <span class="stat-number">{{ stats.totalDevices }}</span>
          <span class="stat-label">设备总数</span>
        </div>
        <div class="quick-stat-divider"></div>
        <div class="quick-stat-item">
          <span class="stat-number">{{ stats.onlineDevices }}</span>
          <span class="stat-label">在线设备</span>
        </div>
        <div class="quick-stat-divider"></div>
        <div class="quick-stat-item">
          <span class="stat-number">{{ agentCount }}</span>
          <span class="stat-label">智能体</span>
        </div>
      </div>
    </div>

    <!-- Windows 11风格磁贴网格 -->
    <div class="tiles-container">
      <!-- AI智能体模块 -->
      <div class="tile-section">
        <h2 class="section-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 智能体</span>
        </h2>
        <div class="tiles-grid">
          <!-- 智能体管理 - 大卡片 -->
          <div class="tile tile-large tile-gradient-purple" @click="navigateTo('/agents')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="48"><ChatDotRound /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">智能体管理</h3>
                <p class="tile-desc">创建和管理AI智能体</p>
                <div class="tile-badge">{{ agentCount }} 个智能体</div>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 知识库管理 -->
          <div class="tile tile-medium tile-gradient-blue" @click="navigateTo('/knowledge-bases')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="40"><Collection /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">知识库</h3>
                <p class="tile-desc">文档管理</p>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 插件管理 -->
          <div class="tile tile-medium tile-gradient-cyan" @click="navigateTo('/plugins')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="40"><Connection /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">插件管理</h3>
                <p class="tile-desc">OpenAPI插件</p>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 模型配置 -->
          <div class="tile tile-small tile-gradient-indigo" @click="navigateTo('/llm-models')" v-if="canAccessLLMModels">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
              <h3 class="tile-title-small">模型配置</h3>
            </div>
            <div class="tile-glow"></div>
          </div>
        </div>
      </div>

      <!-- 设备管理模块 -->
      <div class="tile-section">
        <h2 class="section-title">
          <el-icon><Monitor /></el-icon>
          <span>设备管理</span>
        </h2>
        <div class="tiles-grid">
          <!-- 设备注册 -->
          <div class="tile tile-medium tile-gradient-green" @click="navigateTo('/device-register')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="40"><Plus /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">设备注册</h3>
                <p class="tile-desc">添加新设备</p>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 设备列表 -->
          <div class="tile tile-large tile-gradient-blue-light" @click="navigateTo('/devices')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="48"><List /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">设备列表</h3>
                <p class="tile-desc">管理所有设备</p>
                <div class="tile-stats">
                  <span class="stat-item">
                    <el-icon><CircleCheck /></el-icon>
                    {{ stats.onlineDevices }} 在线
                  </span>
                  <span class="stat-item">
                    <el-icon><CircleClose /></el-icon>
                    {{ stats.offlineDevices }} 离线
                  </span>
                </div>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 产品管理 -->
          <div class="tile tile-small tile-gradient-orange" @click="navigateTo('/products')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="32"><Box /></el-icon>
              </div>
              <h3 class="tile-title-small">产品管理</h3>
            </div>
            <div class="tile-glow"></div>
          </div>
        </div>
      </div>

      <!-- 系统管理模块 -->
      <div class="tile-section" v-if="canAccessSystemManagement">
        <h2 class="section-title">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </h2>
        <div class="tiles-grid">
          <!-- 用户管理 -->
          <div class="tile tile-medium tile-gradient-pink" @click="navigateTo('/users')" v-if="isPlatformAdmin">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="40"><UserFilled /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">用户管理</h3>
                <p class="tile-desc">账户权限</p>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>

          <!-- 系统配置 -->
          <div class="tile tile-medium tile-gradient-gray" @click="navigateTo('/system-config')">
            <div class="tile-content">
              <div class="tile-icon">
                <el-icon :size="40"><Setting /></el-icon>
              </div>
              <div class="tile-info">
                <h3 class="tile-title">系统配置</h3>
                <p class="tile-desc">参数设置</p>
              </div>
            </div>
            <div class="tile-glow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getDashboardStats } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import logger from '../utils/logger'
import {
  ChatDotRound, Collection, Connection, TrendCharts, Monitor, Plus, List,
  Box, UserFilled, Setting, CircleCheck, CircleClose
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const stats = reactive({
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  alerts: 0
})

const agentCount = ref(0)

// 计算属性
const displayName = computed(() => {
  const user = userStore.userInfo
  if (!user) return '用户'
  return user.real_name || user.nickname || user.username || '用户'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 权限判断
const userRole = computed(() => userStore.userInfo?.role || 'individual')
const isPlatformAdmin = computed(() => userRole.value === 'platform_admin')
const canAccessSystemManagement = computed(() => isPlatformAdmin.value || userStore.isSuperUser)
const canAccessLLMModels = computed(() => isPlatformAdmin.value || userStore.isAdmin)

// 导航方法
const navigateTo = (path) => {
  router.push(path)
}

// 加载数据
const loadDashboardData = async () => {
  try {
    const response = await getDashboardStats()
    const data = response.data || response
    if (data) {
      stats.totalDevices = data.total_devices || 0
      stats.onlineDevices = data.online_devices || 0
      stats.offlineDevices = data.offline_devices || 0
      stats.alerts = data.alerts || 0
      agentCount.value = data.agent_count || 0
    }
  } catch (error) {
    logger.error('加载仪表盘数据失败:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* ========== 磁贴式仪表板 ========== */
.tile-dashboard {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0;
}

/* ========== 欢迎区域 - 增强版 ========== */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 48px;
  margin-bottom: 40px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 24px 64px rgba(102, 126, 234, 0.35),
    0 8px 24px rgba(102, 126, 234, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: welcomeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes welcomeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-20px, 20px) scale(1.05);
  }
}

.welcome-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
}

.welcome-content {
  position: relative;
  z-index: 1;
  margin-bottom: 28px;
}

.welcome-title {
  margin: 0 0 12px 0;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -0.8px;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: titleSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards;
}

@keyframes titleSlide {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.welcome-subtitle {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.92;
  font-weight: 600;
  letter-spacing: 0.3px;
  animation: subtitleSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards;
}

@keyframes subtitleSlide {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 0.92;
    transform: translateX(0);
  }
}

.quick-stats {
  display: flex;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 1;
}

.quick-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 120px;
  transition: all 0.3s ease;
  animation: statIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.quick-stat-item:nth-child(1) { animation-delay: 0.4s; }
.quick-stat-item:nth-child(3) { animation-delay: 0.5s; }
.quick-stat-item:nth-child(5) { animation-delay: 0.6s; }

@keyframes statIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.quick-stat-item:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 2.3rem;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.stat-label {
  font-size: 0.88rem;
  opacity: 0.88;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.quick-stat-divider {
  width: 2px;
  height: 48px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 1px;
}

/* ========== 磁贴容器 ========== */
.tiles-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.tile-section {
  animation: fadeInUp 0.6s ease-out backwards;
}

.tile-section:nth-child(2) {
  animation-delay: 0.1s;
}

.tile-section:nth-child(3) {
  animation-delay: 0.2s;
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

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
}

.section-title .el-icon {
  font-size: 24px;
  color: #667eea;
}

/* ========== 磁贴网格 ========== */
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  grid-auto-flow: dense;
}

/* ========== 磁贴基础样式 - 增强版 ========== */
.tile {
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.tile::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.15)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)" /></svg>'),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0.6;
  pointer-events: none;
}

.tile::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.tile-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tile-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.6s ease;
  pointer-events: none;
  z-index: 1;
}

.tile:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.18),
    0 8px 16px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 1);
}

.tile:hover::after {
  opacity: 1;
}

.tile:hover .tile-glow {
  transform: translate(-50%, -50%) scale(1);
}

.tile:hover .tile-icon {
  transform: scale(1.1) rotate(5deg);
}

.tile:active {
  transform: translateY(-6px) scale(0.98);
  box-shadow: 
    0 16px 32px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ========== 磁贴尺寸 ========== */
.tile-small {
  grid-column: span 1;
  min-height: 140px;
}

.tile-medium {
  grid-column: span 1;
  min-height: 180px;
}

.tile-large {
  grid-column: span 2;
  min-height: 200px;
}

/* ========== 磁贴渐变色主题 ========== */
.tile-gradient-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tile-gradient-blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.tile-gradient-cyan {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.tile-gradient-indigo {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #1e293b;
}

.tile-gradient-green {
  background: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
  color: white;
}

.tile-gradient-blue-light {
  background: linear-gradient(135deg, #667eea 0%, #4facfe 100%);
  color: white;
}

.tile-gradient-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.tile-gradient-pink {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.tile-gradient-gray {
  background: linear-gradient(135deg, #868f96 0%, #596164 100%);
  color: white;
}

/* ========== 磁贴内容 - 增强版 ========== */
.tile-icon {
  margin-bottom: 16px;
  opacity: 0.95;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.tile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tile-title {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tile-title-small {
  margin: 10px 0 0 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.tile-desc {
  margin: 0 0 auto 0;
  font-size: 0.95rem;
  opacity: 0.92;
  line-height: 1.5;
  font-weight: 500;
}

.tile-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  font-size: 0.88rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  margin-top: 14px;
  align-self: flex-start;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tile:hover .tile-badge {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tile-stats {
  display: flex;
  gap: 18px;
  margin-top: 14px;
  font-size: 0.95rem;
  opacity: 0.95;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.tile:hover .stat-item {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .tiles-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .tile-large {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .tiles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tile-large {
    grid-column: span 2;
  }
  
  .tile-medium {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .welcome-section {
    padding: 28px 24px;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .quick-stats {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .quick-stat-divider {
    display: none;
  }
  
  .tiles-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .tile-large,
  .tile-medium,
  .tile-small {
    grid-column: span 1;
    min-height: 160px;
  }
  
  .tile {
    padding: 24px;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 24px 20px;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}

/* ========== 动画效果 ========== */
.tile {
  animation: tileIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.tile:nth-child(1) { animation-delay: 0.05s; }
.tile:nth-child(2) { animation-delay: 0.1s; }
.tile:nth-child(3) { animation-delay: 0.15s; }
.tile:nth-child(4) { animation-delay: 0.2s; }
.tile:nth-child(5) { animation-delay: 0.25s; }

@keyframes tileIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
