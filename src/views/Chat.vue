<template>
  <div class="chat-container">
    <!-- 简化的智能体信息栏 -->
    <div class="chat-info-bar">
      <div class="agent-brief">
        <div class="agent-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="agent-name-wrapper">
          <span class="agent-name">{{ agent?.name || '智能体' }}</span>
          <el-tag v-if="agent?.llm_model_name" size="small" type="success" class="model-tag">
            {{ agent?.llm_model_name }}
          </el-tag>
        </div>
      </div>
      <div class="chat-actions">
        <el-tooltip content="清空对话" placement="bottom">
          <el-button circle size="small" @click="clearHistory" :disabled="messages.length === 0">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="返回列表" placement="bottom">
          <el-button circle size="small" @click="goBack">
            <el-icon><Back /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-chat">
        <el-icon class="empty-icon"><ChatDotSquare /></el-icon>
        <p>开始与智能体对话吧！</p>
        <div class="quick-questions" v-if="suggestedQuestions.length > 0">
          <p class="quick-title">你可以这样问：</p>
          <el-button
            v-for="(question, index) in suggestedQuestions"
            :key="index"
            text
            @click="sendMessage(question)"
            class="quick-question"
          >
            {{ question }}
          </el-button>
        </div>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message-item', message.role]"
      >
        <div class="message-avatar">
          <el-icon v-if="message.role === 'user'"><User /></el-icon>
          <el-icon v-else><Cpu /></el-icon>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)"></div>
          
          <!-- 知识库检索来源 -->
          <div v-if="message.knowledge_sources && message.knowledge_sources.length > 0" class="knowledge-sources">
            <div v-for="(source, idx) in message.knowledge_sources" :key="idx" class="knowledge-source-item">
              <el-alert type="success" :closable="false">
                <template #title>
                  <div class="knowledge-header">
                    <el-icon><Reading /></el-icon>
                    <span>检索知识库: {{ source.knowledge_base_name }}</span>
                    <el-tag size="small" type="success" style="margin-left: 8px;">命中</el-tag>
                  </div>
                </template>
                <div class="knowledge-source-details">
                  <div class="source-info">
                    <div class="source-header">
                      <el-tag size="small" type="primary">文档</el-tag>
                      <span class="source-title">《{{ source.document_title }}》</span>
                      <el-tag size="small" :type="getSimilarityType(source.similarity)">
                        相似度: {{ (source.similarity * 100).toFixed(1) }}%
                      </el-tag>
                    </div>
                    <div class="source-content">{{ source.chunk_content }}</div>
                    <div class="source-meta">文本块 #{{ source.chunk_index }}</div>
                  </div>
                </div>
              </el-alert>
            </div>
          </div>
          
          <!-- 插件调用信息 -->
          <div v-if="message.plugin_calls && message.plugin_calls.length > 0" class="plugin-calls">
            <div v-for="(call, idx) in message.plugin_calls" :key="idx" class="plugin-call-item">
              <el-alert type="info" :closable="false">
                <template #title>
                  <el-icon><Connection /></el-icon>
                  调用插件: {{ call.plugin_name }} - {{ call.function_name }}
                </template>
                <div class="plugin-call-details">
                  <div class="plugin-args">
                    <strong>调用参数：</strong>
                    <pre>{{ JSON.stringify(call.arguments, null, 2) }}</pre>
                  </div>
                  <div class="plugin-result">
                    <strong>执行结果：</strong>
                    <div>{{ call.result }}</div>
                  </div>
                </div>
              </el-alert>
            </div>
          </div>
          
          <!-- Token 使用量 -->
          <div v-if="message.token_usage" class="token-usage">
            <el-tag size="small" type="info">
              <el-icon><DataAnalysis /></el-icon>
              Token: {{ message.token_usage.total_tokens }} 
              (输入: {{ message.token_usage.prompt_tokens }}, 
              输出: {{ message.token_usage.completion_tokens }})
            </el-tag>
          </div>
          
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <div v-if="isThinking" class="message-item assistant thinking">
        <div class="message-avatar">
          <el-icon><Cpu /></el-icon>
        </div>
        <div class="message-content">
          <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入消息... (Ctrl+Enter 发送)"
          @keydown.ctrl.enter="handleSend"
          :disabled="isThinking"
          class="message-input"
        />
        <div class="input-actions">
          <el-button
            type="primary"
            @click="handleSend"
            :loading="isThinking"
            :disabled="!inputMessage.trim()"
            class="send-button"
          >
            <el-icon><Promotion /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  ChatDotSquare,
  User,
  Cpu,
  Connection,
  Delete,
  Back,
  Promotion,
  DataAnalysis,
  Reading
} from '@element-plus/icons-vue'
import { getAgent } from '@/api/agent'
import { chatWithAgent } from '@/api/chat'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const agentUuid = computed(() => route.params.uuid)
const agent = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isThinking = ref(false)
const messagesContainer = ref(null)

