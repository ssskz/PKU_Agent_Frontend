<template>
  <div class="workflow-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <el-button @click="handleBack" :icon="ArrowLeft">返回</el-button>
        <div class="workflow-info">
          <h2 class="workflow-name">{{ workflowName }}</h2>
          <el-tag :type="getStatusType(workflowStatus)" size="small">
            {{ getStatusText(workflowStatus) }}
          </el-tag>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="handleValidate" :icon="CircleCheck">验证</el-button>
        <el-button @click="handleExecute" :icon="VideoPlay" type="primary">执行</el-button>
        <el-button @click="handleSave" :icon="Document" type="success" :loading="saving">保存</el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <!-- 左侧节点库 -->
      <div class="node-palette">
        <h3 class="palette-title">节点库</h3>
        <div class="palette-tip">
          <el-icon><InfoFilled /></el-icon>
          拖拽节点到画布，或点击添加
        </div>
        <div class="node-list">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, nodeType)"
            @click="onNodeClick2Add(nodeType)"
          >
            <el-icon :class="['node-icon', nodeType.type]">
              <component :is="nodeType.icon" />
            </el-icon>
            <div class="node-info">
              <div class="node-name">{{ nodeType.label }}</div>
              <div class="node-desc">{{ nodeType.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div 
        class="canvas-container"
        @drop="onDrop"
        @dragover="onDragOver"
      >
        <VueFlow
          ref="vueFlowRef"
          :nodes="nodes"
          :edges="edges"
          :default-viewport="{ x: 0, y: 0, zoom: 1 }"
          :min-zoom="0.2"
          :max-zoom="4"
          :snap-to-grid="true"
          :snap-grid="[15, 15]"
          :nodes-draggable="true"
          :nodes-connectable="true"
          :edges-updatable="true"
          :fit-view-on-init="true"
          @nodes-change="handleNodesChange"
          @edges-change="handleEdgesChange"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @connect="onConnect"
          @pane-click="onPaneClick"
          @node-drag-stop="onNodeDragStop"
        >
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
          <MiniMap />
          
          <!-- 自定义节点 -->
          <template #node-start="nodeProps">
            <CustomNode v-bind="nodeProps" type="start" />
          </template>
          <template #node-end="nodeProps">
            <CustomNode v-bind="nodeProps" type="end" />
          </template>
          <template #node-llm="nodeProps">
            <CustomNode v-bind="nodeProps" type="llm" />
          </template>
          <template #node-http="nodeProps">
            <CustomNode v-bind="nodeProps" type="http" />
          </template>
          <template #node-knowledge="nodeProps">
            <CustomNode v-bind="nodeProps" type="knowledge" />
          </template>
          <template #node-intent="nodeProps">
            <CustomNode v-bind="nodeProps" type="intent" />
          </template>
          <template #node-string="nodeProps">
            <CustomNode v-bind="nodeProps" type="string" />
          </template>
        </VueFlow>
      </div>

      <!-- 右侧配置面板 -->
      <div class="config-panel" v-if="selectedNode">
        <div class="panel-header">
          <h3>节点配置</h3>
          <el-button text @click="handleDeleteNode" :icon="Delete" type="danger">
            删除节点
          </el-button>
        </div>
        <div class="panel-body">
          <el-form :model="nodeConfig" label-width="100px" label-position="top">
            <el-form-item label="节点名称">
              <el-input v-model="nodeConfig.label" placeholder="输入节点名称" />
            </el-form-item>

            <!-- Start 节点配置 -->
            <template v-if="selectedNode.type === 'start'">
              <el-alert type="info" :closable="false" style="margin-bottom: 16px">
                开始节点是工作流的入口，接收输入数据
              </el-alert>
            </template>

            <!-- End 节点配置 -->
            <template v-if="selectedNode.type === 'end'">
              <el-alert type="info" :closable="false" style="margin-bottom: 16px">
                结束节点是工作流的出口，返回最终结果
              </el-alert>
            </template>

            <!-- LLM 节点配置 -->
            <template v-if="selectedNode.type === 'llm'">
              <el-form-item label="模型">
                <el-select v-model="nodeConfig.config.model_id" placeholder="选择模型" style="width: 100%">
                  <el-option
                    v-for="model in llmModels"
                    :key="model.id"
                    :label="model.display_name"
                    :value="model.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="系统提示词">
                <!-- 快速模板选择 -->
                <div class="quick-select-bar">
                  <span class="quick-label">快速模板:</span>
                  <el-button size="small" @click="nodeConfig.config.system_prompt = '你是一个专业的问答助手。请根据提供的参考资料回答用户问题。如果参考资料中没有相关信息，请如实告知。回答要准确、简洁、有条理。'">问答助手</el-button>
                  <el-button size="small" @click="nodeConfig.config.system_prompt = '你是一个友好的聊天助手，用简洁友好的方式回答用户问题。'">聊天助手</el-button>
                </div>
                <el-input
                  v-model="nodeConfig.config.system_prompt"
                  type="textarea"
                  :rows="3"
                  placeholder="输入系统提示词"
                />
              </el-form-item>

              <el-form-item label="用户提示词">
                <!-- 快速选择变量 -->
                <div class="quick-select-bar">
                  <span class="quick-label">插入变量:</span>
                  <el-button size="small" @click="insertVariable('prompt', '{{input.question}}')">用户输入</el-button>
                  <el-dropdown trigger="click" @command="(cmd) => insertVariable('prompt', cmd)">
                    <el-button size="small">
                      上游节点 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item 
                          v-for="node in upstreamNodes" 
                          :key="node.id" 
                          :command="getNodeOutputVariable(node)"
                        >
                          {{ node.data?.label || node.id }} → {{ getNodeOutputLabel(node) }}
                        </el-dropdown-item>
                        <el-dropdown-item v-if="upstreamNodes.length === 0" disabled>
                          暂无上游节点
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <!-- 快速模板 -->
                <div class="quick-select-bar" style="margin-top: 8px;">
                  <span class="quick-label">提示词模板:</span>
                  <el-button size="small" @click="applyPromptTemplate('rag')">RAG问答</el-button>
                  <el-button size="small" @click="applyPromptTemplate('simple')">简单问答</el-button>
                </div>
                <el-input
                  ref="promptInputRef"
                  v-model="nodeConfig.config.prompt"
                  type="textarea"
                  :rows="5"
                  placeholder="输入提示词"
                />
              </el-form-item>

              <el-form-item label="温度">
                <el-slider v-model="nodeConfig.config.temperature" :min="0" :max="2" :step="0.1" show-input />
              </el-form-item>

              <el-form-item label="最大Token数">
                <el-input-number v-model="nodeConfig.config.max_tokens" :min="1" :max="32000" />
              </el-form-item>
            </template>

            <!-- HTTP 节点配置 -->
            <template v-if="selectedNode.type === 'http'">
              <el-form-item label="请求方法">
                <el-select v-model="nodeConfig.config.method" style="width: 100%">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                </el-select>
              </el-form-item>

              <el-form-item label="请求URL">
                <el-input
                  v-model="nodeConfig.config.url"
                  placeholder="https://api.example.com/endpoint"
                />
                <div class="form-tip">
                  可使用变量，如: https://api.example.com/{<!-- -->{input.id}}
                </div>
              </el-form-item>

              <el-form-item label="请求头">
                <el-input
                  v-model="headersText"
                  type="textarea"
                  :rows="4"
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                />
                <div class="form-tip">
                  输入 JSON 格式的请求头
                </div>
              </el-form-item>

              <el-form-item label="请求体" v-if="nodeConfig.config.method !== 'GET' && nodeConfig.config.method !== 'DELETE'">
                <el-input
                  v-model="bodyText"
                  type="textarea"
                  :rows="6"
                  placeholder='{"key": "value"}'
                />
                <div class="form-tip">
                  输入 JSON 格式的请求体，可使用变量如 {<!-- -->{input.value}}
                </div>
              </el-form-item>

              <el-form-item label="超时时间(秒)">
                <el-input-number v-model="nodeConfig.config.timeout" :min="1" :max="300" />
              </el-form-item>
            </template>

            <!-- Knowledge 知识库检索节点配置 -->
            <template v-if="selectedNode.type === 'knowledge'">
              <el-form-item label="知识库">
                <el-select v-model="nodeConfig.config.knowledge_base_id" placeholder="选择知识库" style="width: 100%" clearable>
                  <el-option
                    v-for="kb in validKnowledgeBases"
                    :key="kb.id"
                    :label="kb.name || '未命名'"
                    :value="kb.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="查询内容">
                <!-- 快速选择按钮 -->
                <div class="quick-select-bar">
                  <span class="quick-label">快速选择:</span>
                  <el-button size="small" @click="nodeConfig.config.query = '{{input.question}}'">用户输入</el-button>
                </div>
                <el-input
                  v-model="nodeConfig.config.query"
                  type="textarea"
                  :rows="2"
                  placeholder="输入查询文本"
                />
              </el-form-item>

              <el-form-item label="返回数量">
                <el-input-number v-model="nodeConfig.config.top_k" :min="1" :max="20" />
              </el-form-item>

              <el-form-item label="相似度阈值">
                <el-slider v-model="nodeConfig.config.similarity_threshold" :min="0" :max="1" :step="0.05" show-input />
              </el-form-item>
            </template>

            <!-- Intent 意图识别节点配置 -->
            <template v-if="selectedNode.type === 'intent'">
              <el-form-item label="模型">
                <el-select v-model="nodeConfig.config.model_id" placeholder="选择模型" style="width: 100%">
                  <el-option
                    v-for="model in llmModels"
                    :key="model.id"
                    :label="model.display_name"
                    :value="model.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="输入文本">
                <el-input
                  v-model="nodeConfig.config.input_text"
                  type="textarea"
                  :rows="3"
                  placeholder="输入待识别的文本，可使用 {{variable}} 引用变量"
                />
                <div class="form-tip">
                  示例：{<!-- -->{input.user_message}}
                </div>
              </el-form-item>

              <el-form-item label="意图列表">
                <el-input
                  v-model="intentsText"
                  type="textarea"
                  :rows="8"
                  placeholder='[{"name": "查询", "description": "用户想要查询信息", "keywords": ["查", "问"]}]'
                />
                <div class="form-tip">
                  输入 JSON 数组格式，每个意图包含 name、description、keywords
                </div>
              </el-form-item>
            </template>

            <!-- String 字符串处理节点配置 -->
            <template v-if="selectedNode.type === 'string'">
              <el-form-item label="操作类型">
                <el-select v-model="nodeConfig.config.operation" style="width: 100%">
                  <el-option label="拼接 (concat)" value="concat" />
                  <el-option label="替换 (replace)" value="replace" />
                  <el-option label="分割 (split)" value="split" />
                  <el-option label="正则提取 (extract)" value="extract" />
                  <el-option label="模板格式化 (format)" value="format" />
                  <el-option label="转大写 (upper)" value="upper" />
                  <el-option label="转小写 (lower)" value="lower" />
                  <el-option label="去空白 (trim)" value="trim" />
                  <el-option label="获取长度 (length)" value="length" />
                  <el-option label="截取子串 (substring)" value="substring" />
                  <el-option label="JSON提取 (json_extract)" value="json_extract" />
                </el-select>
              </el-form-item>

              <el-form-item label="输入文本" v-if="['replace', 'split', 'extract', 'upper', 'lower', 'trim', 'length', 'substring', 'json_extract'].includes(nodeConfig.config.operation)">
                <el-input
                  v-model="nodeConfig.config.input_text"
                  type="textarea"
                  :rows="3"
                  placeholder="输入文本，可使用 {{variable}} 引用变量"
                />
              </el-form-item>

              <!-- concat 操作 -->
              <template v-if="nodeConfig.config.operation === 'concat'">
                <el-form-item label="要拼接的文本">
                  <el-input
                    v-model="textsText"
                    type="textarea"
                    :rows="4"
                    placeholder='["{{input.prefix}}", "内容", "{{nodes.llm-1.content}}"]'
                  />
                  <div class="form-tip">输入 JSON 数组格式的文本列表</div>
                </el-form-item>
                <el-form-item label="分隔符">
                  <el-input v-model="nodeConfig.config.separator" placeholder="可选，如换行符 \n" />
                </el-form-item>
              </template>

              <!-- replace 操作 -->
              <template v-if="nodeConfig.config.operation === 'replace'">
                <el-form-item label="查找内容">
                  <el-input v-model="nodeConfig.config.search" placeholder="要被替换的内容" />
                </el-form-item>
                <el-form-item label="替换为">
                  <el-input v-model="nodeConfig.config.replace_with" placeholder="新内容" />
                </el-form-item>
              </template>

              <!-- split 操作 -->
              <template v-if="nodeConfig.config.operation === 'split'">
                <el-form-item label="分隔符">
                  <el-input v-model="nodeConfig.config.delimiter" placeholder="默认为逗号 ," />
                </el-form-item>
              </template>

              <!-- extract 操作 -->
              <template v-if="nodeConfig.config.operation === 'extract'">
                <el-form-item label="正则表达式">
                  <el-input v-model="nodeConfig.config.pattern" placeholder="如: \d+ 或 [a-zA-Z]+" />
                </el-form-item>
              </template>

              <!-- format 操作 -->
              <template v-if="nodeConfig.config.operation === 'format'">
                <el-form-item label="模板">
                  <el-input
                    v-model="nodeConfig.config.template"
                    type="textarea"
                    :rows="4"
                    placeholder="模板文本，可使用 {{variable}} 引用变量"
                  />
                </el-form-item>
              </template>

              <!-- substring 操作 -->
              <template v-if="nodeConfig.config.operation === 'substring'">
                <el-form-item label="起始位置">
                  <el-input-number v-model="nodeConfig.config.start" :min="0" />
                </el-form-item>
                <el-form-item label="结束位置">
                  <el-input-number v-model="nodeConfig.config.end" :min="0" placeholder="留空表示到末尾" />
                </el-form-item>
              </template>

              <!-- json_extract 操作 -->
              <template v-if="nodeConfig.config.operation === 'json_extract'">
                <el-form-item label="JSON路径">
                  <el-input v-model="nodeConfig.config.json_path" placeholder="如: data.result.0.name" />
                  <div class="form-tip">使用点号分隔路径，数组索引使用数字</div>
                </el-form-item>
              </template>
            </template>

            <el-form-item>
              <el-button type="primary" @click="handleSaveNodeConfig" style="width: 100%">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div class="empty-state" v-else>
        <el-empty description="点击左侧节点添加到画布，然后点击节点进行配置" />
      </div>
    </div>

    <!-- 执行对话框 -->
    <el-dialog v-model="executeDialogVisible" title="执行工作流" width="600px">
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
        <el-button type="primary" @click="confirmExecute" :loading="executing">执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Document, CircleCheck, VideoPlay, Delete,
  Position, Connection, Promotion, Link, InfoFilled,
  Search, ChatDotRound, Edit, ArrowDown
} from '@element-plus/icons-vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { applyNodeChanges, applyEdgeChanges } from '@vue-flow/core'

// 导入 Vue Flow 样式
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import CustomNode from '../components/workflow/CustomNode.vue'
import {
  getWorkflow, updateWorkflow, validateWorkflow, executeWorkflow
} from '../api/workflow'
import { getActiveLLMModels } from '../api/llm-model'

const route = useRoute()
const router = useRouter()

// 数据
const workflowUuid = ref(route.params.uuid)
const workflowName = ref('加载中...')
const workflowStatus = ref('DRAFT')
const saving = ref(false)
const nodes = ref([])
const edges = ref([])
const selectedNode = ref(null)
const nodeConfig = reactive({
  label: '',
  config: {}
})
const llmModels = ref([])
const executeDialogVisible = ref(false)
const executeInputText = ref('')  // 普通文本输入
const executeInputData = ref('{}')  // JSON输入（高级模式）
const advancedMode = ref(false)  // 高级模式开关
const executing = ref(false)

// 变量提示文本（避免 Vue 模板解析双花括号）
const variablePlaceholder = '输入提示词，可使用 {{variable}} 引用变量'
const variableTip = '提示：使用 {{input.xxx}} 引用输入，{{nodes.node_id.output}} 引用节点输出'

// 节点类型定义
const nodeTypes = [
  {
    type: 'start',
    label: '开始',
    description: '工作流入口',
    icon: Position,
    color: '#67c23a'
  },
  {
    type: 'end',
    label: '结束',
    description: '工作流出口',
    icon: CircleCheck,
    color: '#909399'
  },
  {
    type: 'llm',
    label: 'LLM调用',
    description: '调用大语言模型',
    icon: Promotion,
    color: '#409eff'
  },
  {
    type: 'http',
    label: 'HTTP请求',
    description: '发送HTTP请求',
    icon: Link,
    color: '#e6a23c'
  },
  {
    type: 'knowledge',
    label: '知识库检索',
    description: '检索知识库内容',
    icon: Search,
    color: '#9333ea'
  },
  {
    type: 'intent',
    label: '意图识别',
    description: '识别用户意图',
    icon: ChatDotRound,
    color: '#06b6d4'
  },
  {
    type: 'string',
    label: '字符串处理',
    description: '文本转换处理',
    icon: Edit,
    color: '#f43f5e'
  }
]

// 计算属性
const headersText = computed({
  get: () => JSON.stringify(nodeConfig.config.headers || {}, null, 2),
  set: (val) => {
    try {
      nodeConfig.config.headers = JSON.parse(val)
    } catch (e) {
      // 忽略解析错误
    }
  }
})

const bodyText = computed({
  get: () => JSON.stringify(nodeConfig.config.body || {}, null, 2),
  set: (val) => {
    try {
      nodeConfig.config.body = JSON.parse(val)
    } catch (e) {
      // 忽略解析错误
    }
  }
})

// 意图列表文本
const intentsText = computed({
  get: () => JSON.stringify(nodeConfig.config.intents || [], null, 2),
  set: (val) => {
    try {
      nodeConfig.config.intents = JSON.parse(val)
    } catch (e) {
      // 忽略解析错误
    }
  }
})

// 文本数组
const textsText = computed({
  get: () => JSON.stringify(nodeConfig.config.texts || [], null, 2),
  set: (val) => {
    try {
      nodeConfig.config.texts = JSON.parse(val)
    } catch (e) {
      // 忽略解析错误
    }
  }
})

// 过滤有效的知识库列表（确保id不为undefined/null）
const validKnowledgeBases = computed(() => {
  const list = knowledgeBases.value
  if (!Array.isArray(list)) return []
  return list.filter(kb => kb && kb.id != null)
})

// 计算当前节点的上游节点（用于变量选择器）
const upstreamNodes = computed(() => {
  if (!selectedNode.value) return []
  
  const currentNodeId = selectedNode.value.id
  const upstreamNodeIds = new Set()
  
  // 通过边找到所有上游节点
  const findUpstream = (nodeId) => {
    edges.value.forEach(edge => {
      if (edge.target === nodeId && !upstreamNodeIds.has(edge.source)) {
        upstreamNodeIds.add(edge.source)
        findUpstream(edge.source)  // 递归查找
      }
    })
  }
  
  findUpstream(currentNodeId)
  
  // 返回上游节点列表（排除start和end）
  return nodes.value.filter(n => 
    upstreamNodeIds.has(n.id) && 
    n.type !== 'start' && 
    n.type !== 'end'
  )
})

// 获取节点的输出变量
const getNodeOutputVariable = (node) => {
  const outputMap = {
    'llm': 'content',
    'http': 'body',
    'knowledge': 'context_text',
    'intent': 'intent',
    'string': 'result'
  }
  const outputField = outputMap[node.type] || 'output'
  return `{{nodes.${node.id}.${outputField}}}`
}

// 获取节点输出的显示标签
const getNodeOutputLabel = (node) => {
  const labelMap = {
    'llm': 'AI回答内容',
    'http': 'HTTP响应',
    'knowledge': '检索结果',
    'intent': '识别意图',
    'string': '处理结果'
  }
  return labelMap[node.type] || '输出'
}

// 插入变量到提示词输入框
const insertVariable = (field, variable) => {
  if (field === 'prompt') {
    // 在当前光标位置插入，或追加到末尾
    nodeConfig.config.prompt = (nodeConfig.config.prompt || '') + variable
  }
  ElMessage.success(`已插入变量: ${variable}`)
}

// 应用提示词模板
const applyPromptTemplate = (templateType) => {
  // 查找知识库节点
  const knowledgeNode = upstreamNodes.value.find(n => n.type === 'knowledge')
  const knowledgeVar = knowledgeNode 
    ? `{{nodes.${knowledgeNode.id}.context_text}}`
    : '{{nodes.knowledge-xxx.context_text}}'
  
  const templates = {
    rag: `参考资料：
${knowledgeVar}

用户问题：{{input.question}}

请根据参考资料回答问题：`,
    simple: `{{input.question}}`
  }
  
  nodeConfig.config.prompt = templates[templateType] || ''
  ElMessage.success('已应用模板')
}

// 方法
const loadWorkflow = async () => {
  try {
    const res = await getWorkflow(workflowUuid.value)
    const workflow = res.data
    workflowName.value = workflow.name
    workflowStatus.value = workflow.status
    
    if (workflow.definition) {
      nodes.value = workflow.definition.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      }))
      
      edges.value = workflow.definition.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || ''
      }))
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '加载工作流失败')
  }
}

