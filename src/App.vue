<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { agentApi, type Agent } from './api/agent'

const agents = ref<Agent[]>([])
const loading = ref(false)
const error = ref('')
const newAgentName = ref('')
const newAgentDescription = ref('')

// 加载智能体列表
const loadAgents = async () => {
  loading.value = true
  error.value = ''
  try {
    agents.value = await agentApi.getAllAgents()
  } catch (err) {
    error.value = '加载智能体列表失败: ' + (err as Error).message
  } finally {
    loading.value = false
  }
}

// 创建智能体
const createAgent = async () => {
  if (!newAgentName.value.trim()) {
    alert('请输入智能体名称')
    return
  }
  
  try {
    const agent: Agent = {
      name: newAgentName.value,
      description: newAgentDescription.value || undefined,
      status: 'draft'
    }
    await agentApi.createAgent(agent)
    newAgentName.value = ''
    newAgentDescription.value = ''
    await loadAgents()
    alert('创建成功！')
  } catch (err) {
    alert('创建失败: ' + (err as Error).message)
  }
}

// 删除智能体
const deleteAgent = async (id: number) => {
  if (!confirm('确定要删除这个智能体吗？')) {
    return
  }
  
  try {
    await agentApi.deleteAgent(id)
    await loadAgents()
    alert('删除成功！')
  } catch (err) {
    alert('删除失败: ' + (err as Error).message)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAgents()
})
</script>

<template>
  <div class="app">
    <h1>PKU Agent 管理平台</h1>
    
    <!-- 创建智能体表单 -->
    <div class="create-form">
      <h2>创建新智能体</h2>
      <div class="form-group">
        <input 
          v-model="newAgentName" 
          type="text" 
          placeholder="智能体名称（必填）" 
          class="input"
        />
      </div>
      <div class="form-group">
        <textarea 
          v-model="newAgentDescription" 
          placeholder="描述（选填）" 
          class="textarea"
          rows="3"
        ></textarea>
      </div>
      <button @click="createAgent" class="btn btn-primary">创建智能体</button>
    </div>

    <!-- 智能体列表 -->
    <div class="agents-list">
      <h2>智能体列表</h2>
      
      <button @click="loadAgents" class="btn btn-secondary" :disabled="loading">
        {{ loading ? '加载中...' : '刷新列表' }}
      </button>
      
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="loading" class="loading">加载中...</div>
      
      <div v-else-if="agents.length === 0" class="empty">
        暂无智能体数据
      </div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>描述</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="agent in agents" :key="agent.id">
            <td>{{ agent.id }}</td>
            <td>{{ agent.name }}</td>
            <td>{{ agent.description || '-' }}</td>
            <td>
              <span :class="['status', agent.status]">
                {{ agent.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ agent.createdAt ? new Date(agent.createdAt).toLocaleString('zh-CN') : '-' }}</td>
            <td>
              <button @click="deleteAgent(agent.id!)" class="btn btn-danger btn-sm">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-bottom: 15px;
}

.create-form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.input,
.textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.textarea {
  resize: vertical;
  font-family: Arial, sans-serif;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #008CBA;
  color: white;
  margin-bottom: 15px;
}

.btn-secondary:hover {
  background-color: #007399;
}

.btn-secondary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #da190b;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.agents-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

.table tr:hover {
  background-color: #f9f9f9;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.draft {
  background-color: #ffeaa7;
  color: #d63031;
}

.status.published {
  background-color: #b8f4bd;
  color: #00b894;
}
</style>