// 建议问题
const suggestedQuestions = ref([
  '你好，请介绍一下自己',
  '你能帮我做什么？',
  '让我看看你的能力'
])

// 加载智能体信息
const loadAgent = async () => {
  try {
    const response = await getAgent(agentUuid.value)
    agent.value = response.data || response
    
    // 从提示词中提取建议问题
    if (agent.value.system_prompt) {
      // 可以根据提示词内容生成更智能的建议问题
      suggestedQuestions.value = [
        `你好，${agent.value.name}`,
        '你能帮我做什么？',
        '介绍一下你的功能'
      ]
    }
  } catch (error) {
    ElMessage.error('加载智能体信息失败')
    console.error(error)
  }
}

// 发送消息
const sendMessage = async (content) => {
  const messageText = content || inputMessage.value.trim()
  if (!messageText) return

  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: messageText,
    timestamp: new Date()
  }
  messages.value.push(userMessage)
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 调用 API
  isThinking.value = true
  try {
    const response = await chatWithAgent({
      agent_uuid: agentUuid.value,
      message: messageText,
      history: messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    const data = response.data || response

    // 添加助手回复
    const assistantMessage = {
      role: 'assistant',
      content: data.response || data.message,
      timestamp: new Date()
    }

    // 如果有函数调用信息
    if (data.function_call) {
      assistantMessage.function_call = data.function_call
    }
    
    // 添加插件调用信息
    if (data.plugin_calls && data.plugin_calls.length > 0) {
      assistantMessage.plugin_calls = data.plugin_calls
    }
    
    // 添加 Token 使用量
    if (data.token_usage) {
      assistantMessage.token_usage = data.token_usage
    }

    messages.value.push(assistantMessage)

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送消息失败')
    console.error(error)
    // 移除失败的用户消息
    messages.value.pop()
  } finally {
    isThinking.value = false
  }
}

// 处理发送
const handleSend = () => {
  sendMessage()
}

// 清空历史
const clearHistory = () => {
  ElMessageBox.confirm(
    '确定要清空所有对话记录吗？',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    messages.value = []
    ElMessage.success('对话记录已清空')
  }).catch(() => {})
}

// 返回
const goBack = () => {
  router.push('/agents')
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息（支持 Markdown）
const formatMessage = (content) => {
  try {
    return marked.parse(content || '')
  } catch (error) {
    return content
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 获取相似度标签类型
const getSimilarityType = (similarity) => {
  if (similarity >= 0.8) return 'success'
  if (similarity >= 0.7) return 'warning'
  return 'info'
}

onMounted(async () => {
  await loadAgent()
})
</script>

<style scoped>
/* ========== 聊天容器 - 全屏设计 ========== */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
  overflow: hidden;
  position: relative;
}

.chat-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(102, 126, 234, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(118, 75, 162, 0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 简化信息栏 ========== */
.chat-info-bar {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  padding: 12px 20px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}

.agent-brief {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.agent-name-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.2px;
}

.model-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}

.chat-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-actions .el-button {
  border: 1px solid rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 0.8);
  color: #64748b;
  transition: all 0.2s ease;
}

.chat-actions .el-button:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
}

/* ========== 消息容器 ========== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.2);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.4);
}

/* ========== 空状态 ========== */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.6;
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-chat p {
  font-size: 18px;
  margin-bottom: 28px;
  font-weight: 600;
  color: #475569;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 600px;
}

.quick-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
  width: 100%;
  text-align: center;
  font-weight: 500;
}

