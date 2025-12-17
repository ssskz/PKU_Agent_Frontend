<template>
  <div class="knowledge-base-management">
    <!-- 页面头部：标题 + 筛选 + 操作 -->
    <div class="page-header-section">
      <div class="header-top">
        <div class="header-title">
          <h2><el-icon><Collection /></el-icon> 知识库管理</h2>
          <span class="header-subtitle">管理和配置您的知识库资源</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建知识库
          </el-button>
        </div>
      </div>
      <div class="header-filters">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索知识库..."
          clearable
          class="search-input"
          @change="loadKnowledgeBases"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchParams.scope_type"
          placeholder="作用域类型"
          clearable
          class="scope-select"
          @change="loadKnowledgeBases"
        >
          <el-option label="全部" value="" />
          <el-option label="系统级" value="system" />
          <el-option label="课程级" value="course" />
          <el-option label="智能体级" value="agent" />
        </el-select>
        
        <el-button @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 知识库列表（卡片视图） -->
    <div v-loading="loading" class="kb-grid">
      <el-card
        v-for="kb in knowledgeBases"
        :key="kb.uuid"
        class="kb-card"
        shadow="hover"
        :body-style="{ padding: '0' }"
        @click="viewKnowledgeBase(kb)"
      >
        <div class="card-header">
          <div class="header-content">
            <div class="kb-icon">
              <el-icon :size="24">
                <component :is="getScopeIcon(kb.scope_type)" />
              </el-icon>
            </div>
            <div class="kb-info">
              <h3 class="kb-name">{{ kb.name }}</h3>
              <div class="kb-badges">
                <el-tag :type="getScopeTagType(kb.scope_type)" size="small">
                  {{ getScopeLabel(kb.scope_type) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body">
          <p class="kb-description">{{ kb.description || '暂无描述' }}</p>

          <div class="kb-stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ kb.document_count || 0 }} 文档</span>
            </div>
            <div class="stat-item">
              <el-icon><Grid /></el-icon>
              <span>{{ kb.chunk_count || 0 }} 文本块</span>
            </div>
            <div class="stat-item">
              <el-icon><Folder /></el-icon>
              <span>{{ formatSize(kb.total_size) }}</span>
            </div>
          </div>

          <div class="kb-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ kb.owner_name }}
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ formatTime(kb.created_at) }}
            </span>
          </div>
        </div>

        <div class="card-footer" @click.stop>
          <el-button size="small" @click="viewKnowledgeBase(kb)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="primary" size="small" @click="editKnowledgeBase(kb)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="confirmDelete(kb)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <div class="pagination-info">
        <span class="total-text">共 <strong>{{ pagination.total }}</strong> 个知识库</span>
      </div>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[12, 24, 48]"
        layout="sizes, prev, pager, next, jumper"
        @size-change="loadKnowledgeBases"
        @current-change="loadKnowledgeBases"
        class="custom-pagination"
      />
    </div>

    <!-- 创建/编辑对话框（简化版） -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingKb ? '编辑知识库' : '创建知识库'"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="formData.name" placeholder="请输入知识库名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述"
          />
        </el-form-item>

        <el-form-item label="作用域类型" required>
          <el-select 
            v-model="formData.scope_type" 
            placeholder="请选择" 
            style="width: 100%"
            @change="handleScopeTypeChange"
          >
            <el-option label="系统级" value="system" v-if="userRole === 'platform_admin'" />
            <el-option label="课程级" value="course" v-if="['platform_admin', 'teacher'].includes(userRole)" />
            <!-- 暂时隐藏智能体级，未来如有多智能体需求再开放 -->
            <!-- <el-option label="智能体级" value="agent" /> -->
            <el-option label="个人级" value="personal" />
          </el-select>
        </el-form-item>

        <el-form-item label="可见范围">
          <el-alert :title="getScopeHint()" type="info" :closable="false" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Plus,
  Search,
  Document,
  School,
  Grid,
  User,
  RefreshLeft,
  Folder,
  Clock,
  View,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import {
  getKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase
} from '@/api/knowledgeBases'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 用户信息
const userRole = computed(() => userStore.userInfo?.role || '')
const userId = computed(() => userStore.userInfo?.id || null)
const schoolId = computed(() => userStore.userInfo?.school_id || null)

