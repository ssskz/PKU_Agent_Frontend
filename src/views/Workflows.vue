<template>
  <div class="workflows-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon class="title-icon"><Compass /></el-icon>
          工作流管理
        </h1>
        <p class="page-desc">可视化工作流编排与执行</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="large" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          创建工作流
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="statistics">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_workflows }}</div>
          <div class="stat-label">总工作流</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <el-icon><Edit /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.draft_workflows }}</div>
          <div class="stat-label">草稿</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_executions }}</div>
          <div class="stat-label">总执行次数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ successRate }}%</div>
          <div class="stat-label">成功率</div>
        </div>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filter-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索工作流名称或描述"
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
        class="search-input"
      />
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="loadWorkflows" class="filter-select">
        <el-option label="全部状态" value="" />
        <el-option label="草稿" value="DRAFT" />
        <el-option label="已发布" value="PUBLISHED" />
        <el-option label="已归档" value="ARCHIVED" />
      </el-select>
    </div>

    <!-- 工作流列表 -->
    <div class="workflows-list">
      <el-card v-for="workflow in workflows" :key="workflow.uuid" class="workflow-card" shadow="hover">
        <div class="workflow-header">
          <div class="workflow-title-area">
            <h3 class="workflow-name">{{ workflow.name }}</h3>
            <el-tag :type="getStatusType(workflow.status)" size="small">
              {{ getStatusText(workflow.status) }}
            </el-tag>
          </div>
          <div class="workflow-actions">
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
        
        <p class="workflow-desc">{{ workflow.description || '暂无描述' }}</p>
        
        <div class="workflow-stats">
          <div class="stat-item">
            <el-icon><Document /></el-icon>
            <span>版本 {{ workflow.version }}</span>
          </div>
          <div class="stat-item">
            <el-icon><VideoPlay /></el-icon>
            <span>执行 {{ workflow.execution_count }} 次</span>
          </div>
          <div class="stat-item">
            <el-icon><CircleCheck /></el-icon>
            <span>成功 {{ workflow.success_count }} 次</span>
          </div>
          <div class="stat-item">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDate(workflow.updated_at) }}</span>
          </div>
        </div>
      </el-card>

      <el-empty v-if="!loading && workflows.length === 0" description="暂无工作流" />
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadWorkflows"
        @current-change="loadWorkflows"
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
  Clock, TrendCharts
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

const getStatusText = (status) => {
  const textMap = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档'
  }
  return textMap[status] || status
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
  padding: 0;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 32px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 
    0 20px 60px rgba(102, 126, 234, 0.3),
    0 8px 24px rgba(118, 75, 162, 0.2);
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

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.filter-select {
  width: 150px;
}

/* 工作流列表 */
.workflows-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.workflow-card {
  border-radius: 16px;
  transition: all 0.3s ease;
}

.workflow-card:hover {
  transform: translateY(-4px);
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.workflow-title-area {
  flex: 1;
  min-width: 0;
}

.workflow-name {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.workflow-desc {
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 48px;
}

.workflow-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-item .el-icon {
  font-size: 16px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 表单提示 */
.form-tip {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #64748b;
}

/* 响应式 */
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

  .workflows-list {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
    max-width: none;
  }
}
</style>