const loadLLMModels = async () => {
  try {
    const res = await getActiveLLMModels()
    llmModels.value = res.data
  } catch (error) {
    console.error('加载模型失败:', error)
  }
}

const getDefaultConfig = (type) => {
  const configs = {
    llm: {
      model_id: null,
      prompt: '',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 2000
    },
    http: {
      method: 'GET',
      url: '',
      headers: {},
      body: {},
      timeout: 30
    },
    knowledge: {
      knowledge_base_id: null,
      query: '',
      top_k: 5,
      similarity_threshold: 0.7
    },
    intent: {
      model_id: null,
      input_text: '',
      intents: []
    },
    string: {
      operation: 'concat',
      input_text: '',
      texts: [],
      separator: '',
      search: '',
      replace_with: '',
      delimiter: ',',
      pattern: '',
      template: '',
      start: 0,
      end: null,
      json_path: ''
    }
  }
  return configs[type] || {}
}

// 知识库列表
const knowledgeBases = ref([])

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    const { getKnowledgeBases } = await import('../api/knowledgeBases')
    const res = await getKnowledgeBases()
    console.log('知识库API返回:', res)
    
    // 处理各种可能的返回数据结构
    let list = []
    if (res.data) {
      if (Array.isArray(res.data)) {
        list = res.data
      } else if (res.data.items && Array.isArray(res.data.items)) {
        list = res.data.items
      } else if (res.data.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (typeof res.data === 'object') {
        // 可能是分页对象，尝试找到数组
        const keys = Object.keys(res.data)
        for (const key of keys) {
          if (Array.isArray(res.data[key])) {
            list = res.data[key]
            break
          }
        }
      }
    } else if (Array.isArray(res)) {
      list = res
    }
    
    knowledgeBases.value = list
    console.log('知识库列表:', knowledgeBases.value)
  } catch (error) {
    console.error('加载知识库失败:', error)
    knowledgeBases.value = []
  }
}