// 数据
const loading = ref(false)
const knowledgeBases = ref([])
const showCreateDialog = ref(false)
const editingKb = ref(null)

const searchParams = reactive({
  keyword: '',
  scope_type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const formData = reactive({
  name: '',
  description: '',
  scope_type: 'personal',  // 默认个人级
  scope_id: null,
  // access_level 移除，由后端根据 scope_type 自动设置
  chunk_size: 500,          // 系统默认值
  chunk_overlap: 50,        // 系统默认值
  tags: []
})

// 初始化默认scope_type
const initDefaultScopeType = () => {
  if (userRole.value === 'platform_admin') {
    formData.scope_type = 'system'
  } else if (userRole.value === 'school_admin') {
    formData.scope_type = 'school'
    formData.scope_id = schoolId.value
  } else if (userRole.value === 'teacher') {
    formData.scope_type = 'personal'
    formData.scope_id = userId.value
  } else {
    formData.scope_type = 'personal'
    formData.scope_id = userId.value
  }
}

// 方法
const loadKnowledgeBases = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...searchParams
    }

    const response = await getKnowledgeBases(params)
    const data = response.data || response

    knowledgeBases.value = data.knowledge_bases || []
    pagination.total = data.total || 0
  } catch (error) {
    ElMessage.error('加载知识库列表失败')
  } finally {
    loading.value = false
  }
}

const getScopeIcon = (scopeType) => {
  const iconMap = {
    system: Grid,
    school: School,
    course: Document,
    agent: User
  }
  return iconMap[scopeType] || Document
}

const getScopeTagType = (scopeType) => {
  const typeMap = {
    system: 'danger',
    course: 'success',
    agent: 'info'
  }
  return typeMap[scopeType] || 'info'
}

const getScopeLabel = (scopeType) => {
  const labelMap = {
    system: '系统',
    course: '课程',
    agent: '智能体'
  }
  return labelMap[scopeType] || scopeType
}

const formatSize = (bytes) => {
  if (!bytes) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i]
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const handleScopeTypeChange = (scopeType) => {
  // 根据scope_type自动设置scope_id
  switch (scopeType) {
    case 'system':
      formData.scope_id = null
      break
    case 'school':
      formData.scope_id = schoolId.value
      break
    case 'personal':
      formData.scope_id = userId.value
      break
    case 'course':
    case 'agent':
      // 这些需要用户后续选择，暂时设为null
      formData.scope_id = null
      break
  }
}

const getScopeHint = () => {
  const hints = {
    system: '✅ 所有人可见 | 仅平台管理员可创建',
    school: `✅ 本校师生可见${schoolId.value ? ' | 自动关联到您所在的学校' : ''}`,
    course: '✅ 课程师生可见 | 需要选择具体课程',
    personal: '✅ 仅您本人可见 | 其他人无法访问'
  }
  return hints[formData.scope_type] || '请选择作用域类型'
}

const viewKnowledgeBase = (kb) => {
  router.push(`/knowledge-bases/${kb.uuid}`)
}

const editKnowledgeBase = (kb) => {
  editingKb.value = kb
  Object.assign(formData, {
    name: kb.name,
    description: kb.description,
    scope_type: kb.scope_type,
    scope_id: kb.scope_id,
    access_level: kb.access_level
  })
  showCreateDialog.value = true
}

const handleSubmit = async () => {
  if (!formData.name) {
    ElMessage.warning('请输入知识库名称')
    return
  }

  // 自动设置scope_id（根据scope_type）
  const submitData = { ...formData }
  
  switch (submitData.scope_type) {
    case 'system':
      submitData.scope_id = null
      break
    case 'school':
      submitData.scope_id = schoolId.value
      if (!submitData.scope_id) {
        ElMessage.warning('您未归属任何学校，无法创建学校级知识库')
        return
      }
      break
    case 'personal':
      submitData.scope_id = userId.value
      break
    case 'course':
    case 'agent':
      if (!submitData.scope_id) {
        ElMessage.warning(`请选择具体的${submitData.scope_type === 'course' ? '课程' : '智能体'}`)
        return
      }
      break
  }

  try {
    if (editingKb.value) {
      await updateKnowledgeBase(editingKb.value.uuid, submitData)
      ElMessage.success('知识库更新成功')
    } else {
      await createKnowledgeBase(submitData)
      ElMessage.success('知识库创建成功')
    }

    showCreateDialog.value = false
    editingKb.value = null
    loadKnowledgeBases()
  } catch (error) {
    ElMessage.error(editingKb.value ? '更新失败' : '创建失败')
  }
}