.quick-question {
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  padding: 10px 20px;
  color: #667eea;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.quick-question:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

/* ========== 消息项 ========== */
.message-item {
  display: flex;
  gap: 14px;
  animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.message-avatar:hover {
  transform: scale(1.08);
}

.message-item.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.message-item.assistant .message-avatar {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.3);
}

.message-content {
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-text {
  background: rgba(255, 255, 255, 0.95);
  padding: 18px 24px;
  border-radius: 20px;
  border-top-left-radius: 6px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  word-wrap: break-word;
  line-height: 1.8;
  color: #1e293b;
  font-size: 15px;
  max-width: 100%;
  overflow-x: auto;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.message-text:hover {
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  border-top-right-radius: 6px;
  border: none;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.35),
    0 4px 12px rgba(102, 126, 234, 0.2);
}

.message-item.user .message-text:hover {
  box-shadow: 
    0 12px 40px rgba(102, 126, 234, 0.4),
    0 6px 16px rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.message-text :deep(p) {
  margin: 0 0 8px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-text :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

/* Markdown 列表样式 */
.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
  line-height: 1.8;
}

.message-text :deep(ul li) {
  list-style-type: disc;
}

.message-text :deep(ol li) {
  list-style-type: decimal;
}

.message-text :deep(ul ul),
.message-text :deep(ol ol) {
  margin: 4px 0;
}

/* Markdown 标题样式 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h1) { font-size: 24px; }
.message-text :deep(h2) { font-size: 20px; }
.message-text :deep(h3) { font-size: 18px; }
.message-text :deep(h4) { font-size: 16px; }
.message-text :deep(h5) { font-size: 14px; }
.message-text :deep(h6) { font-size: 13px; }

/* Markdown 表格样式 */
.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 14px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.message-text :deep(thead) {
  background: #f5f7fa;
}

.message-text :deep(th) {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e4e7ed;
  color: #303133;
}

.message-text :deep(td) {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}

.message-text :deep(tr:last-child td) {
  border-bottom: none;
}

.message-text :deep(tr:hover) {
  background: #fafafa;
}

/* Markdown 引用样式 */
.message-text :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 8px 16px;
  margin: 12px 0;
  background: #f0f9ff;
  color: #606266;
  border-radius: 0 4px 4px 0;
}

.message-text :deep(blockquote p) {
  margin: 0;
}

/* Markdown 分割线样式 */
.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 16px 0;
}

/* Markdown 链接样式 */
.message-text :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

/* Markdown 强调样式 */
.message-text :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.message-text :deep(em) {
  font-style: italic;
  color: #606266;
}

.function-call {
  margin-top: 8px;
}

.function-args {
  margin-top: 8px;
  font-size: 12px;
}

.function-args pre {
  margin: 0;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.thinking {
  opacity: 0.8;
}

.thinking-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #909399;
  border-radius: 50%;
  animation: thinking 1.4s infinite;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* ========== 输入区域 - 增强版 ========== */
.input-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  padding: 20px 28px 24px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
}

.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  background: rgba(248, 250, 252, 0.9);
  border: 2px solid rgba(102, 126, 234, 0.15);
  border-radius: 16px;
  padding: 16px 100px 16px 20px;
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  transition: all 0.3s ease;
  resize: none;
}

