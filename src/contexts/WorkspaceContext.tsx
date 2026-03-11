import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  customerMemories,
  workspaceActivity,
  workspaceAgents,
  workspaceDecisions,
  workspaceInsights,
  workspaceOverviewKpis,
  workspaceTasks,
} from '../data/workspace';
import type {
  ActivityEvent,
  AgentInsight,
  AgentTask,
  DecisionStatus,
  InsightStatus,
  TaskStatus,
  WorkspaceDecision,
  WorkspaceAgentType,
} from '../types/workspace';

interface WorkspaceContextValue {
  agents: typeof workspaceAgents;
  kpis: typeof workspaceOverviewKpis;
  memories: typeof customerMemories;
  tasks: AgentTask[];
  insights: AgentInsight[];
  decisions: WorkspaceDecision[];
  activity: ActivityEvent[];
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  createTaskFromInsight: (insightId: string) => void;
  updateInsightStatus: (insightId: string, status: InsightStatus) => void;
  updateDecisionStatus: (decisionId: string, status: DecisionStatus) => void;
  convertDecisionToTask: (decisionId: string) => void;
  postActivity: (channel: string, action: string, actorType?: WorkspaceAgentType, relatedObject?: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<AgentTask[]>(workspaceTasks);
  const [insights, setInsights] = useState<AgentInsight[]>(workspaceInsights);
  const [decisions, setDecisions] = useState<WorkspaceDecision[]>(workspaceDecisions);
  const [activity, setActivity] = useState<ActivityEvent[]>(workspaceActivity);

  const postActivity = (
    channel: string,
    action: string,
    actorType: WorkspaceAgentType = 'system',
    relatedObject?: string
  ) => {
    const actorName =
      actorType === 'system' ? 'System' : `${actorType[0].toUpperCase()}${actorType.slice(1)} Agent`;

    setActivity((prev) => [
      {
        id: uid('act'),
        channel,
        actorType,
        actorName,
        action,
        relatedObject,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
    postActivity('#operations', `Updated task ${taskId} to ${status}`, 'system', taskId);
  };

  const createTaskFromInsight = (insightId: string) => {
    const insight = insights.find((item) => item.id === insightId);
    if (!insight) return;

    const newTask: AgentTask = {
      id: uid('tsk'),
      title: `Follow-up: ${insight.title}`,
      taskType: 'insight_followup',
      createdBy: insight.sourceAgent,
      assignedTo: insight.sourceAgent === 'marketing' ? 'sales' : 'operations',
      priority: insight.priority,
      status: 'new',
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      context: insight.description,
      relatedProduct: insight.relatedObject,
    };

    setTasks((prev) => [newTask, ...prev]);
    postActivity('#alerts', `Converted insight "${insight.title}" into task`, insight.sourceAgent, newTask.id);
  };

  const updateInsightStatus = (insightId: string, status: InsightStatus) => {
    setInsights((prev) => prev.map((insight) => (insight.id === insightId ? { ...insight, status } : insight)));
    postActivity('#marketing', `Insight ${insightId} marked as ${status}`, 'system', insightId);
  };

  const updateDecisionStatus = (decisionId: string, status: DecisionStatus) => {
    setDecisions((prev) => prev.map((decision) => (decision.id === decisionId ? { ...decision, status } : decision)));
    postActivity('#alerts', `Decision ${decisionId} ${status}`, 'system', decisionId);
  };

  const convertDecisionToTask = (decisionId: string) => {
    const decision = decisions.find((item) => item.id === decisionId);
    if (!decision) return;

    const newTask: AgentTask = {
      id: uid('tsk'),
      title: decision.title,
      taskType: 'decision_execution',
      createdBy: decision.ownerAgent,
      assignedTo: decision.ownerAgent,
      priority: decision.impact === 'high' ? 'urgent' : decision.impact === 'medium' ? 'high' : 'medium',
      status: 'new',
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      context: decision.explanation,
      relatedProduct: decision.relatedObject,
    };

    setTasks((prev) => [newTask, ...prev]);
    setDecisions((prev) =>
      prev.map((item) => (item.id === decisionId ? { ...item, status: 'approved' } : item))
    );
    postActivity('#alerts', `Decision converted to task: ${decision.title}`, decision.ownerAgent, newTask.id);
  };

  const value = useMemo(
    () => ({
      agents: workspaceAgents,
      kpis: workspaceOverviewKpis,
      memories: customerMemories,
      tasks,
      insights,
      decisions,
      activity,
      updateTaskStatus,
      createTaskFromInsight,
      updateInsightStatus,
      updateDecisionStatus,
      convertDecisionToTask,
      postActivity,
    }),
    [activity, decisions, insights, tasks]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
