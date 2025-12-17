<template>
  <div class="plugins-container">
    <!-- 页面头部：标题 + 筛选 + 操作 -->
    <div class="page-header-section">
      <div class="header-top">
        <div class="header-title">
          <h2>插件管理</h2>
          <span class="header-subtitle">管理和配置您的 API 插件</span>
        </div>
        <div class="header-actions">
          <el-button @click="importFromFile" class="import-btn">
            <el-icon><Upload /></el-icon>
            从文件导入
          </el-button>
          <el-button type="primary" @click="addPlugin">
            <el-icon><Plus /></el-icon>
            添加插件
          </el-button>
        </div>
      </div>
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索插件名称"
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="loadPlugins" class="status-select">
          <el-option label="激活" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 插件列表 - 卡片形式 -->
    <div v-loading="loading" class="plugins-grid">
      <el-empty v-if="plugins.length === 0 && !loading" description="暂无插件">
        <el-button type="primary" @click="addPlugin">创建第一个插件</el-button>
      </el-empty>
      
      <el-card
        v-for="plugin in plugins"
        :key="plugin.id"
        class="plugin-card"
        shadow="hover"
        :body-style="{ padding: '0' }"
      >
        <div class="card-header">
          <div class="header-top">
            <div class="plugin-icon">
              <el-icon size="24"><Connection /></el-icon>
            </div>
            <div class="plugin-info">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <div class="plugin-badges">
                <el-tag :type="plugin.is_active === 1 ? 'success' : 'info'" size="small">
                  {{ plugin.is_active === 1 ? '激活' : '禁用' }}
                </el-tag>
                <el-tag v-if="plugin.is_system === 1" type="warning" size="small">系统内置</el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <p class="plugin-description">{{ plugin.description || '暂无描述' }}</p>
          
          <div class="plugin-stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ plugin.openapi_spec?.openapi || 'N/A' }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Link /></el-icon>
              <span>{{ Object.keys(plugin.openapi_spec?.paths || {}).length }} 个API</span>
            </div>
            <div class="stat-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(plugin.created_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <el-button size="small" @click="viewPlugin(plugin)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="primary" size="small" @click="editPlugin(plugin)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(plugin)"
            :disabled="plugin.is_system === 1"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <div class="pagination-info">
        <span class="total-text">共 <strong>{{ total }}</strong> 个插件</span>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="loadPlugins"
        @current-change="loadPlugins"
        class="custom-pagination"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="插件名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入插件名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入插件描述"
          />
        </el-form-item>
        <el-form-item label="OpenAPI规范" prop="openapi_spec">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px;">
            <el-input
              v-model="jsonString"
              type="textarea"
              :rows="20"
              placeholder="请输入 OpenAPI 3.0.0 规范的 JSON"
              @blur="validateJson"
            />
          </div>
          <div class="form-tip">
            ⚠️ 必须符合 OpenAPI 3.0.0 格式，包含 openapi、info、paths 字段
          </div>
          <div v-if="jsonError" class="form-error">
            {{ jsonError }}
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="is_active" v-if="form.id">
          <el-radio-group v-model="form.is_active">
            <el-radio :label="1">激活</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="查看插件详情"
      width="900px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="插件名称">{{ viewPluginData.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewPluginData.is_active === 1 ? 'success' : 'danger'">
            {{ viewPluginData.is_active === 1 ? '激活' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ viewPluginData.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="OpenAPI版本">{{ viewPluginData.openapi_spec?.openapi || 'N/A' }}</el-descriptions-item>
        <el-descriptions-item label="API数量">{{ Object.keys(viewPluginData.openapi_spec?.paths || {}).length }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(viewPluginData.created_at) }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>OpenAPI 规范</el-divider>
      <pre style="background: #f5f7fa; padding: 16px; border-radius: 4px; max-height: 400px; overflow: auto;">{{ JSON.stringify(viewPluginData.openapi_spec, null, 2) }}</pre>
    </el-dialog>

    <!-- 文件上传（隐藏） -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Upload, Connection, Document, Link, Clock, View, Edit, Delete, RefreshLeft } from '@element-plus/icons-vue'
import { getPlugins, createPlugin, updatePlugin, deletePlugin } from '../api/plugin'

const router = useRouter()

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const plugins = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('添加插件')
const submitting = ref(false)
const formRef = ref(null)
const fileInput = ref(null)
const jsonError = ref('')
const viewPluginData = ref({})

const form = reactive({
  id: null,
  name: '',
  description: '',
  openapi_spec: {},
  is_active: 1
})

const jsonString = computed({
  get: () => {
    try {
      return JSON.stringify(form.openapi_spec, null, 2)
    } catch {
      return ''
    }
  },
  set: (value) => {
    try {
      form.openapi_spec = JSON.parse(value)
      jsonError.value = ''
    } catch (e) {
      jsonError.value = 'JSON 格式错误：' + e.message
    }
  }
})

const rules = {
  name: [
    { required: true, message: '请输入插件名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  openapi_spec: [
    { required: true, message: '请输入 OpenAPI 规范', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || typeof value !== 'object') {
          callback(new Error('OpenAPI 规范必须是有效的 JSON 对象'))
          return
        }
        if (!value.openapi) {
          callback(new Error('缺少 openapi 字段'))
          return
        }
        if (!value.info || !value.info.title) {
          callback(new Error('缺少 info.title 字段'))
          return
        }
        if (!value.paths || typeof value.paths !== 'object') {
          callback(new Error('缺少 paths 字段或格式不正确'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 加载插件列表
const loadPlugins = async () => {
  loading.value = true
  try {
    const params = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      is_active: filterStatus.value !== null ? filterStatus.value : undefined
    }
    const response = await getPlugins(params)
    plugins.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('加载插件列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadPlugins()
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  filterStatus.value = null
  currentPage.value = 1
  loadPlugins()
}

// 添加插件
const addPlugin = () => {
  dialogTitle.value = '添加插件'
  resetForm()
  dialogVisible.value = true
}

// 编辑插件
const editPlugin = (plugin) => {
  router.push(`/plugins/${plugin.uuid}/edit`)
}

// 查看插件
const viewPlugin = (plugin) => {
  router.push(`/plugins/${plugin.uuid}/view`)
}

// 删除插件
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除插件 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deletePlugin(row.uuid)
    ElMessage.success('删除成功')
    loadPlugins()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '删除失败')
    }
  }
}

// 从文件导入
const importFromFile = () => {
  fileInput.value?.click()
}

// 处理文件导入
const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result)
      if (!json.openapi || !json.info || !json.paths) {
        ElMessage.error('文件格式不正确，必须包含 openapi、info、paths 字段')
        return
      }
      
      // 填充表单
      form.name = json.info.title || ''
      form.description = json.info.description || ''
      form.openapi_spec = json
      jsonError.value = ''
      
      dialogTitle.value = '添加插件'
      form.id = null
      form.is_active = 1
      dialogVisible.value = true
      
      ElMessage.success('文件导入成功')
    } catch (error) {
      ElMessage.error('文件解析失败：' + error.message)
    }
  }
  reader.readAsText(file)
  
  // 重置文件输入
  event.target.value = ''
}

