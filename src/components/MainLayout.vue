<template>
  <div class="modern-layout">
    <!-- 极简顶部导航条 -->
    <header class="top-navbar">
      <div class="navbar-content">
        <!-- 左侧Logo区域 -->
        <div class="logo-area" @click="router.push('/dashboard')">
          <div class="logo-icon">
            <el-icon :size="28"><Monitor /></el-icon>
          </div>
          <div class="logo-text">
            <h1>PKU-RAG Agent</h1>
            <span>智能体平台</span>
          </div>
        </div>

        <!-- 中间搜索栏 -->
        <div class="search-area" v-if="!isMobile">
          <el-input
            v-model="searchQuery"
            placeholder="搜索功能、设备、文档..."
            :prefix-icon="Search"
            class="search-input"
            size="large"
            clearable
          >
            <template #suffix>
              <el-icon class="search-shortcut">
                <span>⌘K</span>
              </el-icon>
            </template>
          </el-input>
        </div>

        <!-- 右侧用户区域 -->
        <div class="user-area">
          <!-- 用户下拉菜单 -->
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <div class="user-info-card">
              <el-avatar :size="40" :src="userAvatar" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details" v-if="!isMobile">
                <span class="user-name">{{ displayName }}</span>
                <span class="user-role">{{ displayRole }}</span>
              </div>
              <el-icon class="dropdown-arrow" v-if="!isMobile"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="modern-dropdown">
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  <span>账户设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-area">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor, User, Search, Setting, SwitchButton, ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const searchQuery = ref('')
const windowWidth = ref(window.innerWidth)

// 计算属性
const isMobile = computed(() => windowWidth.value <= 768)

// 用户信息
const displayName = computed(() => {
  const user = userStore.userInfo
  if (!user) return '用户'
  return user.real_name || user.nickname || user.username || '用户'
})

const displayRole = computed(() => {
  const role = userStore.userInfo?.role
  const roleMap = {
    'platform_admin': '平台管理员',
    'teacher': '教师',
    'student': '学生',
    'individual': '个人用户',
    'admin': '管理员',
    'user': '普通用户'
  }
  return roleMap[role] || role || '未知角色'
})

const userAvatar = computed(() => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userStore.userInfo?.username || 'user'}`
})

// 处理用户菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'settings') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    })
  }
}

// 窗口大小监听
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ========== 现代化布局 - 卡片式设计 ========== */
.modern-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
}

.modern-layout::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 顶部导航条 - 增强版 ========== */
.top-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(102, 126, 234, 0.12);
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
}

.navbar-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px 32px;
  display: grid;
  grid-template-columns: minmax(200px, auto) 1fr minmax(200px, auto);
  align-items: center;
  gap: 32px;
}

/* ========== Logo区域 - 增强版（左对齐） ========== */
.logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 10px 18px;
  border-radius: 14px;
  position: relative;
  justify-self: start;
}

.logo-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.logo-area:hover::before {
  opacity: 1;
}

.logo-area:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.logo-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 10px 28px rgba(102, 126, 234, 0.3),
    0 4px 12px rgba(102, 126, 234, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.logo-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: logoShine 3s linear infinite;
}

.logo-area:hover .logo-icon {
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 
    0 12px 32px rgba(102, 126, 234, 0.35),
    0 6px 16px rgba(102, 126, 234, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

@keyframes logoShine {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.logo-icon .el-icon {
  color: #ffffff;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.logo-text h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.8px;
}

.logo-text span {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.8px;
  margin-top: 3px;
  text-transform: uppercase;
}

/* ========== 搜索区域 - 增强版（居中对齐） ========== */
.search-area {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  max-width: 800px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  padding: 10px 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.search-input :deep(.el-input__wrapper:hover) {
  background: #ffffff;
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 
    0 4px 16px rgba(102, 126, 234, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  border-color: #667eea;
  box-shadow: 
    0 6px 20px rgba(102, 126, 234, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.search-input :deep(.el-input__inner) {
  font-size: 14.5px;
  color: #1e293b;
  font-weight: 500;
}

.search-input :deep(.el-input__prefix) {
  color: #94a3b8;
  font-size: 18px;
}

.search-input :deep(.el-input__wrapper.is-focus .el-input__prefix) {
  color: #667eea;
}

.search-shortcut {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  padding: 3px 8px;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  letter-spacing: 0.5px;
}

/* ========== 用户区域 - 增强版（右对齐） ========== */
.user-area {
  display: flex;
  align-items: center;
  gap: 18px;
  justify-self: end;
}

.user-dropdown {
  cursor: pointer;
}

.user-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.user-info-card:hover {
  background: #ffffff;
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.18);
  transform: translateY(-3px);
}

.user-avatar {
  border: 2.5px solid #ffffff;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.user-info-card:hover .user-avatar {
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.15),
    0 0 0 2px rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
  letter-spacing: -0.2px;
}

.user-role {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.dropdown-arrow {
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.3s ease;
}

.user-info-card:hover .dropdown-arrow {
  color: #667eea;
  transform: rotate(180deg) scale(1.1);
}

/* ========== 主内容区域 ========== */
.main-area {
  min-height: calc(100vh - 96px);
  padding: 32px;
  position: relative;
  z-index: 1;
}

.content-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* ========== 下拉菜单样式 ========== */
.modern-dropdown {
  border-radius: 12px !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12) !important;
  padding: 8px !important;
}

.modern-dropdown :deep(.el-dropdown-menu__item) {
  border-radius: 8px;
  padding: 10px 16px;
  margin: 2px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
}

.modern-dropdown :deep(.el-dropdown-menu__item:hover) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .navbar-content {
    padding: 16px 24px;
    gap: 20px;
  }

  .main-area {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 12px 16px;
    gap: 12px;
  }

  .logo-text h1 {
    font-size: 1.1rem;
  }

  .logo-text span {
    display: none;
  }

  .search-area {
    display: none;
  }

  .main-area {
    padding: 16px;
    min-height: calc(100vh - 80px);
  }
}

@media (max-width: 480px) {
  .navbar-content {
    padding: 10px 12px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
  }

  .logo-icon .el-icon {
    font-size: 20px;
  }

  .user-avatar {
    width: 36px !important;
    height: 36px !important;
  }

  .main-area {
    padding: 12px;
  }
}

/* ========== 动画效果 ========== */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.top-navbar {
  animation: fadeInDown 0.5s ease-out;
}
</style>
