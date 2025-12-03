// Agent API 服务
export interface Agent {
  id?: number;
  name: string;
  description?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  modelConfig?: Record<string, any>;
  workflowId?: number;
  knowledgeBaseIds?: number[];
  pluginIds?: number[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = 'http://localhost:8080/api';

export const agentApi = {
  // 获取所有智能体
  async getAllAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    return response.json();
  },

  // 根据ID获取智能体
  async getAgentById(id: number): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch agent');
    }
    return response.json();
  },

  // 根据状态查询智能体
  async getAgentsByStatus(status: string): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/agents/status/${status}`);
    if (!response.ok) {
      throw new Error('Failed to fetch agents by status');
    }
    return response.json();
  },

  // 根据名称搜索智能体
  async searchAgentsByName(name: string): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/agents/search?name=${encodeURIComponent(name)}`);
    if (!response.ok) {
      throw new Error('Failed to search agents');
    }
    return response.json();
  },

  // 创建智能体
  async createAgent(agent: Agent): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agent),
    });
    if (!response.ok) {
      throw new Error('Failed to create agent');
    }
    return response.json();
  },

  // 更新智能体
  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agent),
    });
    if (!response.ok) {
      throw new Error('Failed to update agent');
    }
    return response.json();
  },

  // 删除智能体
  async deleteAgent(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete agent');
    }
  },

  // 检查智能体是否存在
  async checkAgentExists(id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
      method: 'HEAD',
    });
    return response.ok;
  },
};
