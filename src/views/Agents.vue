<template>
  <div class="agents-container">
    <!-- 页面头部：标题 + 筛选 + 操作 -->
    <div class="page-header-section">
      <div class="header-top">
        <div class="header-title">
          <h2>智能体管理</h2>
          <span class="header-subtitle">管理和配置您的 AI 智能体</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="addAgent">
            <el-icon><Plus /></el-icon>
            添加智能体
          </el-button>
        </div>
      </div>
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索智能体名称"
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="loadAgents" class="status-select">
          <el-option label="激活" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 智能体列表 - 卡片形式 -->
    <div v-loading="loading" class="agents-grid">
      <el-empty v-if="agents.length === 0 && !loading" description="暂无智能体">
        <el-button type="primary" @click="addAgent">创建第一个智能体</el-button>
      </el-empty>
      
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="agent-card"
      >
        <!-- 卡片顶部装饰 -->
        <div class="card-decoration"></div>
        
        <!-- 卡片内容 -->
        <div class="card-content">
          <!-- 头像和状态 -->
          <div class="card-top">
            <div class="agent-avatar">
              <el-icon size="32"><ChatDotRound /></el-icon>
            </div>
            <div class="status-badges">
              <span :class="['status-dot', agent.is_active === 1 ? 'active' : 'inactive']"></span>
              <span class="status-text">{{ agent.is_active === 1 ? '运行中' : '已停用' }}</span>
            </div>
          </div>
          
          <!-- 名称和描述 -->
          <div class="card-info">
            <h3 class="agent-name">{{ agent.name }}</h3>
            <p class="agent-description">{{ agent.description || '暂无描述' }}</p>
          </div>
          
          <!-- 元信息 -->
          <div class="card-meta">
            <div class="meta-item">
              <el-icon size="14"><User /></el-icon>
              <span>{{ getOwnerDisplayName(agent) }}</span>
            </div>
            <div class="meta-item">
              <el-icon size="14"><Connection /></el-icon>
              <span>{{ agent.plugin_ids?.length || 0 }} 插件</span>
            </div>
            <div class="meta-item">
              <el-icon size="14"><Clock /></el-icon>
              <span>{{ formatDateShort(agent.created_at) }}</span>
            </div>
          </div>
          
          <!-- 标签 -->
          <div class="card-tags" v-if="agent.is_system === 1">
            <el-tag size="small" type="warning" effect="light">系统内置</el-tag>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="card-actions">
          <button class="action-btn primary" @click="useAgent(agent)">
            <el-icon><ChatDotRound /></el-icon>
            <span>对话</span>
          </button>
          <button class="action-btn" @click="editAgent(agent)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </button>
          <button 
            class="action-btn danger" 
            @click="handleDelete(agent)"
            :disabled="agent.is_system === 1"
          >
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <div class="pagination-info">
        <span class="total-text">共 <strong>{{ total }}</strong> 个智能体</span>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="loadAgents"
        @current-change="loadAgents"
        class="custom-pagination"
      />
    </div>

    <!-- 快速添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="智能体名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入智能体名称" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请简要描述智能体的功能和用途"
          />
        </el-form-item>
        <el-alert
          v-if="!form.id"
          title="提示"
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 10px;"
        >
          创建后可以在"编辑"页面配置系统提示词和插件
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          创建并编辑
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, ChatDotRound, Connection, Clock, Edit, Delete, User, RefreshLeft } from '@element-plus/icons-vue'
import { getAgents, createAgent, updateAgent, deleteAgent } from '../api/agent'

const router = useRouter()

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const agents = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加智能体')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入智能体名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述最多500个字符', trigger: 'blur' }
  ]
}

// 加载智能体列表
const loadAgents = async () => {
  loading.value = true
  try {
    const params = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      is_active: filterStatus.value !== null ? filterStatus.value : undefined
    }
    const response = await getAgents(params)
    agents.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('加载智能体列表失败')
  } finally {
    loading.value = false
  }
}

