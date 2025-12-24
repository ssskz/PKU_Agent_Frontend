<template>
  <div class="workflows-container">
    <!-- 页面头部：标题 + 筛选 + 操作 -->
    <div class="page-header-section">
      <div class="header-top">
        <div class="header-title">
          <h2><el-icon><Compass /></el-icon> 工作流管理</h2>
          <span class="header-subtitle">可视化工作流编排与执行</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            创建工作流
          </el-button>
        </div>
      </div>
      
      <!-- 统计指标 -->
      <div class="header-stats" v-if="statistics">
        <div class="stat-item">
          <span class="stat-value">{{ statistics.total_workflows }}</span>
          <span class="stat-label">总工作流</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ statistics.draft_workflows }}</span>
          <span class="stat-label">草稿</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ statistics.total_executions }}</span>
          <span class="stat-label">执行次数</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value success">{{ successRate }}%</span>
          <span class="stat-label">成功率</span>
        </div>
      </div>
      
      <!-- 筛选区 -->
      <div class="header-filters">
        <el-input
          v-model="searchText"
          placeholder="搜索工作流名称或描述..."
          clearable
          class="search-input"
          @change="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select 
          v-model="filterStatus" 
          placeholder="状态筛选" 
          clearable 
          @change="loadWorkflows" 
          class="status-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="已归档" value="ARCHIVED" />
        </el-select>
        
        <el-button @click="resetFilters" class="reset-btn">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 工作流列表 -->
    <div class="workflows-grid" v-loading="loading">
      <div
        v-for="workflow in workflows"
        :key="workflow.uuid"
        class="workflow-card"
        @click="handleEdit(workflow)"
      >
        <!-- 卡片头部 -->
        <div class="card-header" :class="getStatusClass(workflow.status)">
          <div class="header-content">
            <div class="workflow-icon">
              <el-icon :size="24"><Compass /></el-icon>
            </div>
            <div class="workflow-info">
              <h3 class="workflow-name">{{ workflow.name }}</h3>
              <div class="workflow-badges">
                <el-tag :type="getStatusType(workflow.status)" size="small" effect="dark">
                  {{ getStatusText(workflow.status) }}
                </el-tag>
                <el-tag v-if="workflow.version > 1" type="info" size="small" effect="plain">
                  v{{ workflow.version }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片主体 -->
        <div class="card-body">
          <p class="workflow-desc">{{ workflow.description || '暂无描述' }}</p>

          <div class="workflow-stats">
            <div class="stat-row">
              <div class="stat-item">
                <el-icon class="stat-icon play"><VideoPlay /></el-icon>
                <div class="stat-info">
                  <span class="stat-value">{{ workflow.execution_count || 0 }}</span>
                  <span class="stat-label">执行次数</span>
                </div>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon success"><CircleCheck /></el-icon>
                <div class="stat-info">
                  <span class="stat-value">{{ workflow.success_count || 0 }}</span>
                  <span class="stat-label">成功次数</span>
                </div>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon rate"><TrendCharts /></el-icon>
                <div class="stat-info">
                  <span class="stat-value">{{ getWorkflowSuccessRate(workflow) }}%</span>
                  <span class="stat-label">成功率</span>
                </div>
              </div>
            </div>
          </div>

          <div class="workflow-meta">
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ formatDate(workflow.updated_at) }}
            </span>
          </div>
        </div>

        <!-- 卡片底部操作 -->
        <div class="card-footer" @click.stop>
          <el-button size="small" @click="handleEdit(workflow)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" type="primary" @click="handleExecute(workflow)" :disabled="!workflow.definition">
            <el-icon><VideoPlay /></el-icon>
            执行
          </el-button>
          <el-dropdown @command="(cmd) => handleCommand(cmd, workflow)">
            <el-button size="small">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view">查看详情</el-dropdown-item>
                <el-dropdown-item command="history">执行历史</el-dropdown-item>
                <el-dropdown-item command="validate" :disabled="!workflow.definition">验证</el-dropdown-item>
                <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-empty v-if="!loading && workflows.length === 0" description="暂无工作流，点击上方按钮创建" />
    </div>

    <!-- 分页区域 -->
    <div class="pagination-section" v-if="total > 0">
      <div class="pagination-info">
        <span class="total-text">共 <strong>{{ total }}</strong> 个工作流</span>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        @size-change="loadWorkflows"
        @current-change="loadWorkflows"
        class="custom-pagination"
      />
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="工作流名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入工作流名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作流描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '创建并编辑' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 执行对话框 -->
    <el-dialog
      v-model="executeDialogVisible"
      title="执行工作流"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="输入内容">
          <el-input
            v-model="executeInputText"
            type="textarea"
            :rows="4"
            placeholder="请输入您的问题或内容..."
          />
          <div class="form-tip">直接输入您要处理的内容，系统会自动传递给工作流</div>
        </el-form-item>
        
        <!-- 高级模式切换 -->
        <el-form-item>
          <el-checkbox v-model="advancedMode">高级模式（JSON输入）</el-checkbox>
        </el-form-item>
        
        <el-form-item v-if="advancedMode" label="JSON数据">
          <el-input
            v-model="executeInputData"
            type="textarea"
            :rows="6"
            placeholder='{"question": "您的问题", "context": "附加信息"}'
          />
          <div class="form-tip">高级用户可直接编辑 JSON 格式数据</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExecute" :loading="executing">
          执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Compass, Plus, Search, Edit, VideoPlay, More, Document, CircleCheck,
  Clock, TrendCharts, RefreshLeft
} from '@element-plus/icons-vue'
import {
  getWorkflows, createWorkflow, deleteWorkflow, validateWorkflow,
  executeWorkflow, getWorkflowStatistics
} from '../api/workflow'