// 验证 JSON
const validateJson = () => {
  try {
    const parsed = JSON.parse(jsonString.value)
    if (!parsed.openapi || !parsed.info || !parsed.paths) {
      jsonError.value = '缺少必需字段：openapi、info 或 paths'
      return false
    }
    jsonError.value = ''
    return true
  } catch (e) {
    jsonError.value = 'JSON 格式错误：' + e.message
    return false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  // 先验证 JSON
  if (!validateJson()) {
    ElMessage.warning('请先修正 JSON 格式错误')
    return
  }
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const data = {
        name: form.name,
        description: form.description,
        openapi_spec: form.openapi_spec
      }
      
      if (form.id) {
        data.is_active = form.is_active
        await updatePlugin(form.id, data)
        ElMessage.success('更新成功')
      } else {
        await createPlugin(data)
        ElMessage.success('创建成功')
      }
      
      dialogVisible.value = false
      loadPlugins()
    } catch (error) {
      ElMessage.error(error.response?.data?.detail || (form.id ? '更新失败' : '创建失败'))
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.name = ''
  form.description = ''
  form.openapi_spec = {}
  form.is_active = 1
  jsonError.value = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadPlugins()
})
</script>

<style scoped>
.plugins-container {
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
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  display: block;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
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

.import-btn {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  color: #64748b;
  border-radius: 10px;
}

.import-btn:hover {
  background: #ffffff;
  border-color: #667eea;
  color: #667eea;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-error {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

/* 卡片网格布局 */
.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

/* 插件卡片 */
.plugin-card {
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.plugin-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.plugin-card .card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.plugin-card .header-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 卡片主体 */
.card-body {
  padding: 20px;
  background: #ffffff;
}

.plugin-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  min-height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
}

.stat-item .el-icon {
  font-size: 16px;
  color: #667eea;
}

/* 卡片底部 */
.card-footer {
  padding: 16px 20px;
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  gap: 8px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.card-footer .el-button {
  flex: 1;
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
@media (max-width: 1200px) {
  .plugins-grid {
    grid-template-columns: repeat(2, 1fr);
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
  .plugins-grid {
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
    flex-direction: column;
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
