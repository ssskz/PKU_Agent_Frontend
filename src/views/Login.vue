<template>
  <div class="elegant-login-page">
    <!-- 背景层 -->
    <div class="background-layer">
      <div class="gradient-bg"></div>
      <div class="pattern-overlay"></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="login-wrapper">
      <div class="login-container">
        <!-- 左侧品牌区域 -->
        <div class="brand-panel">
          <div class="brand-content">
            <div class="logo-section">
              <div class="logo-icon">
                <el-icon :size="50">
                  <Monitor />
                </el-icon>
              </div>
              <h1 class="brand-name">CodeHubot</h1>
              <p class="brand-slogan">智能物联网管理平台</p>
            </div>
            
            <div class="features">
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="feature-text">
                  <h3>实时连接</h3>
                  <p>设备无缝接入，实时监控</p>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><DataAnalysis /></el-icon>
                </div>
                <div class="feature-text">
                  <h3>智能分析</h3>
                  <p>数据可视化，智能决策</p>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Lock /></el-icon>
                </div>
                <div class="feature-text">
                  <h3>安全可靠</h3>
                  <p>企业级安全保障</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧登录表单区域 -->
        <div class="form-panel">
          <div class="form-content">
            <div class="form-header">
              <h2>账户登录</h2>
              <p>欢迎回来，请登录您的账户</p>
            </div>

            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              class="login-form"
              @submit.prevent="handleLogin"
            >
              <el-form-item prop="email">
                <div class="input-group">
                  <label class="input-label">用户名或邮箱</label>
                  <el-input
                    v-model="loginForm.email"
                    placeholder="请输入用户名或邮箱"
                    size="large"
                    class="elegant-input"
                    autocomplete="off"
                  >
                    <template #prefix>
                      <el-icon class="input-prefix-icon"><User /></el-icon>
                    </template>
                  </el-input>
                </div>
              </el-form-item>

              <el-form-item prop="password">
                <div class="input-group">
                  <label class="input-label">密码</label>
                  <el-input
                    v-model="loginForm.password"
                    type="password"
                    placeholder="请输入密码"
                    size="large"
                    show-password
                    class="elegant-input"
                    autocomplete="off"
                    @keyup.enter="handleLogin"
                  >
                    <template #prefix>
                      <el-icon class="input-prefix-icon"><Lock /></el-icon>
                    </template>
                  </el-input>
                </div>
              </el-form-item>

              <div class="form-footer-options">
                <el-checkbox v-model="rememberMe">
                  <span class="checkbox-label">记住我</span>
                </el-checkbox>
                <el-link
                  type="primary"
                  :underline="false"
                  class="forgot-password-link"
                  @click="$router.push('/forgot-password')"
                >
                  忘记密码？
                </el-link>
              </div>

              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>

              <div class="register-prompt">
                <span>还没有账户？</span>
                <el-link
                  type="primary"
                  :underline="false"
                  @click="$router.push('/register')"
                >
                  立即注册
                </el-link>
              </div>
            </el-form>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="page-footer">
      <p>© 2024 CodeHubot. All Rights Reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { Monitor, User, Lock, Connection, DataAnalysis } from '@element-plus/icons-vue'
import logger from '../utils/logger'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules = {
  email: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '用户名或邮箱至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.loginUser(loginForm.email, loginForm.password)
        ElMessage.success('登录成功！')
        await router.push('/agents')
      } catch (error) {
        logger.error('登录失败:', error)
        ElMessage.error('登录失败，请检查用户名/邮箱和密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* ========== 全局容器 ========== */
.elegant-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* ========== 背景层 ========== */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 1;
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  opacity: 0.6;
}

/* ========== 主容器 ========== */
.login-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  padding: 20px;
}

.login-container {
  display: flex;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-height: 650px;
}

/* ========== 左侧品牌区域 ========== */
.brand-panel {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.brand-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)" /></svg>');
  opacity: 0.3;
}

.brand-content {
  position: relative;
  z-index: 1;
  color: white;
}

.logo-section {
  text-align: center;
  margin-bottom: 50px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.brand-name {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 10px 0;
  letter-spacing: 1px;
}

.brand-slogan {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-text h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.feature-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
  font-weight: 300;
}

/* ========== 右侧表单区域 ========== */
.form-panel {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
}

.form-content {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px 0;
}

.form-header p {
  font-size: 15px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

/* ========== 表单样式 ========== */
.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.input-group {
  width: 100%;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.elegant-input {
  width: 100%;
}

.elegant-input :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  box-shadow: none;
  padding: 0 15px;
  transition: all 0.3s ease;
}

.elegant-input :deep(.el-input__wrapper:hover) {
  border-color: #d1d5db;
  background: #ffffff;
}

.elegant-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.elegant-input :deep(.el-input__inner) {
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 400;
}

.elegant-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af;
}

.input-prefix-icon {
  color: #9ca3af;
  font-size: 18px;
  margin-right: 8px;
}

.elegant-input :deep(.el-input__wrapper.is-focus) .input-prefix-icon {
  color: #667eea;
}

/* ========== 表单选项 ========== */
.form-footer-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.checkbox-label {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.forgot-password-link {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
}

.forgot-password-link:hover {
  color: #764ba2;
}

/* ========== 登录按钮 ========== */
.login-button {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

/* ========== 注册提示 ========== */
.register-prompt {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-prompt span {
  margin-right: 8px;
}

.register-prompt .el-link {
  font-weight: 600;
  font-size: 14px;
}

/* ========== 页脚 ========== */
.page-footer {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 1;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    max-width: 500px;
    margin: 0 auto;
  }

  .brand-panel {
    padding: 40px 30px;
  }

  .features {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .feature-item {
    flex: 1;
    min-width: 200px;
  }

  .form-panel {
    padding: 40px 30px;
  }
}

@media (max-width: 768px) {
  .login-wrapper {
    padding: 15px;
  }

  .login-container {
    border-radius: 15px;
    min-height: auto;
  }

  .brand-panel {
    padding: 30px 25px;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
  }

  .brand-name {
    font-size: 28px;
  }

  .features {
    gap: 20px;
  }

  .form-panel {
    padding: 30px 25px;
  }

  .form-header h2 {
    font-size: 26px;
  }
}

@media (max-width: 480px) {
  .brand-panel,
  .form-panel {
    padding: 25px 20px;
  }

  .feature-item {
    min-width: 100%;
  }

  .form-content {
    max-width: 100%;
  }

  .elegant-input :deep(.el-input__wrapper) {
    height: 44px;
  }

  .login-button {
    height: 44px;
  }
}

/* ========== 动画 ========== */
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

.login-container {
  animation: fadeInUp 0.6s ease-out;
}

/* ========== 错误提示样式 ========== */
.login-form :deep(.el-form-item__error) {
  font-size: 13px;
  padding-top: 4px;
}
</style>
