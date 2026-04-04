export type WorkspaceAgentType = 'sales' | 'marketing' | 'operations' | 'human' | 'system';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'new' | 'reviewing' | 'in_progress' | 'blocked' | 'resolved' | 'cancelled';
export type InsightStatus = 'new' | 'reviewed' | 'dismissed';
export type DecisionStatus = 'pending' | 'approved' | 'dismissed';
export type CustomerStage = 'awareness' | 'interest' | 'consideration' | 'decision' | 'customer';
export type PreferredChannel = 'whatsapp' | 'instagram' | 'web' | 'messenger';

export interface AgentProfile {
  id: string;
  name: string;
  type: WorkspaceAgentType;
  persona: string;
  responsibilities: string[];
  tools: string[];
  permissions: string[];
  activeTasks: number;
  kpiLabel: string;
  kpiValue: string;
}

export interface WorkspaceKpi {
  label: string;
  value: string;
  delta: string;
}

export interface CustomerMemory {
  id: string;
  customerName: string;
  companyName?: string;
  stage: CustomerStage;
  preferredChannel: PreferredChannel;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  interests: string[];
  objections: string[];
  nextBestAction: string;
  lastInteraction: string;
  closingProbability: number;
  valueTier: 'low' | 'medium' | 'high' | 'strategic';
  timeline: Array<{ id: string; at: string; event: string }>;
  opportunityStatus: string;
  relatedTaskIds: string[];
  relatedInsightIds: string[];
}

export interface AgentTask {
  id: string;
  title: string;
  taskType: string;
  createdBy: WorkspaceAgentType;
  assignedTo: WorkspaceAgentType;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string;
  createdAt: string;
  relatedCustomerId?: string;
  relatedProduct?: string;
  context: string;
}

export interface AgentInsight {
  id: string;
  sourceAgent: WorkspaceAgentType;
  category: 'trend' | 'risk' | 'opportunity' | 'performance';
  title: string;
  description: string;
  confidence: number;
  priority: TaskPriority;
  status: InsightStatus;
  timestamp: string;
  relatedObject?: string;
}

export interface WorkspaceDecision {
  id: string;
  title: string;
  explanation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  status: DecisionStatus;
  ownerAgent: Exclude<WorkspaceAgentType, 'human' | 'system'>;
  createdAt: string;
  relatedObject?: string;
}

export interface ActivityEvent {
  id: string;
  channel: string;
  actorType: WorkspaceAgentType;
  actorName: string;
  action: string;
  relatedObject?: string;
  timestamp: string;
}
