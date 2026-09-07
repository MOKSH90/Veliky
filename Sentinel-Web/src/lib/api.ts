import { activity, fileTree, memories, workspaces } from '../mock/data'

// Frontend contract layer. Replace these functions with real API calls later.
export const sentinelApi = {
  async getWorkspaces() { return workspaces },
  async getFiles() { return fileTree },
  async getMemory() { return memories },
  async getActivity() { return activity },
  async submitGoal(goal: string) { return { id: crypto.randomUUID(), goal, accepted: true } },
  async approveAction() { return { approved: true } },
  async rejectAction() { return { approved: false } },
}
export const edithApi = sentinelApi