const router = useRouter()

// 数据
const loading = ref(false)
const workflows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchText = ref('')
const filterStatus = ref('')
const statistics = ref(null)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('创建工作流')
const isEdit = ref(false)
const formRef = ref(null)
const formData = ref({
  name: '',
  description: ''
})
const formRules = {
  name: [
    { required: true, message: '请输入工作流名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
  ]
}
const submitting = ref(false)

// 执行对话框
const executeDialogVisible = ref(false)
const executeWorkflowData = ref(null)
const executeInputText = ref('')  // 普通文本输入
const executeInputData = ref('{}')  // JSON输入（高级模式）
const advancedMode = ref(false)  // 高级模式开关
const executing = ref(false)

// 计算属性
const successRate = computed(() => {
  if (!statistics.value || statistics.value.total_executions === 0) return 0
  return Math.round((statistics.value.successful_executions / statistics.value.total_executions) * 100)
})

// 方法
const loadWorkflows = async () => {
  try {
    loading.value = true
    const params = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (searchText.value) {
      params.search = searchText.value
    }
    const res = await getWorkflows(params)
    workflows.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '加载工作流失败')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const res = await getWorkflowStatistics()
    statistics.value = res.data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadWorkflows()
}

const resetFilters = () => {
  searchText.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadWorkflows()
}

const showCreateDialog = () => {
  dialogTitle.value = '创建工作流'
  isEdit.value = false
  formData.value = {
    name: '',
    description: ''
  }
  dialogVisible.value = true
}

const handleEdit = (workflow) => {
  router.push(`/workflows/${workflow.uuid}/edit`)
}

const handleExecute = (workflow) => {
  // 检查工作流是否有定义
  if (!workflow.definition || !workflow.definition.nodes || workflow.definition.nodes.length === 0) {
    ElMessage.warning('请先编辑工作流，添加至少一个节点后再执行')
    return
  }
  
  // 检查是否有开始节点
  const hasStartNode = workflow.definition.nodes.some(n => n.type === 'start')
  if (!hasStartNode) {
    ElMessage.warning('工作流缺少开始节点，请先添加开始节点')
    return
  }
  
  executeWorkflowData.value = workflow
  // 重置输入
  executeInputText.value = ''
  executeInputData.value = '{}'
  advancedMode.value = false
  executeDialogVisible.value = true
}

const confirmExecute = async () => {
  try {
    let inputData = {}
    
    // 根据模式构建输入数据
    if (advancedMode.value) {
      // 高级模式：使用JSON输入
      if (executeInputData.value.trim()) {
        try {
          inputData = JSON.parse(executeInputData.value)
        } catch (e) {
          ElMessage.error('JSON 格式错误，请检查输入')
          return
        }
      }
    } else {
      // 普通模式：将文本包装为标准输入格式
      const text = executeInputText.value.trim()
      if (text) {
        // 支持多种常用变量名，方便工作流引用
        inputData = {
          text: text,           // {{input.text}}
          question: text,       // {{input.question}}
          content: text,        // {{input.content}}
          message: text,        // {{input.message}}
          query: text,          // {{input.query}}
          input: text           // {{input.input}}
        }
      }
    }

    executing.value = true
    const res = await executeWorkflow(executeWorkflowData.value.uuid, { input_data: inputData })
    ElMessage.success('工作流已开始执行')
    executeDialogVisible.value = false
    
    // 显示执行结果
    const execution = res.data
    if (execution.status === 'COMPLETED') {
      // 获取LLM节点的输出作为结果展示
      let resultContent = ''
      const outputData = execution.output_data || {}
      const nodeOutputs = outputData.nodes || outputData
      
      // 尝试找到LLM节点的输出
      for (const [nodeId, nodeOutput] of Object.entries(nodeOutputs)) {
        if (nodeOutput && nodeOutput.content) {
          resultContent = nodeOutput.content
          break
        }
      }
      
      if (resultContent) {
        ElMessageBox.alert(resultContent, '执行结果', {
          confirmButtonText: '确定',
          dangerouslyUseHTMLString: false
        })
      } else {
        ElMessageBox.alert(`执行成功！耗时：${execution.duration_seconds}秒`, '执行完成')
      }
    } else if (execution.status === 'FAILED') {
      ElMessageBox.alert(`执行失败：${execution.error_message}`, '执行失败', {
        type: 'error'
      })
    }
    
    loadWorkflows()
    loadStatistics()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '执行工作流失败')
  } finally {
    executing.value = false
  }
}

