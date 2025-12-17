<template>
  <div class="llm-models-container">
    <!-- 页面头部：标题 + 筛选 + 操作 -->
    <div class="page-header-section">
      <div class="header-top">
        <div class="header-title">
          <h2>大模型配置</h2>
          <span class="header-subtitle">管理和配置您的 AI 大语言模型</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="addModel">
            <el-icon><Plus /></el-icon>
            添加模型
          </el-button>
        </div>
      </div>
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索模型名称"
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterProvider" placeholder="提供商筛选" clearable @change="loadModels" class="provider-select">
          <el-option
            v-for="provider in providers"
            :key="provider.code"
            :label="provider.name"
            :value="provider.code"
          />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="loadModels" class="status-select">
          <el-option label="激活" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 模型列表 - 卡片形式 -->
    <div v-loading="loading" class="models-grid">
      <el-empty v-if="models.length === 0 && !loading" description="暂无模型配置">
        <el-button type="primary" @click="addModel">添加第一个模型</el-button>
      </el-empty>
      
      <el-card
        v-for="model in models"
        :key="model.id"
        class="model-card"
        shadow="hover"
        :body-style="{ padding: '0' }"
      >
        <div class="card-header">
          <div class="header-top">
            <div class="model-icon">
              <el-icon size="24"><TrendCharts /></el-icon>
            </div>
            <div class="model-info">
              <h3 class="model-name">{{ model.display_name }}</h3>
              <div class="model-badges">
                <el-tag :type="getProviderType(model.provider)" size="small">
                  {{ getProviderName(model.provider) }}
                </el-tag>
                <el-tag :type="model.is_active === 1 ? 'success' : 'info'" size="small">
                  {{ model.is_active === 1 ? '激活' : '禁用' }}
                </el-tag>
                <el-tag v-if="model.is_default === 1" type="warning" size="small">默认</el-tag>
                <el-tag v-if="model.is_system === 1" type="warning" size="small">系统内置</el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-body">
          <p class="model-description">{{ model.description || '暂无描述' }}</p>
          
          <div class="model-stats">
            <div class="stat-item">
              <el-icon><Document /></el-icon>
              <span>{{ model.name }}</span>
            </div>
            <div class="stat-item">
              <el-icon><DataLine /></el-icon>
              <span>{{ model.max_tokens }} tokens</span>
            </div>
            <div class="stat-item">
              <el-icon><Sunny /></el-icon>
              <span>温度 {{ model.temperature }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <el-button size="small" @click="viewModel(model)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="primary" size="small" @click="editModel(model)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="setDefault(model)"
            :disabled="model.is_default === 1 || model.is_active === 0"
          >
            <el-icon><Star /></el-icon>
            默认
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(model)"
            :disabled="model.is_system === 1"
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
        <span class="total-text">共 <strong>{{ total }}</strong> 个模型</span>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="loadModels"
        @current-change="loadModels"
        class="custom-pagination"
      />
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模型标识" prop="name">
              <el-input v-model="form.name" placeholder="如：gpt-4" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示名称" prop="display_name">
              <el-input v-model="form.display_name" placeholder="如：GPT-4" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="提供商" prop="provider">
              <el-select v-model="form.provider" placeholder="选择提供商" @change="onProviderChange" style="width: 100%;">
                <el-option
                  v-for="provider in providers"
                  :key="provider.code"
                  :label="provider.name"
                  :value="provider.code"
                >
                  <span style="float: left">{{ provider.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    <el-tag v-if="provider.has_free_quota === 1" type="success" size="small">免费额度</el-tag>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型类型" prop="model_type">
              <el-select v-model="form.model_type" placeholder="选择类型" style="width: 100%;">
                <el-option label="对话模型" value="chat" />
                <el-option label="嵌入模型" value="embedding" />
                <el-option label="图像模型" value="image" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 提供商信息提示 -->
        <el-alert
          v-if="form.provider && providerInfo[form.provider]"
          :title="providerInfo[form.provider].title"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <div style="line-height: 1.8;">
            <p style="margin: 0 0 12px 0;">{{ providerInfo[form.provider].description }}</p>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div v-if="providerInfo[form.provider].applyUrl" style="display: flex; align-items: center; gap: 8px;">
                <el-icon><Link /></el-icon>
                <span style="color: #606266;">申请 API Key：</span>
                <el-link :href="providerInfo[form.provider].applyUrl" target="_blank" type="primary">
                  {{ providerInfo[form.provider].applyUrl }}
                </el-link>
              </div>
              <div v-if="providerInfo[form.provider].docUrl" style="display: flex; align-items: center; gap: 8px;">
                <el-icon><Document /></el-icon>
                <span style="color: #606266;">开发文档：</span>
                <el-link :href="providerInfo[form.provider].docUrl" target="_blank" type="primary">
                  {{ providerInfo[form.provider].docUrl }}
                </el-link>
              </div>
              <div v-if="providerInfo[form.provider].hasFreeQuota" style="display: flex; align-items: center; gap: 8px; color: #67c23a;">
                <el-icon><SuccessFilled /></el-icon>
                <span>提供免费额度</span>
              </div>
            </div>
          </div>
        </el-alert>

        <el-form-item label="API地址" prop="api_base">
          <el-input v-model="form.api_base" placeholder="如：https://api.openai.com/v1">
            <template #append v-if="form.provider && providerInfo[form.provider]">
              <el-button @click="fillDefaultApiBase">使用默认</el-button>
            </template>
          </el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;" v-if="form.provider && providerInfo[form.provider]">
            默认地址: {{ providerInfo[form.provider].defaultApiBase }}
          </div>
        </el-form-item>

        <el-form-item label="API密钥" prop="api_key">
          <el-input v-model="form.api_key" type="password" placeholder="输入API密钥" show-password>
            <template #prepend>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <div style="font-size: 12px; color: #e6a23c; margin-top: 4px;">
            <el-icon><Warning /></el-icon>
            API 密钥将加密存储，请妥善保管
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最大Tokens" prop="max_tokens">
              <el-input-number v-model="form.max_tokens" :min="1" :max="200000" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="温度" prop="temperature">
              <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Top P" prop="top_p">
              <el-input-number v-model="form.top_p" :min="0" :max="1" :step="0.1" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模型描述"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="激活状态">
              <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设为默认">
              <el-switch v-model="form.is_default" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ form.id ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="模型详情"
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentModel">
        <el-descriptions-item label="模型标识">{{ currentModel.name }}</el-descriptions-item>
        <el-descriptions-item label="显示名称">{{ currentModel.display_name }}</el-descriptions-item>
        <el-descriptions-item label="提供商">
          <el-tag :type="getProviderType(currentModel.provider)">
            {{ getProviderName(currentModel.provider) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模型类型">{{ currentModel.model_type }}</el-descriptions-item>
        <el-descriptions-item label="API地址" :span="2">{{ currentModel.api_base }}</el-descriptions-item>
        <el-descriptions-item label="最大Tokens">{{ currentModel.max_tokens }}</el-descriptions-item>
        <el-descriptions-item label="温度">{{ currentModel.temperature }}</el-descriptions-item>
        <el-descriptions-item label="Top P">{{ currentModel.top_p }}</el-descriptions-item>
        <el-descriptions-item label="频率惩罚">{{ currentModel.frequency_penalty }}</el-descriptions-item>
        <el-descriptions-item label="存在惩罚">{{ currentModel.presence_penalty }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentModel.is_active === 1 ? 'success' : 'danger'">
            {{ currentModel.is_active === 1 ? '激活' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否默认">
          <el-tag v-if="currentModel.is_default === 1" type="warning">默认模型</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentModel.is_system === 1 ? 'warning' : 'info'">
            {{ currentModel.is_system === 1 ? '系统内置' : '自定义' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentModel.description || '暂无描述' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentModel.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, TrendCharts, Document, DataLine, Sunny, View, Edit, Star, Delete, Link, Key, Warning, SuccessFilled, RefreshLeft } from '@element-plus/icons-vue'
import { getLLMModels, createLLMModel, updateLLMModel, deleteLLMModel, setDefaultLLMModel, getLLMProviders } from '../api/llm-model'

const loading = ref(false)
const searchQuery = ref('')
const filterProvider = ref(null)
const filterStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const models = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('添加模型')
const submitting = ref(false)
const formRef = ref(null)
const currentModel = ref(null)
const providers = ref([])  // 提供商列表

const form = reactive({
  id: null,
  uuid: null,
  name: '',
  display_name: '',
  provider: 'qwen',
  model_type: 'chat',
  api_base: '',
  api_key: '',
  api_version: '',
  max_tokens: 4096,
  temperature: 0.70,
  top_p: 0.90,
  frequency_penalty: 0.00,
  presence_penalty: 0.00,
  description: '',
  is_active: 1,
  is_default: 0
})

const rules = {
  name: [
    { required: true, message: '请输入模型标识', trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' }
  ],
  provider: [
    { required: true, message: '请选择提供商', trigger: 'change' }
  ]
}

// 获取提供商名称（从数据库动态加载）
const getProviderName = (provider) => {
  const item = providers.value.find(p => p.code === provider)
  return item?.name || provider
}

// 获取提供商类型
const getProviderType = (provider) => {
  const item = providers.value.find(p => p.code === provider)
  return item?.tag_type || 'primary'
}

// 提供商信息映射 (computed)
const providerInfo = computed(() => {
  const map = {}
  providers.value.forEach(p => {
    map[p.code] = {
      title: p.title,
      description: p.description,
      applyUrl: p.apply_url,
      docUrl: p.doc_url,
      defaultApiBase: p.default_api_base,
      hasFreeQuota: p.has_free_quota === 1
    }
  })
  return map
})

// 加载提供商列表
const loadProviders = async () => {
  try {
    const response = await getLLMProviders()
    providers.value = response.data || response || []
  } catch (error) {
    console.error('加载提供商列表失败', error)
  }
}

// 提供商变更时的处理
const onProviderChange = (provider) => {
  const info = providerInfo.value[provider]
  if (info?.defaultApiBase && !form.api_base) {
    // 如果API Base为空，自动填充默认值
    form.api_base = info.defaultApiBase
  }
}

// 填充默认 API Base
const fillDefaultApiBase = () => {
  const info = providerInfo.value[form.provider]
  if (info?.defaultApiBase) {
    form.api_base = info.defaultApiBase
    ElMessage.success('已填充默认API地址')
  }
}

// 加载模型列表
const loadModels = async () => {
  loading.value = true
  try {
    const params = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      provider: filterProvider.value || undefined,
      is_active: filterStatus.value !== null ? filterStatus.value : undefined
    }
    const response = await getLLMModels(params)
    const data = response.data || response
    models.value = data.items || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('加载模型列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadModels()
}

// 重置筛选
const resetFilters = () => {
  searchQuery.value = ''
  filterProvider.value = null
  filterStatus.value = null
  currentPage.value = 1
  loadModels()
}

// 添加模型
const addModel = () => {
  dialogTitle.value = '添加模型'
  resetForm()
  dialogVisible.value = true
}

// 编辑模型
const editModel = (row) => {
  dialogTitle.value = '编辑模型'
  form.id = row.id
  form.uuid = row.uuid
  form.name = row.name
  form.display_name = row.display_name
  form.provider = row.provider
  form.model_type = row.model_type
  form.api_base = row.api_base || ''
  form.api_key = row.api_key || ''
  form.api_version = row.api_version || ''
  form.max_tokens = row.max_tokens
  form.temperature = row.temperature
  form.top_p = row.top_p
  form.frequency_penalty = row.frequency_penalty || 0.00
  form.presence_penalty = row.presence_penalty || 0.00
  form.description = row.description || ''
  form.is_active = row.is_active
  form.is_default = row.is_default
  dialogVisible.value = true
}

// 查看模型
const viewModel = (row) => {
  currentModel.value = row
  viewDialogVisible.value = true
}

// 设置默认模型
const setDefault = async (row) => {
  try {
    await setDefaultLLMModel(row.id)
    ElMessage.success('设置成功')
    loadModels()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '设置失败')
  }
}

// 删除模型
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型 "${row.display_name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteLLMModel(row.id)
    ElMessage.success('删除成功')
    loadModels()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
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
    if (form.id) {
      // 更新（使用整数 ID）
      await updateLLMModel(form.id, form)
      ElMessage.success('更新成功')
    } else {
      // 创建
      await createLLMModel(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadModels()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.uuid = null
  form.name = ''
  form.display_name = ''
  form.provider = 'qwen'
  form.model_type = 'chat'
  form.api_base = ''
  form.api_key = ''
  form.api_version = ''
  form.max_tokens = 4096
  form.temperature = 0.70
  form.top_p = 0.90
  form.frequency_penalty = 0.00
  form.presence_penalty = 0.00
  form.description = ''
  form.is_active = 1
  form.is_default = 0
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
  loadProviders()
  loadModels()
})
</script>

<style scoped>
.llm-models-container {
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

.provider-select {
  width: 160px;
}

.provider-select :deep(.el-input__wrapper),
.status-select :deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.9);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
}

.status-select {
  width: 120px;
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
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

/* 模型卡片样式 */
.model-card {
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.model-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08);
}

.model-card .card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.model-card .header-top {
  display: flex;
  gap: 16px;
}

.model-icon {
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

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-badges {
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

.model-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.model-stats {
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
  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
  .models-grid {
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
  .provider-select,
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
