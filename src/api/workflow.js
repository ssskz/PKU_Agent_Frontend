/**
 * 工作流 API
 */
import request from './request'

/**
 * 创建工作流
 */
export function createWorkflow(data) {
  return request({
    url: '/workflows',
    method: 'post',
    data
  })
}

/**
 * 获取工作流列表
 */
export function getWorkflows(params) {
  return request({
    url: '/workflows',
    method: 'get',
    params
  })
}

/**
 * 获取工作流详情
 */
export function getWorkflow(uuid) {
  return request({
    url: `/workflows/${uuid}`,
    method: 'get'
  })
}

/**
 * 更新工作流
 */
export function updateWorkflow(uuid, data) {
  return request({
    url: `/workflows/${uuid}`,
    method: 'put',
    data
  })
}

/**
 * 删除工作流
 */
export function deleteWorkflow(uuid) {
  return request({
    url: `/workflows/${uuid}`,
    method: 'delete'
  })
}

/**
 * 验证工作流
 */
export function validateWorkflow(uuid) {
  return request({
    url: `/workflows/${uuid}/validate`,
    method: 'post'
  })
}

/**
 * 执行工作流
 */
export function executeWorkflow(uuid, data) {
  return request({
    url: `/workflows/${uuid}/execute`,
    method: 'post',
    data
  })
}

/**
 * 获取工作流执行历史
 */
export function getWorkflowExecutions(uuid, params) {
  return request({
    url: `/workflows/${uuid}/executions`,
    method: 'get',
    params
  })
}

/**
 * 获取执行详情
 */
export function getExecution(uuid) {
  return request({
    url: `/workflows/executions/${uuid}`,
    method: 'get'
  })
}

/**
 * 获取执行日志
 */
export function getExecutionLogs(uuid) {
  return request({
    url: `/workflows/executions/${uuid}/logs`,
    method: 'get'
  })
}

/**
 * 获取工作流统计信息
 */
export function getWorkflowStatistics() {
  return request({
    url: '/workflows/statistics/overview',
    method: 'get'
  })
}
