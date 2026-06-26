export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface ScheduleItem {
  id: string;
  time: string; // e.g. "09:00 AM" or "19:00"
  taskName: string;
  durationMinutes: number;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskCategory = 'work' | 'study' | 'fitness' | 'sleep' | 'family' | 'entertainment';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  estimatedHours: number;
  riskScore: number; // 0 to 100
  riskReason: string;
  subtasks: Subtask[];
  schedule: ScheduleItem[];
  referenceMaterials?: string[];
  suggestedExtensionEmail?: string;
  isEmergencyMode?: boolean;
}

export interface FocusSession {
  isActive: boolean;
  durationMinutes: number;
  timeRemaining: number; // in seconds
  mode: 'pomodoro' | 'short_break' | 'long_break';
  ambientSound: 'none' | 'rain' | 'waves' | 'white_noise' | 'lofi';
  distractionsCount: number;
  typingSpeed: number; // WPM
  activityLevel: 'idle' | 'low' | 'active' | 'high';
}

export interface Suggestion {
  id: string;
  title: string;
  type: 'warning' | 'rescue' | 'habit' | 'optimizer';
  content: string;
  actionLabel?: string;
  associatedTaskId?: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'processing' | 'active' | 'success' | 'alert';
  message: string;
}

export interface ProductivityStats {
  score: number;
  focusMinutes: number;
  distractions: number;
  completedCount: number;
  totalCount: number;
  completionRate: number;
  riskTrend: number[]; // past 7 days
  focusTimeline: { time: string; level: number }[]; // hourly focus level
}

export interface SimulationResult {
  accepted: boolean;
  impactMessage: string;
  sleepImpact: number; // hours reduced
  missedTasks: string[];
  newRiskScore: number;
  dailyRiskTrend: { day: string; risk: number }[];
}