// 加载可用插件列表
const loadPlugins = async () => {
  try {
    const response = await getPlugins({ limit: 1000, is_active: 1 })
    availablePlugins.value = response.data.items || []
  } catch (error) {
    console.error('加载插件列表失败', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadAgents()
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  filterStatus.value = null
  currentPage.value = 1
  loadAgents()
}

// 添加智能体（快速创建）
const addAgent = () => {
  dialogTitle.value = '添加智能体'
  resetForm()
  dialogVisible.value = true
}

// 跳转到编辑页面
const editAgent = (row) => {
  router.push(`/agents/${row.uuid}/edit`)
}

// 立即使用智能体
const useAgent = (agent) => {
  router.push(`/agents/${agent.uuid}/chat`)
}

// 删除智能体
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除智能体 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteAgent(row.uuid)
    ElMessage.success('删除成功')
    loadAgents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  submitting.value = true
  try {
    // 创建并跳转到编辑页面
    const response = await createAgent({
      name: form.name,
      description: form.description
    })
      const newAgentUuid = response.data.uuid
      ElMessage.success('创建成功，正在跳转到编辑页面...')
      dialogVisible.value = false
      // 跳转到编辑页面
      router.push(`/agents/${newAgentUuid}/edit`)
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.name = ''
  form.description = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 格式化日期（短格式）
const formatDateShort = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}月前`
  return `${Math.floor(days / 365)}年前`
}

// 获取所有者显示名称（优先昵称）
const getOwnerDisplayName = (agent) => {
  if (!agent) return '未知'
  // 优先显示昵称，没有昵称则显示用户名
  return agent.owner_nickname || agent.owner_username || '未知'
}

onMounted(() => {
  loadAgents()
})
</script>

<style scoped>
.agents-container {
  /* 主布局已有 padding，这里不再添加 */
}

/* 页面头部区域 - 简洁卡片风格 */
.page-header-section {
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.header-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  display: block;
  font-weight: 500;
}

.header-actions .el-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  padding: 4px 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.search-input :deep(.el-input__wrapper:hover) {
  background: #ffffff;
  border-color: rgba(102, 126, 234, 0.4);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.status-select {
  width: 140px;
}

.status-select :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.status-select :deep(.el-input__wrapper:hover) {
  background: #ffffff;
  border-color: rgba(102, 126, 234, 0.4);
}

.reset-btn {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  color: #64748b;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #ffffff;
  border-color: #667eea;
  color: #667eea;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 卡片网格布局 */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

/* ========== 新版智能体卡片样式 ========== */
.agent-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.agent-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 
    0 20px 40px rgba(102, 126, 234, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.08);
}

/* 顶部装饰条 */
.card-decoration {
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 100%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.agent-card:hover .card-decoration {
  height: 6px;
}

/* 卡片内容区 */
.card-content {
  padding: 24px;
}

/* 卡片顶部：头像和状态 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.agent-avatar {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 
    0 8px 24px rgba(102, 126, 234, 0.35),
    0 0 0 4px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.agent-card:hover .agent-avatar {
  transform: scale(1.05) rotate(-3deg);
  box-shadow: 
    0 12px 32px rgba(102, 126, 234, 0.4),
    0 0 0 6px rgba(102, 126, 234, 0.15);
}

.status-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(248, 250, 252, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-dot.inactive {
  background: #94a3b8;
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* 名称和描述 */
.card-info {
  margin-bottom: 20px;
}

.agent-name {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  min-height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 元信息 */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #94a3b8;
}

.meta-item .el-icon {
  color: #667eea;
}

/* 标签 */
.card-tags {
  margin-top: 12px;
}

/* 操作按钮区 */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(248, 250, 252, 0.8);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.action-btn:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.action-btn.danger:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.action-btn .el-icon {
  font-size: 16px;
}

.action-btn span {
  display: inline;
}

/* ========== 分页区域样式 ========== */
.pagination-section {
  margin-top: 32px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-text {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.total-text strong {
  color: #667eea;
  font-weight: 700;
  font-size: 16px;
}

.custom-pagination {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-bg-color: rgba(248, 250, 252, 0.9);
  --el-pagination-hover-color: #667eea;
}

.custom-pagination :deep(.el-pagination__sizes) {
  margin-right: 16px;
}

.custom-pagination :deep(.el-select .el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.el-select .el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
}

.custom-pagination :deep(.el-pager li) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  margin: 0 4px;
  min-width: 36px;
  height: 36px;
  line-height: 34px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.el-pager li:hover) {
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.4);
}

.custom-pagination :deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.custom-pagination :deep(.btn-prev),
.custom-pagination :deep(.btn-next) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  min-width: 36px;
  height: 36px;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.btn-prev:hover),
.custom-pagination :deep(.btn-next:hover) {
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.4);
}

.custom-pagination :deep(.el-pagination__jump) {
  margin-left: 16px;
}

.custom-pagination :deep(.el-pagination__jump .el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  width: 60px;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.el-pagination__jump .el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
}

.custom-pagination :deep(.el-pagination__jump .el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .agents-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .header-filters {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .agents-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-header-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
  
  .header-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .status-select {
    width: 100%;
  }
  
  .reset-btn {
    width: 100%;
  }
  
  /* 卡片响应式 */
  .agent-card {
    border-radius: 16px;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .agent-avatar {
    width: 56px;
    height: 56px;
    border-radius: 14px;
  }
  
  .card-actions {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .action-btn span {
    display: none;
  }
  
  .action-btn .el-icon {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  /* 分页响应式 */
  .pagination-section {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border-radius: 12px;
  }
  
  .pagination-info {
    width: 100%;
    justify-content: center;
  }
  
  .custom-pagination {
    width: 100%;
    justify-content: center;
  }
  
  .custom-pagination :deep(.el-pagination__sizes) {
    margin-right: 8px;
  }
  
  .custom-pagination :deep(.el-pagination__jump) {
    display: none;
  }
}

@media (max-width: 480px) {
  .agent-name {
    font-size: 18px;
  }
  
  .card-meta {
    gap: 8px;
  }
  
  .meta-item {
    font-size: 12px;
  }
  
  /* 分页小屏幕 */
  .custom-pagination :deep(.el-pager li) {
    min-width: 32px;
    height: 32px;
    line-height: 30px;
    margin: 0 2px;
  }
  
  .custom-pagination :deep(.btn-prev),
  .custom-pagination :deep(.btn-next) {
    min-width: 32px;
    height: 32px;
  }
}
</style>