const resetFilters = () => {
  searchParams.keyword = ''
  searchParams.scope_type = ''
  pagination.page = 1
  loadKnowledgeBases()
}

const confirmDelete = (kb) => {
  // 检查是否为系统知识库
  if (kb.is_system) {
    ElMessage.warning('系统内置知识库不能删除')
    return
  }

  ElMessageBox.confirm(
    `确定要删除知识库"${kb.name}"吗？`, 
    '确认删除', 
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      message: `
        <div>
          <p><strong>知识库：</strong>${kb.name}</p>
          <p><strong>文档数：</strong>${kb.document_count || 0}</p>
          <p><strong>文本块数：</strong>${kb.chunk_count || 0}</p>
          <p style="color: #E6A23C; margin-top: 10px">
            ⚠️ 注意：删除知识库不会删除其中的文档数据
          </p>
        </div>
      `
    }
  ).then(async () => {
    try {
      console.log('[知识库删除] 开始删除:', kb.uuid)
      await deleteKnowledgeBase(kb.uuid, false)
      ElMessage.success('知识库已删除')
      console.log('[知识库删除] 删除成功，重新加载列表')
      await loadKnowledgeBases()
    } catch (error) {
      console.error('[知识库删除] 删除失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '删除失败，请稍后重试'
      ElMessage.error(`删除失败：${errorMsg}`)
    }
  }).catch(() => {
    // 用户点击取消或关闭，不做任何操作
    console.log('[知识库删除] 用户取消删除')
  })
}

onMounted(() => {
  initDefaultScopeType()
  loadKnowledgeBases()
})
</script>

<style scoped>
.knowledge-base-management {
  /* 主布局已有 padding */
}

/* 页面头部区域 */
.page-header-section {
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
}

.page-header-section .header-top {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  display: block;
  font-weight: 500;
}

.header-actions .el-button[type="primary"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 240px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  padding: 4px 12px;
  transition: all 0.3s ease;
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

.scope-select {
  width: 160px;
}

.scope-select :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
}

.reset-btn {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  color: #64748b;
  border-radius: 10px;
}

.reset-btn:hover {
  background: #ffffff;
  border-color: #667eea;
  color: #667eea;
}

/* 卡片网格布局 */
.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

/* 知识库卡片样式 */
.kb-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kb-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08);
}

.kb-card .card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kb-card .header-content {
  display: flex;
  gap: 16px;
}

.kb-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kb-info {
  flex: 1;
  min-width: 0;
}

.kb-name {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

.kb-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kb-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.stat-item .el-icon {
  font-size: 16px;
  color: #667eea;
}

.kb-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
  padding-top: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item .el-icon {
  font-size: 14px;
}

.card-footer {
  padding: 16px 20px;
  background: rgba(248, 250, 252, 0.8);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer .el-button {
  flex: 1;
  min-width: 60px;
  border-radius: 10px;
}

/* 分页区域样式 */
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

.custom-pagination :deep(.el-pager li) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  margin: 0 4px;
  min-width: 36px;
  height: 36px;
  line-height: 34px;
  font-weight: 600;
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
}

.custom-pagination :deep(.el-select .el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
}

.custom-pagination :deep(.el-pagination__jump .el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  width: 60px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .kb-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 992px) {
  .header-filters {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .kb-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-header-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  .page-header-section .header-top {
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
  .scope-select {
    width: 100%;
  }
  
  .reset-btn {
    width: 100%;
  }
  
  .pagination-section {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border-radius: 12px;
  }
  
  .custom-pagination :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