const onNodeClick2Add = (nodeType) => {
  // 点击添加节点
  const centerX = 300
  const centerY = 200
  const offset = nodes.value.length * 60
  
  const position = {
    x: centerX + (offset % 400),
    y: centerY + Math.floor(offset / 400) * 150
  }

  const id = `${nodeType.type}-${Date.now()}`

  const newNode = {
    id,
    type: nodeType.type,
    position,
    data: {
      label: nodeType.label,
      config: getDefaultConfig(nodeType.type)
    }
  }

  nodes.value.push(newNode)
  ElMessage.success(`${nodeType.label}节点已添加`)
}

const onNodeClick = (event) => {
  const node = event.node
  selectedNode.value = node
  nodeConfig.label = node.data?.label || ''
  // 确保 config 有默认值，防止模板中访问 undefined
  const defaultConfig = getDefaultConfig(node.type)
  nodeConfig.config = { ...defaultConfig, ...(node.data?.config || {}) }
  console.log('节点被点击:', node.id)
}

const onEdgeClick = (event) => {
  const edge = event.edge
  ElMessageBox.confirm('确定要删除这条连线吗？', '确认删除', {
    type: 'warning'
  }).then(() => {
    edges.value = edges.value.filter(e => e.id !== edge.id)
    ElMessage.success('连线已删除')
  }).catch(() => {})
}