const handleCommand = async (command, workflow) => {
  switch (command) {
    case 'view':
      router.push(`/workflows/${workflow.uuid}`)
      break
    case 'history':
      router.push(`/workflows/${workflow.uuid}/executions`)
      break
    case 'validate':
      await handleValidate(workflow)
      break
    case 'duplicate':
      await handleDuplicate(workflow)
      break
    case 'delete':
      await handleDelete(workflow)
      break
  }
}

const handleValidate = async (workflow) => {
  try {
    const res = await validateWorkflow(workflow.uuid)
    const result = res.data
    if (result.is_valid) {
      ElMessage.success('工作流验证通过')
    } else {
      ElMessageBox.alert(
        `错误：\n${result.errors.join('\n')}\n\n警告：\n${result.warnings.join('\n')}`,
        '验证失败',
        { type: 'error' }
      )
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '验证失败')
  }
}

const handleDuplicate = async (workflow) => {
  try {
    const res = await createWorkflow({
      name: `${workflow.name} (副本)`,
      description: workflow.description,
      definition: workflow.definition
    })
    ElMessage.success('工作流已复制')
    loadWorkflows()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '复制失败')
  }
}

const handleDelete = async (workflow) => {
  try {
    await ElMessageBox.confirm(`确定要删除工作流"${workflow.name}"吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteWorkflow(workflow.uuid)
    ElMessage.success('工作流已删除')
    loadWorkflows()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const res = await createWorkflow(formData.value)
    ElMessage.success('工作流创建成功')
    dialogVisible.value = false
    
    // 跳转到编辑页面
    router.push(`/workflows/${res.data.uuid}/edit`)
  } catch (error) {
    if (error.response) {
      ElMessage.error(error.response.data.message || '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const getStatusType = (status) => {
  const typeMap = {
    DRAFT: 'warning',
    PUBLISHED: 'success',
    ARCHIVED: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusClass = (status) => {
  const classMap = {
    DRAFT: 'status-draft',
    PUBLISHED: 'status-published',
    ARCHIVED: 'status-archived'
  }
  return classMap[status] || 'status-draft'
}

const getStatusText = (status) => {
  const textMap = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档'
  }
  return textMap[status] || status
}

const getWorkflowSuccessRate = (workflow) => {
  if (!workflow.execution_count || workflow.execution_count === 0) return 0
  return Math.round((workflow.success_count || 0) / workflow.execution_count * 100)
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadWorkflows()
  loadStatistics()
})
</script>

<style scoped>
.workflows-container {
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

/* 统计指标区域 */
.header-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.header-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.header-stats .stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #667eea;
  line-height: 1;
}

.header-stats .stat-value.success {
  color: #10b981;
}

.header-stats .stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(226, 232, 240, 0.8);
}

/* 筛选区域 */
.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
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
  width: 160px;
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

/* 工作流卡片网格 */
.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* 工作流卡片样式 */
.workflow-card {
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

.workflow-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.workflow-card .card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.workflow-card .card-header.status-draft {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.workflow-card .card-header.status-published {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.workflow-card .card-header.status-archived {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.workflow-card .header-content {
  display: flex;
  gap: 16px;
}

.workflow-icon {
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

.workflow-info {
  flex: 1;
  min-width: 0;
}

.workflow-card .workflow-name {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 卡片主体 */
.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

.workflow-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

/* 卡片内统计区域 */
.workflow-stats {
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.workflow-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.workflow-stats .stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.workflow-stats .stat-icon.play {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.workflow-stats .stat-icon.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.workflow-stats .stat-icon.rate {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-info .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-info .stat-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* 元信息区域 */
.workflow-meta {
  display: flex;
  justify-content: flex-end;
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

/* 卡片底部操作区 */
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
  min-width: 70px;
  border-radius: 10px;
}

.card-footer .el-dropdown {
  flex-shrink: 0;
}

.card-footer .el-dropdown .el-button {
  flex: none;
  min-width: auto;
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

/* 表单提示 */
.form-tip {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #64748b;
}

/* 响应式设计 */
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
  .workflows-grid {
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
  
  .header-stats {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .stat-divider {
    display: none;
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
