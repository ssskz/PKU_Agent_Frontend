<template>
  <div :class="['custom-node', type]">
    <div class="node-header">
      <el-icon class="node-icon">
        <component :is="getIcon(type)" />
      </el-icon>
      <span class="node-label">{{ data.label || getDefaultLabel(type) }}</span>
    </div>
    <Handle type="target" :position="Position.Left" v-if="type !== 'start'" />
    <Handle type="source" :position="Position.Right" v-if="type !== 'end'" />
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { 
  Position as PositionIcon, 
  CircleCheck, 
  Promotion, 
  Link,
  Search,
  ChatDotRound,
  Edit
} from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: () => ({})
  }
})

const getIcon = (type) => {
  const icons = {
    start: PositionIcon,
    end: CircleCheck,
    llm: Promotion,
    http: Link,
    knowledge: Search,
    intent: ChatDotRound,
    string: Edit
  }
  return icons[type] || PositionIcon
}

const getDefaultLabel = (type) => {
  const labels = {
    start: '开始',
    end: '结束',
    llm: 'LLM调用',
    http: 'HTTP请求',
    knowledge: '知识库检索',
    intent: '意图识别',
    string: '字符串处理'
  }
  return labels[type] || type
}
</script>

<style scoped>
.custom-node {
  min-width: 120px;
  max-width: 180px;
  padding: 10px 14px;
  border-radius: 8px;
  background: white;
  border: 2px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.custom-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.custom-node.start {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.custom-node.end {
  border-color: #909399;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.custom-node.llm {
  border-color: #409eff;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.custom-node.http {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.custom-node.knowledge {
  border-color: #9333ea;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

.custom-node.intent {
  border-color: #06b6d4;
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
}

.custom-node.string {
  border-color: #f43f5e;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  font-size: 18px;
}

.custom-node.start .node-icon {
  color: #67c23a;
}

.custom-node.end .node-icon {
  color: #909399;
}

.custom-node.llm .node-icon {
  color: #409eff;
}

.custom-node.http .node-icon {
  color: #e6a23c;
}

.custom-node.knowledge .node-icon {
  color: #9333ea;
}

.custom-node.intent .node-icon {
  color: #06b6d4;
}

.custom-node.string .node-icon {
  color: #f43f5e;
}

.node-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
</style>