.message-input :deep(.el-textarea__inner:hover) {
  border-color: rgba(102, 126, 234, 0.3);
  background: #ffffff;
}

.message-input :deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 
    0 0 0 4px rgba(102, 126, 234, 0.1),
    0 8px 24px rgba(102, 126, 234, 0.12);
}

.message-input :deep(.el-textarea__inner::placeholder) {
  color: #94a3b8;
  font-weight: 500;
}

.input-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 
    0 6px 20px rgba(102, 126, 234, 0.35),
    0 2px 8px rgba(102, 126, 234, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 
    0 10px 28px rgba(102, 126, 234, 0.4),
    0 4px 12px rgba(102, 126, 234, 0.25);
}

.send-button:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 
    0 6px 20px rgba(102, 126, 234, 0.35),
    0 2px 8px rgba(102, 126, 234, 0.2);
}

.send-button:disabled {
  background: #e2e8f0;
  box-shadow: none;
}

/* ========== 输入工具栏 ========== */
.input-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  margin-bottom: 4px;
}

.device-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.device-selector > .el-icon {
  color: #667eea;
  font-size: 18px;
}

.toolbar-label {
  font-size: 14px;
  color: #475569;
  white-space: nowrap;
  font-weight: 600;
}

.device-selector :deep(.el-select .el-input__wrapper) {
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.3s ease;
}

.device-selector :deep(.el-select .el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.3);
}

.device-selector :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.device-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.device-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.device-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
}

/* ========== 知识库来源样式 - 增强版 ========== */
.knowledge-sources {
  margin-top: 14px;
}

.knowledge-source-item {
  margin-bottom: 10px;
}

.knowledge-source-item :deep(.el-alert) {
  border-radius: 14px;
  border: none;
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.15);
}

.knowledge-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.knowledge-source-details {
  margin-top: 10px;
}

.source-info {
  padding: 10px 0;
}

.source-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.source-title {
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.source-content {
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  margin: 10px 0;
  max-height: 140px;
  overflow-y: auto;
}

.source-meta {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  margin-top: 6px;
}

/* ========== 插件调用样式 - 增强版 ========== */
.plugin-calls {
  margin-top: 14px;
}

.plugin-call-item {
  margin-bottom: 10px;
}

.plugin-call-item :deep(.el-alert) {
  border-radius: 14px;
  border: none;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
}

.plugin-call-details {
  margin-top: 10px;
}

.plugin-args,
.plugin-result {
  margin-bottom: 10px;
}

.plugin-args pre {
  background: rgba(0, 0, 0, 0.03);
  padding: 12px;
  border-radius: 10px;
  font-size: 12px;
  overflow-x: auto;
  margin-top: 6px;
}

.plugin-result {
  color: #10b981;
  font-weight: 500;
}

/* ========== Token 使用量 ========== */
.token-usage {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.token-usage .el-tag {
  border-radius: 8px;
  font-weight: 500;
  padding: 6px 12px;
}

/* ========== 消息时间 ========== */
.message-time {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* ========== 思考动画 - 增强版 ========== */
.thinking {
  opacity: 0.9;
}

.thinking-dots {
  display: flex;
  gap: 6px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  border-top-left-radius: 6px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
}

.thinking-dots span {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: thinking 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 100px);
    border-radius: 16px;
  }

  .chat-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
  }

  .agent-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }

  .agent-details h3 {
    font-size: 18px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .messages-container {
    padding: 20px 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .message-text {
    padding: 14px 18px;
  }

  .input-container {
    padding: 16px 16px 20px;
  }

  .device-selector {
    flex-wrap: wrap;
  }

  .quick-questions {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .chat-header {
    padding: 14px 16px;
  }

  .agent-details h3 {
    font-size: 16px;
  }

  .header-actions .el-button span {
    display: none;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .empty-icon {
    font-size: 60px;
  }

  .empty-chat p {
    font-size: 16px;
  }
}
</style>