const onConnect = (params) => {
  const newEdge = {
    id: `edge-${Date.now()}`,
    source: params.source,
    target: params.target,
    label: ''
  }
  edges.value.push(newEdge)
  ElMessage.success('连线已创建')
}

const handleNodesChange = (changes) => {
  nodes.value = applyNodeChanges(changes, nodes.value)
}

const handleEdgesChange = (changes) => {
  edges.value = applyEdgeChanges(changes, edges.value)
}

const handleSaveNodeConfig = () => {
  if (!selectedNode.value) return

  const node = nodes.value.find(n => n.id === selectedNode.value.id)
  if (node) {
    node.data.label = nodeConfig.label
    node.data.config = { ...nodeConfig.config }
    ElMessage.success('配置已保存')
  }
}

const handleDeleteNode = () => {
  if (!selectedNode.value) return

  ElMessageBox.confirm('确定要删除这个节点吗？', '确认删除', {
    type: 'warning'
  }).then(() => {
    nodes.value = nodes.value.filter(n => n.id !== selectedNode.value.id)
    // 同时删除相关的边
    edges.value = edges.value.filter(e => 
      e.source !== selectedNode.value.id && e.target !== selectedNode.value.id
    )
    selectedNode.value = null
    ElMessage.success('节点已删除')
  }).catch(() => {})
}

const handleSave = async () => {
  try {
    saving.value = true

    const definition = {
      nodes: nodes.value.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.value.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || ''
      }))
    }

    await updateWorkflow(workflowUuid.value, { definition })
    ElMessage.success('工作流已保存')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleValidate = async () => {
  try {
    await handleSave()
    const res = await validateWorkflow(workflowUuid.value)
    const result = res.data

    if (result.is_valid) {
      ElMessage.success('工作流验证通过！')
    } else {
      let message = '验证失败：\n\n'
      if (result.errors.length > 0) {
        message += '错误：\n' + result.errors.join('\n') + '\n\n'
      }
      if (result.warnings.length > 0) {
        message += '警告：\n' + result.warnings.join('\n')
      }
      ElMessageBox.alert(message, '验证结果', { type: 'error' })
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '验证失败')
  }
}

const handleExecute = async () => {
  await handleSave()
  
  // 检查工作流是否有节点
  if (nodes.value.length === 0) {
    ElMessage.warning('请先添加至少一个节点后再执行')
    return
  }
  
  // 检查是否有开始节点
  const hasStartNode = nodes.value.some(n => n.type === 'start')
  if (!hasStartNode) {
    ElMessage.warning('工作流缺少开始节点，请先添加开始节点')
    return
  }
  
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
    const res = await executeWorkflow(workflowUuid.value, { input_data: inputData })
    ElMessage.success('工作流已开始执行')
    executeDialogVisible.value = false

    const execution = res.data
    if (execution.status === 'COMPLETED') {
      // 获取节点的输出作为结果展示
      let resultContent = ''
      const outputData = execution.output_data || {}
      const nodeOutputs = outputData.nodes || outputData
      
      // 按优先级查找可展示的结果
      for (const [nodeId, nodeOutput] of Object.entries(nodeOutputs)) {
        if (!nodeOutput) continue
        
        // 1. LLM 节点输出
        if (nodeOutput.content) {
          resultContent = nodeOutput.content
          break
        }
        // 2. HTTP 节点输出
        if (nodeOutput.body !== undefined) {
          const body = nodeOutput.body
          resultContent = `HTTP 状态码: ${nodeOutput.status_code}\n\n` +
            `响应内容:\n${typeof body === 'object' ? JSON.stringify(body, null, 2) : body}`
          break
        }
        // 3. 知识库检索输出
        if (nodeOutput.context_text) {
          resultContent = `检索到 ${nodeOutput.count} 条结果:\n\n${nodeOutput.context_text}`
          break
        }
        // 4. 字符串处理输出
        if (nodeOutput.result !== undefined) {
          resultContent = `处理结果:\n${JSON.stringify(nodeOutput.result, null, 2)}`
          break
        }
        // 5. 意图识别输出
        if (nodeOutput.intent) {
          resultContent = `识别意图: ${nodeOutput.intent}\n置信度: ${nodeOutput.confidence}\n原因: ${nodeOutput.reason}`
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
      ElMessageBox.alert(`执行失败：${execution.error_message}`, '执行失败', { type: 'error' })
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '执行失败')
  } finally {
    executing.value = false
  }
}

const handleBack = () => {
  router.push('/workflows')
}

const getStatusType = (status) => {
  const typeMap = { DRAFT: 'warning', PUBLISHED: 'success', ARCHIVED: 'info' }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' }
  return textMap[status] || status
}

// VueFlow 引用
const vueFlowRef = ref(null)

// 获取 VueFlow 实例方法
const { screenToFlowCoordinate, project } = useVueFlow()

// 拖拽相关 - 存储当前拖拽的节点类型
let draggedNodeType = null

// 拖拽开始
const onDragStart = (event, nodeType) => {
  draggedNodeType = nodeType
  event.dataTransfer.setData('application/vueflow', nodeType.type)
  event.dataTransfer.effectAllowed = 'move'
}

// 拖拽经过画布
const onDragOver = (event) => {
  event.preventDefault()
  if (draggedNodeType) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽放下 - 在画布上创建节点
const onDrop = (event) => {
  event.preventDefault()
  
  if (!draggedNodeType) return
  
  // 获取画布容器的位置
  const canvasEl = event.currentTarget
  const rect = canvasEl.getBoundingClientRect()
  
  // 计算相对于画布的位置
  const position = {
    x: event.clientX - rect.left - 60,  // 减去节点宽度的一半
    y: event.clientY - rect.top - 20    // 减去节点高度的一半
  }
  
  const id = `${draggedNodeType.type}-${Date.now()}`
  
  const newNode = {
    id,
    type: draggedNodeType.type,
    position,
    data: {
      label: draggedNodeType.label,
      config: getDefaultConfig(draggedNodeType.type)
    }
  }
  
  nodes.value.push(newNode)
  ElMessage.success(`${draggedNodeType.label}节点已添加`)
  
  // 重置
  draggedNodeType = null
}

// 点击画布空白区域取消选中
const onPaneClick = () => {
  selectedNode.value = null
}

// 节点拖拽结束 - 更新位置
const onNodeDragStop = (event) => {
  // 节点拖拽后自动更新位置（VueFlow 已处理）
  console.log('节点拖拽结束:', event.node?.id)
}

// 生命周期
onMounted(() => {
  loadWorkflow()
  loadLLMModels()
  loadKnowledgeBases()
})
</script>

<style scoped>
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.editor-header {
  background: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workflow-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.node-palette {
  width: 240px;
  background: white;
  border-right: 1px solid #e4e7ed;
  padding: 16px;
  overflow-y: auto;
}

.palette-title {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.palette-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #ecf5ff;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #409eff;
  margin-bottom: 16px;
}

.palette-tip .el-icon {
  font-size: 14px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.node-item:hover {
  background: #e4e7ed;
  transform: translateX(4px);
}

.node-item:active {
  background: #d4d7dd;
}

.node-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  color: white;
}

.node-icon.start { background: #67c23a; }
.node-icon.end { background: #909399; }
.node-icon.llm { background: #409eff; }
.node-icon.http { background: #e6a23c; }
.node-icon.knowledge { background: #9333ea; }
.node-icon.intent { background: #06b6d4; }
.node-icon.string { background: #f43f5e; }

.node-info {
  flex: 1;
}

.node-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.node-desc {
  font-size: 0.75rem;
  color: #909399;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.config-panel,
.empty-state {
  width: 320px;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-tip {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #909399;
  line-height: 1.4;
}

/* 快速选择栏 */
.quick-select-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.quick-select-bar .quick-label {
  font-size: 0.75rem;
  color: #606266;
  white-space: nowrap;
}

.quick-select-bar .el-button {
  padding: 4px 8px;
  font-size: 0.75rem;
}
</style>
