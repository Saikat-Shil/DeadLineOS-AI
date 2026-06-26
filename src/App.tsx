import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, CheckSquare, Square, Zap, Calendar, 
  Sparkles, Sliders, Mail, Send, Activity, Info, 
  MessageSquare, RefreshCw, AlertTriangle, ShieldAlert, Heart, Eye, ArrowRight, Copy, Check,
  Moon, Coffee, Flame, ShieldCheck, Compass, Battery, Play, HelpCircle
} from 'lucide-react';
import { Task, Subtask, ScheduleItem, SimulationResult, Suggestion, AgentInfo } from './types';
import RiskMeter from './components/RiskMeter';
import FocusCoach from './components/FocusCoach';
import DateTimePicker from './components/DateTimePicker';

// Curated default tasks so the cockpit has active data on startup
const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Machine Learning Assignment - Neural Networks",
    description: "Build a convolutional neural network from scratch, document hyperparameter selection, and write a performance report.",
    deadline: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
    priority: "critical",
    status: "in_progress",
    category: "study",
    estimatedHours: 5.5,
    riskScore: 92,
    riskReason: "Calendar is full tonight. Historically starts coding assignments 4 hours past peak energy window.",
    isEmergencyMode: true,
    subtasks: [
      { id: "sub-1-1", title: "Formulate layers architecture and weight initializers", completed: true, estimatedMinutes: 45 },
      { id: "sub-1-2", title: "Write forward and backward propagation routines", completed: false, estimatedMinutes: 90 },
      { id: "sub-1-3", title: "Train model on dataset and plot learning curves", completed: false, estimatedMinutes: 120 },
      { id: "sub-1-4", title: "Complete document report and upload model weights", completed: false, estimatedMinutes: 60 }
    ],
    schedule: [
      { id: "sch-1-1", time: "03:00 PM", taskName: "Research Phase: Study Gemini-extracted notes", durationMinutes: 60, completed: true },
      { id: "sch-1-2", time: "05:00 PM", taskName: "Core Implementation: GitHub Copilot integrated block", durationMinutes: 120, completed: false },
      { id: "sch-1-3", time: "08:30 PM", taskName: "Testing Phase: Plot training losses", durationMinutes: 45, completed: false }
    ],
    referenceMaterials: [
      "PyTorch Backpropagation Internals Guide",
      "Fast Gradient Descent Optimization Methods",
      "How to avoid vanishing gradients in deep CNN architectures"
    ],
    suggestedExtensionEmail: "Subject: Project Adjustments: Machine Learning Assignment\n\nHi Professor,\n\nI am currently running final test runs for the Neural Network script. To ensure code quality and write comprehensive reports, I'd appreciate submitting tomorrow morning. Thank you!\n\nBest regards,\n[Your Name]"
  },
  {
    id: "task-2",
    title: "Portfolio Design Case Study",
    description: "Write and format the case study for the autonomous smart grid designer project.",
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days
    priority: "high",
    status: "todo",
    category: "work",
    estimatedHours: 4.0,
    riskScore: 45,
    riskReason: "Moderate workload conflict with team brainstorming sessions scheduled tomorrow afternoon.",
    isEmergencyMode: false,
    subtasks: [
      { id: "sub-2-1", title: "Outline user journeys and wireframes", completed: false, estimatedMinutes: 60 },
      { id: "sub-2-2", title: "Render high-fidelity dashboard assets", completed: false, estimatedMinutes: 90 },
      { id: "sub-2-3", title: "Draft descriptive write-up", completed: false, estimatedMinutes: 120 }
    ],
    schedule: [
      { id: "sch-2-1", time: "10:00 AM", taskName: "Visual design curation", durationMinutes: 90, completed: false }
    ]
  },
  {
    id: "task-3",
    title: "Sub-3 Hour Marathon Run Block",
    description: "Interval training run. Target pacing: 4:10/km for 12 kilometers.",
    deadline: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(), // 5 days
    priority: "medium",
    status: "todo",
    category: "fitness",
    estimatedHours: 1.5,
    riskScore: 18,
    riskReason: "Low risk. Weather reports look ideal for high performance.",
    isEmergencyMode: false,
    subtasks: [
      { id: "sub-3-1", title: "Warm up with dynamic stretches", completed: false, estimatedMinutes: 15 },
      { id: "sub-3-2", title: "12km interval block", completed: false, estimatedMinutes: 50 },
      { id: "sub-3-3", title: "Cool down and hydration index log", completed: false, estimatedMinutes: 15 }
    ],
    schedule: [
      { id: "sch-3-1", time: "07:00 AM", taskName: "Pacing intervals", durationMinutes: 80, completed: false }
    ]
  }
];

function formatCountdown(deadlineIso: string): string {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return "0s remaining";
  
  const totalSecs = Math.floor(diffMs / 1000);
  const secs = totalSecs % 60;
  const totalMins = Math.floor(totalSecs / 60);
  const mins = totalMins % 60;
  const totalHours = Math.floor(totalMins / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (mins > 0 || hours > 0 || days > 0) {
    parts.push(`${mins}m`);
  }
  parts.push(`${secs}s`);
  
  return parts.join(" ") + " remaining";
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("task-1");
  const [activeTab, setActiveTab] = useState<'focus' | 'timetravel' | 'negotiator' | 'balance' | 'assistant'>('assistant');
  
  // App Stats
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  
  // New Task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'study' | 'fitness' | 'sleep' | 'family' | 'entertainment'>('work');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Time Travel simulation state
  const [simTitle, setSimTitle] = useState("30-Day Dev Freelance Contract");
  const [simDays, setSimDays] = useState(10);
  const [simHours, setSimHours] = useState(15);
  const [simCategory, setSimCategory] = useState<'work' | 'study' | 'fitness' | 'sleep' | 'family' | 'entertainment'>('work');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedSimDay, setSelectedSimDay] = useState<number | null>(null);
  const [simLoadingStep, setSimLoadingStep] = useState(0);

  // Time Travel simulation loader effects
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSimulating) {
      setSimLoadingStep(0);
      interval = setInterval(() => {
        setSimLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 750);
    } else {
      setSimLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  // Negotiator state
  const [negotiatorReason, setNegotiatorReason] = useState("Complex performance bugs in backpropagation logic");
  const [negotiatorAudience, setNegotiatorAudience] = useState("Professor / Review Board");
  const [negotiatedDraft, setNegotiatedDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);

  // Chat/Assistant state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "SYSTEM LOG: Autonomous Executive Assistant online. **Neural Network Assignment** is under heavy threat (92% Risk). I've pre-partitioned 4 subtasks, postponed secondary gym schedules, and prepared learning notes. Shall we activate **Emergency Rescue Mode**?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Multi-Agent simulation messages
  const [agents, setAgents] = useState<AgentInfo[]>([
    { id: "planner", name: "Planner Agent", role: "Goal Decomposition", status: "processing", message: "Partitioning Task: ML Assignment" },
    { id: "prioritizer", name: "Prioritizer Agent", role: "Threat Sorter", status: "active", message: "Rerouting study blocks to top" },
    { id: "optimizer", name: "Optimizer Agent", role: "Calendar Rescheduling", status: "alert", message: "Gym slot postponed (6 PM to Friday)" },
    { id: "motivation", name: "Motivation Agent", role: "Nudge Specialist", status: "idle", message: "Monitoring keyboard intervals" },
    { id: "rescue", name: "Rescue Agent", role: "Emergency Overdrive", status: "alert", message: "Emergency mode engaged" }
  ]);

  // Balance values
  const [lifeBalance, setLifeBalance] = useState({
    work: 75,
    study: 85,
    fitness: 30,
    sleep: 40,
    family: 50,
    entertainment: 20
  });

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Soft agent message changes to simulate "live running code" without distractions
  useEffect(() => {
    const agentTimer = setInterval(() => {
      setAgents(prev => prev.map(a => {
        if (Math.random() > 0.7) {
          const statuses: ('idle' | 'processing' | 'active' | 'success' | 'alert')[] = ['idle', 'processing', 'active', 'success'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          let newMsg = a.message;
          if (a.id === 'planner') {
            newMsg = newStatus === 'processing' ? "Synthesizing schedule limits..." : "Task structures locked.";
          } else if (a.id === 'prioritizer') {
            newMsg = newStatus === 'active' ? "Scanning incoming deadline triggers..." : "Awaiting workload updates.";
          } else if (a.id === 'optimizer') {
            newMsg = newStatus === 'success' ? "All synced with G-Cal & Slack" : "Scanning traffic congestion indexes";
          } else if (a.id === 'motivation') {
            newMsg = distractionCount > 4 ? "Nudge: Focus threshold exceeded." : "Flow state looks sustainable.";
          }
          return { ...a, status: newStatus, message: newMsg };
        }
        return a;
      }));
    }, 8000);
    return () => clearInterval(agentTimer);
  }, [distractionCount]);

  // Update life balance automatically based on task progress
  useEffect(() => {
    const baseBalance = {
      work: 60,
      study: 50,
      fitness: 60,
      sleep: 80,
      family: 70,
      entertainment: 50
    };

    const newBalance = { ...baseBalance };
    const categories: Array<'work' | 'study' | 'fitness' | 'sleep' | 'family' | 'entertainment'> = [
      'work', 'study', 'fitness', 'sleep', 'family', 'entertainment'
    ];

    categories.forEach(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      if (catTasks.length > 0) {
        let totalProgressSum = 0;
        catTasks.forEach(task => {
          if (task.status === 'completed') {
            totalProgressSum += 1.0;
          } else {
            const totalItems = task.subtasks.length + task.schedule.length;
            if (totalItems > 0) {
              const completedItems = 
                task.subtasks.filter(s => s.completed).length + 
                task.schedule.filter(s => s.completed).length;
              totalProgressSum += completedItems / totalItems;
            } else {
              totalProgressSum += task.status === 'in_progress' ? 0.3 : 0.1;
            }
          }
        });
        const avgProgress = totalProgressSum / catTasks.length;

        // Balance can range from 30% to 100% depending on mission progress
        const minVal = 30;
        const maxVal = 100;
        newBalance[cat] = Math.round(minVal + (maxVal - minVal) * avgProgress);
      } else {
        newBalance[cat] = baseBalance[cat];
      }
    });

    setLifeBalance(newBalance);
  }, [tasks]);

  const activeTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  const selectTabAndScroll = (tabName: 'focus' | 'timetravel' | 'negotiator' | 'balance' | 'assistant') => {
    setActiveTab(tabName);
    setTimeout(() => {
      const el = document.getElementById('advanced-tabs');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Call task analysis API
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          deadline: newDeadline,
          priority: newPriority,
          category: newCategory,
          currentWorkloadCount: tasks.length
        })
      });
      const data = await res.json();
      
      const parsedSubtasks: Subtask[] = data.subtasks.map((st: any, i: number) => ({
        id: `sub-${Date.now()}-${i}`,
        title: st.title,
        completed: false,
        estimatedMinutes: st.estimatedMinutes || 45
      }));

      const parsedSchedule: ScheduleItem[] = data.schedule.map((sch: any, i: number) => ({
        id: `sch-${Date.now()}-${i}`,
        time: sch.time,
        taskName: sch.taskName,
        durationMinutes: sch.durationMinutes || 60,
        completed: false
      }));

      const createdTask: Task = {
        id: `task-${Date.now()}`,
        title: newTitle,
        description: newDesc,
        deadline: newDeadline,
        priority: newPriority,
        status: 'todo',
        category: newCategory,
        estimatedHours: data.estimatedHours || 4.0,
        riskScore: data.riskScore || 50,
        riskReason: data.riskReason || "Predicted schedule overload based on upcoming events.",
        subtasks: parsedSubtasks,
        schedule: parsedSchedule,
        referenceMaterials: data.referenceMaterials || [],
        suggestedExtensionEmail: data.suggestedExtensionEmail || "",
        isEmergencyMode: data.riskScore >= 75
      };

      setTasks([createdTask, ...tasks]);
      setSelectedTaskId(createdTask.id);
      
      // Update system response in assistant
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: `Added task: ${newTitle}` },
        { role: 'assistant', content: `🚨 **Task Analyzed**: Estimated ${createdTask.estimatedHours}h of effort required. Completion Risk is **${createdTask.riskScore}%** due to: "${createdTask.riskReason}". I've blocked out recommended time slots in your Adaptive Schedule.` }
      ]);

      // Reset
      setNewTitle("");
      setNewDesc("");
      setNewDeadline("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    if (selectedTaskId === taskId && updated.length > 0) {
      setSelectedTaskId(updated[0].id);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        // If all subtasks are completed, mark task as completed. Otherwise, if it was completed, mark it in_progress.
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
        const nextStatus = allCompleted ? 'completed' as const : (t.status === 'completed' ? 'in_progress' as const : t.status);
        return { ...t, subtasks: updatedSubtasks, status: nextStatus };
      }
      return t;
    }));
  };

  const toggleScheduleItem = (taskId: string, schId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSch = t.schedule.map(si => 
          si.id === schId ? { ...si, completed: !si.completed } : si
        );
        // If all subtasks and schedule items are completed, mark task as completed
        const allSubCompleted = t.subtasks.every(st => st.completed);
        const allSchCompleted = updatedSch.every(si => si.completed);
        const allCompleted = allSubCompleted && allSchCompleted;
        const nextStatus = allCompleted ? 'completed' as const : (t.status === 'completed' ? 'in_progress' as const : t.status);
        return { ...t, schedule: updatedSch, status: nextStatus };
      }
      return t;
    }));
  };

  const toggleTaskCompleted = (taskId: string) => {
    let wasCompleted = false;
    let title = "";
    
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      wasCompleted = task.status === 'completed';
      title = task.title;
      const nextStatus = wasCompleted ? 'in_progress' as const : 'completed' as const;
      
      return prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: nextStatus,
            subtasks: t.subtasks.map(st => ({ ...st, completed: nextStatus === 'completed' })),
            schedule: t.schedule.map(si => ({ ...si, completed: nextStatus === 'completed' }))
          };
        }
        return t;
      });
    });

    if (!wasCompleted) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `🎉 **Mission Accomplished**: Directives for **${title || "Mission"}** have been fully executed! Dynamic well-being ranges recalculated and stress indexes have dropped.` }
      ]);
    }
  };

  const handleForceRescue = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          isEmergencyMode: true, 
          riskScore: Math.min(98, t.riskScore + 15),
          riskReason: "🚨 Rescue Protocols Triggered. Extraneous routines purged; focus engine locked to 25m cycles."
        };
      }
      return t;
    }));
    
    setChatMessages(prev => [
      ...prev,
      { role: 'assistant', content: "⚠️ **RESCUE SYSTEM ENGAGED**: Disabling low-priority notifications. Focus loops adjusted to 15-minute check-ins. Ref reference index loaded above. Let's finish section 1!" }
    ]);
  };

  const handleAssistantSend = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: msg }],
          currentTasks: tasks
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTimeTravelSimulation = async () => {
    setIsSimulating(true);
    setSelectedSimDay(null);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTasks: tasks,
          newTask: {
            title: simTitle,
            estimatedHours: simHours,
            category: simCategory,
            durationDays: simDays,
            deadline: new Date(Date.now() + simDays * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      });
      const data = await res.json();
      setSimResult(data);
      setSelectedSimDay(2); // select third day (Day 10 - middle peak) by default
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleNegotiateDraft = async () => {
    setIsNegotiating(true);
    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: activeTask.title,
          reasonForDelay: negotiatorReason,
          audience: negotiatorAudience
        })
      });
      const data = await res.json();
      setNegotiatedDraft({ subject: data.subject, body: data.body });
    } catch (err) {
      console.error(err);
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleCopyEmail = () => {
    if (!negotiatedDraft) return;
    const fullText = `${negotiatedDraft.subject}\n\n${negotiatedDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
  };

  // Focus completion handler
  const handleFocusCompleted = (minutes: number) => {
    setChatMessages(prev => [
      ...prev,
      { role: 'assistant', content: `🎉 **Session Logged**: You successfully smashed a **${minutes}-minute focus sprint**! Focus Index boosted. Keeping momentum active.` }
    ]);
  };

  const handleDistractionDetected = () => {
    setDistractionCount(prev => prev + 1);
  };

  // Productivity Scorecard Calculation
  const totalSubtasks = tasks.reduce((acc, t) => acc + t.subtasks.length, 0);
  const completedSubtasks = tasks.reduce((acc, t) => acc + t.subtasks.filter(st => st.completed).length, 0);
  const productivityIndex = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 80;

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] font-sans min-h-screen flex flex-col p-6 border-[12px] border-[#1A1A1A]" id="deadline-os-root">
      
      {/* 1. Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-[#1A1A1A] pb-6 gap-4">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            DeadlineOS<span className="text-[#FF3B30]">.AI</span>
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase opacity-50 font-bold mt-2">
            Autonomous Productivity Operating System v4.0
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[32px] font-mono font-light leading-none text-[#F5F5F5]">
              {currentTime || "14:22:05"}
            </div>
            <div className="text-[10px] uppercase tracking-widest opacity-40">Mission Elapsed Time</div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF3B30] text-white hover:bg-red-600 transition-all font-mono text-xs uppercase tracking-wider font-black shadow-[0_4px_12px_rgba(255,59,48,0.3)]"
            id="add-mission-btn"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add New Mission
          </button>
        </div>
      </header>

      {/* Main OS Control Panel */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR BLOCK (col-span-4) - Intelligence Engine, Agent status, Core Metrics */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active Missions List & Selector */}
          <div className="bg-[#141414] border border-white/5 p-6 rounded-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Missions Vault</h2>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">
                {tasks.length} active
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((t) => {
                const isSelected = t.id === selectedTaskId;
                const hoursRemaining = Math.max(0, Math.round((new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60)));
                const emergencyState = t.isEmergencyMode || hoursRemaining < 24;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-3.5 rounded border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-white text-black border-white' 
                        : 'bg-[#0F0F0F] hover:bg-[#1A1A1A] border-white/5'
                    }`}
                    id={`mission-card-${t.id}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className={`text-xs font-black uppercase tracking-tight flex items-center gap-1 ${
                        isSelected ? 'text-black' : 'text-slate-100'
                      } ${t.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                        {t.status === 'completed' && <Check className="h-3.5 w-3.5 text-[#00FF66] shrink-0" />}
                        {t.title}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id); }}
                        className={`hover:text-red-500 opacity-60 hover:opacity-100 p-0.5`}
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                        t.priority === 'critical' ? 'bg-[#FF3B30]/15 text-[#FF3B30]' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`${
                        t.status === 'completed'
                          ? 'text-[#00FF66] font-bold'
                          : emergencyState 
                          ? 'text-[#FF3B30] font-bold' 
                          : isSelected 
                          ? 'text-slate-600' 
                          : 'text-slate-400'
                      }`}>
                        {t.status === 'completed' ? "SUCCESS" : formatCountdown(t.deadline)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Deadline Intelligence Risk Meter for selected task */}
          {activeTask && (
            <RiskMeter 
              task={activeTask} 
              onActivateRescue={handleForceRescue} 
            />
          )}

          {/* Multi-Agent Console Terminal */}
          <div className="bg-[#141414] border border-white/5 p-6 rounded-lg">
            <h2 className="text-[10px] uppercase tracking-widest opacity-50 mb-4 font-bold">Active Multi-Agents Console</h2>
            <ul className="space-y-3.5">
              {agents.map((agent) => (
                <li key={agent.id} className="flex items-center gap-3 bg-[#0F0F0F] p-2.5 rounded border border-white/5">
                  <div className={`w-2 h-2 rounded-full relative shrink-0 ${
                    agent.status === 'alert' 
                      ? 'bg-[#FF3B30] shadow-[0_0_8px_#FF3B30]' 
                      : agent.status === 'processing' 
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse'
                      : 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-extrabold uppercase tracking-tight text-white">{agent.name}</p>
                      <span className="text-[9px] font-mono opacity-40">{agent.role}</span>
                    </div>
                    <p className="text-[10px] opacity-60 truncate font-mono mt-0.5 text-[#00FF66]">{agent.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </section>

        {/* CENTER / RIGHT CANVAS BLOCK (col-span-8) */}
        <section className="lg:col-span-8 flex flex-col gap-6">

          {/* Add Task Overlay Form (conditional) */}
          {showAddForm && (
            <div className="bg-[#141414] border-2 border-[#FF3B30] p-6 rounded-lg animate-fade-in" id="add-mission-form">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create New Mission Directive</h3>
                <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-white">✕ Cancel</button>
              </div>

              <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">Mission Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Finish Machine Learning Assignment"
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-[#FF3B30]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide context or instructions..."
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-xs text-white h-16 focus:outline-none focus:border-[#FF3B30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">Deadline Time / Date</label>
                  <DateTimePicker
                    value={newDeadline}
                    onChange={setNewDeadline}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-[#FF3B30]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical (Rescue Needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-1">Core Balance Area</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-[#FF3B30]"
                  >
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="fitness">Fitness</option>
                    <option value="sleep">Sleep / Rest</option>
                    <option value="family">Family & Social</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 text-white py-2 px-4 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all"
                  >
                    {isAnalyzing ? "AI Predictive Modeling..." : "Initiate Mission Planning"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Artistic Flair Hero Panel (The "OS Command" Hero Box) */}
          <div className="bg-white text-black p-8 relative overflow-hidden rounded-lg">
            <div className="absolute top-[-20px] right-[-20px] text-[120px] font-black opacity-[0.03] select-none pointer-events-none">
              MISSION
            </div>

            {activeTask ? (
              <>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="text-[10px] font-mono tracking-widest bg-black/10 text-black px-2.5 py-1 uppercase font-bold border border-black/20 rounded-sm">
                    {activeTask.status === 'completed' ? "DIRECTIVE ACCOMPLISHED" : activeTask.isEmergencyMode ? "EMERGENCY PROTOCOL ACTIVE" : "STABLE EXECUTION"}
                  </span>
                  <button
                    onClick={() => toggleTaskCompleted(activeTask.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono uppercase font-black tracking-wider transition-all border ${
                      activeTask.status === 'completed'
                        ? 'bg-black text-white hover:bg-slate-900 border-black'
                        : 'bg-black/5 hover:bg-black/10 text-black border-black/20'
                    }`}
                  >
                    {activeTask.status === 'completed' ? (
                      <>
                        <RefreshCw className="h-3 w-3" /> Re-open Directive
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-3 w-3" /> Complete Mission
                      </>
                    )}
                  </button>
                </div>
                <h2 className="text-4xl font-serif italic mb-4 leading-tight">
                  "{activeTask.status === 'completed'
                    ? "Mission complete. Dynamic balance restored. System monitoring secondary timelines."
                    : activeTask.isEmergencyMode 
                    ? "You're behind schedule. I've taken control." 
                    : "Timeline is stable. Maintain target execution pace."}"
                </h2>
                <p className="text-lg leading-snug max-w-2xl text-slate-800">
                  {activeTask.status === 'completed' ? (
                    <>
                      Fantastic execution on <span className="underline decoration-2 decoration-[#00FF66] font-bold">{activeTask.title}</span>. All partitioned milestones, calendar slots, and sub-goals have been successfully checked off.
                    </>
                  ) : (
                    <>
                      I've partitioned <span className="underline decoration-2 decoration-[#FF3B30] font-bold">{activeTask.title}</span> into {activeTask.subtasks.length} subtasks, blocked optimized calendar hours, and prepared core contextual references.
                    </>
                  )}
                </p>
                <div className="mt-8 flex gap-4 flex-wrap">
                  {activeTask.status !== 'completed' && (
                    <>
                      {!activeTask.isEmergencyMode ? (
                        <button 
                          onClick={() => handleForceRescue(activeTask.id)}
                          className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95"
                        >
                          Trigger Rescue Protocol
                        </button>
                      ) : (
                        <button 
                          onClick={() => selectTabAndScroll('focus')}
                          className="bg-[#FF3B30] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_4px_12px_rgba(255,59,48,0.3)]"
                        >
                          Enter Focus Engine
                        </button>
                      )}
                    </>
                  )}
                  <button 
                    onClick={() => selectTabAndScroll('timetravel')}
                    className="border border-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Simulate Calendar Overloads
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6">
                <h2 className="text-4xl font-serif italic mb-4">No active missions loaded.</h2>
                <p className="text-lg opacity-80">Add a new mission directive above to launch the DeadlineOS Autonomous planning core.</p>
              </div>
            )}
          </div>

          {/* Adaptive Planner Columns: Checklist & Adaptive Time-blocking Schedule */}
          {activeTask && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Task Breakdown (Planner Agent output) */}
              <div className="bg-[#141414] p-6 border-t border-white/10 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Planner AI Task Partition</h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeTask.subtasks.filter(st => st.completed).length}/{activeTask.subtasks.length} Completed
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeTask.subtasks.map((st) => (
                      <div 
                        key={st.id} 
                        onClick={() => toggleSubtask(activeTask.id, st.id)}
                        className="flex items-start gap-3 p-2 bg-[#0F0F0F] rounded border border-white/5 cursor-pointer hover:border-white/10 transition-all"
                      >
                        <button className="text-slate-400 shrink-0 mt-0.5">
                          {st.completed ? (
                            <CheckSquare className="h-4 w-4 text-[#00FF66]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-xs ${st.completed ? 'line-through opacity-40 text-slate-400' : 'text-slate-200'}`}>
                            {st.title}
                          </p>
                          {st.estimatedMinutes && (
                            <span className="text-[9px] font-mono opacity-40">Est: {st.estimatedMinutes} mins</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* References Drawer */}
                {activeTask.referenceMaterials && activeTask.referenceMaterials.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <h4 className="text-[9px] uppercase tracking-wider opacity-40 mb-2 font-mono">Reference Material Finder (Research Agent)</h4>
                    <ul className="space-y-1">
                      {activeTask.referenceMaterials.map((ref, idx) => (
                        <li key={idx} className="text-[10px] text-indigo-300 hover:underline cursor-pointer flex items-center gap-1">
                          <span className="text-[#FF3B30] font-mono">▸</span> {ref}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Adaptive Calendar Schedule (Schedule Optimizer) */}
              <div className="bg-[#141414] p-6 border-t border-white/10 rounded-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest opacity-50 mb-4 font-bold">Adaptive Schedule Optimizer</h3>
                  <div className="space-y-3.5">
                    {activeTask.schedule && activeTask.schedule.length > 0 ? (
                      activeTask.schedule.map((sch) => (
                        <div 
                          key={sch.id}
                          onClick={() => toggleScheduleItem(activeTask.id, sch.id)}
                          className="flex gap-4 items-start p-2 hover:bg-[#0F0F0F] rounded cursor-pointer transition-all"
                        >
                          <span className="text-[10px] font-mono opacity-50 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{sch.time}</span>
                          <div className={`border-l pl-4 flex-1 ${sch.completed ? 'border-dashed border-slate-700 opacity-40' : 'border-[#FF3B30]'}`}>
                            <p className={`text-xs font-bold uppercase ${sch.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {sch.taskName}
                            </p>
                            <p className="text-[9px] opacity-40 font-mono">{sch.durationMinutes} minutes blocked</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No schedule slots blocked. AI recommends blocking slots under emergency mode.</p>
                    )}
                  </div>
                </div>

                {/* Performance stats bar */}
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center mb-1 text-[10px] uppercase opacity-40">
                    <span>Overall Productivity Index</span>
                    <span>{productivityIndex}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 overflow-hidden rounded">
                    <div className="h-full bg-[#00FF66]" style={{ width: `${productivityIndex}%` }} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ADVANCED MODULE SECTION TABS */}
          <div id="advanced-tabs" className="border border-white/5 bg-[#141414] rounded-lg overflow-hidden flex flex-col">
            <div className="flex border-b border-white/5 overflow-x-auto text-sm uppercase tracking-wider font-mono">
              <button
                onClick={() => setActiveTab('assistant')}
                className={`px-5 py-3.5 border-r border-white/5 flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'assistant' ? 'bg-[#0A0A0A] text-[#FF3B30] font-black border-t-2 border-t-[#FF3B30]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Voice & Executive AI Chat
              </button>
              <button
                onClick={() => setActiveTab('focus')}
                className={`px-5 py-3.5 border-r border-white/5 flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'focus' ? 'bg-[#0A0A0A] text-[#FF3B30] font-black border-t-2 border-t-[#FF3B30]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> AI Focus Coach
              </button>
              <button
                onClick={() => setActiveTab('timetravel')}
                className={`px-5 py-3.5 border-r border-white/5 flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'timetravel' ? 'bg-[#0A0A0A] text-[#FF3B30] font-black border-t-2 border-t-[#FF3B30]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5 animate-pulse" /> Time Travel Simulation
              </button>
              <button
                onClick={() => setActiveTab('negotiator')}
                className={`px-5 py-3.5 border-r border-white/5 flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'negotiator' ? 'bg-[#0A0A0A] text-[#FF3B30] font-black border-t-2 border-t-[#FF3B30]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> AI Deadline Negotiator
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`px-5 py-3.5 flex items-center gap-1.5 shrink-0 transition-all ${
                  activeTab === 'balance' ? 'bg-[#0A0A0A] text-[#FF3B30] font-black border-t-2 border-t-[#FF3B30]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" /> Life Balance Engine
              </button>
            </div>

            <div className="p-6 bg-[#0E0E0E]">
              
              {/* Tab Content 1: AI Assistant & Voice Executive Chat */}
              {activeTab === 'assistant' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <span className="flex items-center gap-1 font-mono"><Sparkles className="h-3.5 w-3.5 text-[#FF3B30]" /> Interactive Executive Partner</span>
                    <span className="text-xs text-slate-500">Autonomous context cache active</span>
                  </div>

                  <div className="bg-[#050505] p-4 rounded border border-white/5 h-[240px] overflow-y-auto space-y-3.5 font-mono text-sm text-slate-300">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role !== 'user' && (
                          <div className="w-6 h-6 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] flex items-center justify-center font-bold text-[10px] shrink-0">
                            OS
                          </div>
                        )}
                        <div className={`p-3 rounded max-w-[85%] leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-white text-black font-semibold ml-auto text-sm' 
                            : 'bg-[#141414] border border-white/5 text-slate-200 text-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex gap-2.5 items-center text-sm text-slate-400 italic">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Thinking and syncing schedules...
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()}
                      placeholder="Ask DeadlineOS to optimize scheduling or trigger emergency Rescue Mode..."
                      className="flex-1 bg-[#050505] border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF3B30] font-mono"
                    />
                    <button
                      onClick={handleAssistantSend}
                      className="bg-[#FF3B30] hover:bg-red-600 transition-all text-white px-4 py-2.5 rounded text-sm font-bold font-mono"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2">
                    <button 
                      onClick={() => { setChatInput("What should I do next? Rank highest deadline risk."); }}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded text-slate-300 font-mono"
                    >
                      💡 "What is my highest impact next action?"
                    </button>
                    <button 
                      onClick={() => { setChatInput("Looks like I'm getting distracted and scrolling my phone."); }}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1 rounded text-slate-300 font-mono"
                    >
                      📱 "I am getting distracted"
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content 2: AI Focus Coach */}
              {activeTab === 'focus' && (
                <FocusCoach 
                  onSessionComplete={handleFocusCompleted} 
                  onDistractionDetected={handleDistractionDetected} 
                  distractionCount={distractionCount} 
                />
              )}

              {/* Tab Content 3: AI Time Travel Simulation */}
              {activeTab === 'timetravel' && (
                <div className="space-y-6">
                  <div className="bg-[#141414] p-5 rounded-lg border border-white/5 space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                          <Compass className="h-4 w-4 text-[#00FF66] animate-pulse" /> {simDays}-Day Temporal Drift Simulator
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          Test prospective commitments before accepting. Predicts exactly how your sleep cycles, stress curve, and current deadlines drift in parallel dimensions.
                        </p>
                      </div>
                      <span className="text-xs font-mono uppercase bg-emerald-500/10 text-[#00FF66] border border-[#00FF66]/20 px-2.5 py-1 rounded-sm">
                        Quantum Engine Stable
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6">
                          <label className="block text-xs uppercase text-slate-400 font-mono mb-1.5 font-bold flex items-center gap-1">
                            <Compass className="h-3 w-3 text-slate-500" /> Prospective Commitment Name
                          </label>
                          <input
                            type="text"
                            value={simTitle}
                            onChange={(e) => setSimTitle(e.target.value)}
                            placeholder="e.g., 20h/week Mobile App Internship"
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#00FF66] font-mono transition-all"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs uppercase text-slate-400 font-mono mb-1.5 font-bold flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" /> Target Timeline (Days)
                          </label>
                          <input
                            type="number"
                            value={simDays}
                            min={1}
                            max={365}
                            onChange={(e) => setSimDays(Math.max(1, parseInt(e.target.value) || 10))}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#00FF66] transition-all font-mono"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs uppercase text-slate-400 font-mono mb-1.5 font-bold flex items-center gap-1">
                            <Battery className="h-3 w-3 text-slate-500" /> Effort Hours Required
                          </label>
                          <input
                            type="number"
                            value={simHours}
                            min={1}
                            onChange={(e) => setSimHours(Math.max(1, parseInt(e.target.value) || 4))}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#00FF66] transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Category Selector Buttons & Run button */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pt-2">
                        <div className="w-full lg:flex-1">
                          <label className="block text-xs uppercase text-slate-400 font-mono mb-1.5 font-bold">Prospective Task Category</label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {(['work', 'study', 'fitness', 'sleep', 'family', 'entertainment'] as const).map((cat) => {
                              const isSelected = simCategory === cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setSimCategory(cat)}
                                  className={`py-2 px-2 text-xs uppercase font-mono font-bold rounded-md border text-center transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.05)]' 
                                      : 'bg-[#0A0A0A] text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/10'
                                  }`}
                                >
                                  {cat === 'work' && '💼 '}
                                  {cat === 'study' && '📚 '}
                                  {cat === 'fitness' && '⚡ '}
                                  {cat === 'sleep' && '💤 '}
                                  {cat === 'family' && '❤️ '}
                                  {cat === 'entertainment' && '🎮 '}
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="w-full lg:w-auto shrink-0 min-w-[200px]">
                          <button
                            onClick={handleTimeTravelSimulation}
                            disabled={isSimulating}
                            className="w-full bg-[#00FF66] hover:bg-[#00E55C] text-black py-2.5 px-4 rounded text-sm font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(0,255,102,0.15)] disabled:opacity-50"
                          >
                            {isSimulating ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Simulating...
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 fill-current" /> Run Warp Simulation
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isSimulating ? (
                      <div className="p-8 rounded-lg bg-slate-950/80 border border-[#00FF66]/10 space-y-6 text-center">
                        <div className="relative flex justify-center items-center h-20">
                          {/* Animated orbits */}
                          <div className="absolute w-16 h-16 rounded-full border border-dashed border-[#00FF66]/30 animate-spin" style={{ animationDuration: '6s' }} />
                          <div className="absolute w-12 h-12 rounded-full border border-dashed border-indigo-500/40 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                          <div className="w-8 h-8 rounded-full bg-[#00FF66]/10 flex items-center justify-center animate-pulse">
                            <Activity className="h-4 w-4 text-[#00FF66]" />
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-w-md mx-auto">
                          <h4 className="text-xs font-mono font-black uppercase text-white tracking-widest">
                            ACTIVATING TEMPORAL PREDICTION MATRIX
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Synthesizing parallel {simDays}-day schedules against your active workloads...
                          </p>
                        </div>

                        {/* Interactive dynamic loading logs */}
                        <div className="bg-[#050505] p-4 rounded-md border border-white/5 text-left max-w-lg mx-auto font-mono text-[10px] space-y-2 text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${simLoadingStep >= 0 ? 'bg-[#00FF66] animate-pulse' : 'bg-slate-700'}`} />
                            <span className={simLoadingStep >= 0 ? 'text-slate-200' : 'text-slate-500'}>
                              [00:00] 📡 SCANNING FOCUS CAPACITY BASELINES...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${simLoadingStep >= 1 ? 'bg-[#00FF66] animate-pulse' : 'bg-slate-700'}`} />
                            <span className={simLoadingStep >= 1 ? 'text-slate-200' : 'text-slate-500'}>
                              [00:02] ⚙️ CONFLICT RESOLUTION: Interlacing current task deadlines...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${simLoadingStep >= 2 ? 'bg-[#00FF66] animate-pulse' : 'bg-slate-700'}`} />
                            <span className={simLoadingStep >= 2 ? 'text-slate-200' : 'text-slate-500'}>
                              [00:05] 💤 SLEEP METRICS ANALYSIS: Mapping cumulative recovery indices...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${simLoadingStep >= 3 ? 'bg-[#00FF66] animate-pulse' : 'bg-slate-700'}`} />
                            <span className={simLoadingStep >= 3 ? 'text-slate-200' : 'text-slate-500'}>
                              [00:08] 💥 COLLATERAL THREAT DETECTOR: Scanning priority collisions...
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${simLoadingStep >= 4 ? 'bg-[#00FF66]' : 'bg-slate-700'}`} />
                            <span className={simLoadingStep >= 4 ? 'text-slate-200' : 'text-slate-500'}>
                              [00:10] 🔮 PROJECTIONS RE-GENERATED. LOADING REALITY GRAPH...
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : simResult ? (
                      <div className="space-y-5 animate-fadeIn">
                        
                        {/* 1. Dual Horizontal Timeline Compare-O-Meter */}
                        <div className="border border-white/5 bg-[#0F0F0F] rounded-lg p-4 space-y-4">
                          <h4 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-black flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5 text-[#00FF66]" /> Reality Branch Compare-O-Meter
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Branch A */}
                            <div className="p-3.5 bg-black/40 rounded-md border border-emerald-500/10 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-black text-[#00FF66] uppercase">Branch A: Stable Path (Status Quo)</span>
                                <span className="text-xs font-mono font-bold bg-[#00FF66]/10 text-[#00FF66] px-1.5 py-0.5 rounded-sm">SECURE</span>
                              </div>
                              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '100%' }} />
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-xs text-slate-400 font-mono pt-1">
                                <span className="flex items-center gap-0.5 text-[#00FF66] font-bold"><ShieldCheck className="h-2.5 w-2.5" /> Core Safe</span>
                                <span className="flex items-center gap-0.5"><Moon className="h-2.5 w-2.5 text-indigo-400" /> Sleep: 100%</span>
                                <span className="flex items-center gap-0.5"><CheckSquare className="h-2.5 w-2.5 text-teal-400" /> Targets: Fit</span>
                              </div>
                            </div>

                            {/* Branch B */}
                            <div className={`p-3.5 bg-black/40 rounded-md border space-y-2 ${
                              simResult.accepted ? 'border-amber-500/20' : 'border-[#FF3B30]/20'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-mono font-black uppercase ${simResult.accepted ? 'text-amber-400' : 'text-[#FF3B30]'}`}>
                                  Branch B: Squeezed Path (With "{simTitle}")
                                </span>
                                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                                  simResult.accepted ? 'bg-amber-400/10 text-amber-400' : 'bg-[#FF3B30]/10 text-[#FF3B30] animate-pulse'
                                }`}>
                                  {simResult.accepted ? "STABLE-ISH" : "CRITICAL PINCH"}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  simResult.accepted ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                                }`} style={{ width: `${Math.max(25, 100 - simResult.sleepImpact * 6)}%` }} />
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-xs text-slate-400 font-mono pt-1">
                                <span className={`flex items-center gap-0.5 font-bold ${simResult.accepted ? 'text-amber-400' : 'text-rose-400'}`}>
                                  <AlertTriangle className="h-2.5 w-2.5" /> Stress: {simResult.newRiskScore}%
                                </span>
                                <span className="flex items-center gap-0.5 text-indigo-300">
                                  <Moon className="h-2.5 w-2.5 text-indigo-400" /> -{simResult.sleepImpact}h Sleep
                                </span>
                                <span className="flex items-center gap-0.5 text-slate-300">
                                  <CheckSquare className="h-2.5 w-2.5" /> {simResult.missedTasks && simResult.missedTasks.length > 0 ? "Threatens Tasks" : "Checklist safe"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Visual Metric Cards with Battery & Gauge meters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          
                          {/* Sleep Impact Card */}
                          <div className="bg-[#1C1C1C]/50 p-4 rounded-lg border border-white/5 flex flex-col justify-between space-y-3">
                            <div>
                              <span className="text-xs uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5 font-bold">
                                <Moon className="h-3.5 w-3.5 text-indigo-400" /> Sleep Deprivation Index
                              </span>
                              
                              <div className="flex items-center gap-2.5 my-3">
                                <div className="relative w-full max-w-[120px] h-6 bg-slate-950 rounded border border-white/10 flex p-0.5 items-center">
                                  {Array.from({ length: 5 }).map((_, idx) => {
                                    const threshold = (idx + 1) * 2;
                                    const isDrained = simResult.sleepImpact >= threshold;
                                    const cellColor = simResult.sleepImpact > 8 
                                      ? 'bg-rose-500' 
                                      : simResult.sleepImpact > 4 
                                      ? 'bg-amber-500' 
                                      : 'bg-emerald-500';
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`flex-1 h-full mr-0.5 rounded-sm transition-all duration-300 ${
                                          isDrained ? 'bg-slate-900 opacity-20' : cellColor
                                        }`} 
                                      />
                                    );
                                  })}
                                  <div className="absolute -right-1.5 top-[5px] w-1 h-2 bg-white/20 rounded-r-sm" />
                                </div>
                                <span className="text-sm font-black text-rose-400 font-mono">
                                  -{simResult.sleepImpact}h
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-slate-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
                              {simResult.sleepImpact > 8 ? (
                                <span className="text-rose-400 font-bold flex items-start gap-1">
                                  <Coffee className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-500" /> Drains {simResult.sleepImpact}h sleep. Equivalent to pulling {Math.round(simResult.sleepImpact/7 * 10)/10} full all-nighters. Heavy fatigue predicted.
                                </span>
                              ) : simResult.sleepImpact > 4 ? (
                                <span className="text-amber-400 font-semibold flex items-start gap-1">
                                  <Coffee className="h-3.5 w-3.5 shrink-0 mt-0.5" /> Moderate sleep compression. Keep morning routines strict to survive the crunch.
                                </span>
                              ) : (
                                <span className="text-[#00FF66] flex items-start gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" /> High sleep reserves. Restorative slots remain fully protected.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Collateral Threats / Crash Map */}
                          <div className="bg-[#1C1C1C]/50 p-4 rounded-lg border border-white/5 flex flex-col justify-between space-y-3">
                            <div>
                              <span className="text-xs uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5 font-bold">
                                <Flame className="h-3.5 w-3.5 text-[#FF3B30]" /> Deadline Collision Vectors
                              </span>
                              
                              {simResult.missedTasks && simResult.missedTasks.length > 0 ? (
                                <div className="space-y-1.5 my-2">
                                  {simResult.missedTasks.map((taskName, tIdx) => (
                                    <div key={tIdx} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-2 py-1.5 rounded-sm">
                                      <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-1 rounded-sm shrink-0">CRASH</span>
                                      <span className="text-xs text-slate-200 font-mono font-bold truncate">
                                        {taskName}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="my-2 py-2 flex flex-col items-center justify-center text-center bg-[#00FF66]/5 border border-[#00FF66]/10 rounded-md">
                                  <ShieldCheck className="h-6 w-6 text-[#00FF66] mb-1" />
                                  <span className="text-xs font-mono font-bold text-[#00FF66] uppercase">Safe Timeline Tunnel</span>
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
                              {simResult.missedTasks && simResult.missedTasks.length > 0 ? (
                                <span className="text-rose-400 font-medium">
                                  ⚠️ Resource bottleneck. Adding this commitment starves focus allocations from active milestones.
                                </span>
                              ) : (
                                <span className="text-[#00FF66] font-medium">
                                  🛡️ Smooth parallel integration. No collateral deadline collapses predicted.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stress Level Dial / Speedometer */}
                          <div className="bg-[#1C1C1C]/50 p-4 rounded-lg border border-white/5 flex flex-col justify-between space-y-3">
                            <div>
                              <span className="text-xs uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5 font-bold">
                                <Activity className="h-3.5 w-3.5 text-amber-400" /> Stress Spike Multiplier
                              </span>
                              
                              <div className="my-3.5 space-y-1">
                                <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden relative">
                                  <div className="absolute inset-0 flex">
                                    <div className="w-[40%] h-full bg-emerald-500/10" />
                                    <div className="w-[30%] h-full bg-amber-500/10" />
                                    <div className="w-[30%] h-full bg-rose-500/10" />
                                  </div>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      simResult.newRiskScore > 70 
                                        ? 'bg-[#FF3B30]' 
                                        : simResult.newRiskScore > 40 
                                        ? 'bg-amber-400' 
                                        : 'bg-[#00FF66]'
                                    }`}
                                    style={{ width: `${simResult.newRiskScore}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center font-mono text-xs">
                                  <span className="text-slate-500">Peak Load index:</span>
                                  <span className={`font-black ${
                                    simResult.newRiskScore > 70 ? 'text-[#FF3B30]' : simResult.newRiskScore > 40 ? 'text-amber-400' : 'text-[#00FF66]'
                                  }`}>
                                    {simResult.newRiskScore}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-slate-400 font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
                              {simResult.newRiskScore > 70 ? (
                                <span className="text-rose-400 font-bold">
                                  🚨 Heavy cognitive fatigue danger. High stress levels will choke deep focus.
                                </span>
                              ) : simResult.newRiskScore > 40 ? (
                                <span className="text-amber-400 font-semibold">
                                  ⚡ High cognitive load. Daily energy allocation is heavily saturated but holds.
                                </span>
                              ) : (
                                <span className="text-[#00FF66]">
                                  🟢 Healthy focus headroom. Calm, consistent cognitive execution predicted.
                                </span>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* 3. Comprehensive Summary Explanation text */}
                        <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                          <span className="text-xs font-mono tracking-widest text-[#00FF66] uppercase font-bold block">
                            Quantum Executive Diagnosis:
                          </span>
                          <p className="text-sm text-slate-200 leading-relaxed font-mono">
                            {simResult.impactMessage}
                          </p>
                        </div>

                        {/* 4. Interactive 30-Day Chronological Timeline capsules */}
                        <div className="border border-white/5 bg-[#0F0F0F] rounded-lg p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-black flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Interactive {simDays}-Day Outlook Matrix
                            </h4>
                            <span className="text-xs font-mono text-slate-500 uppercase">
                              Click any capsule to peer into that reality segment
                            </span>
                          </div>

                          {/* 5 capsules representing major periods in the next 30 days */}
                          <div className="grid grid-cols-5 gap-3">
                            {simResult.dailyRiskTrend?.map((pt, i) => {
                              const isSelected = selectedSimDay === i;
                              const colorClass = pt.risk > 70 
                                ? 'bg-gradient-to-b from-red-950/40 to-red-900/10 border-red-500 text-red-300' 
                                : pt.risk > 40 
                                ? 'bg-gradient-to-b from-amber-950/40 to-amber-900/10 border-amber-500 text-amber-300' 
                                : 'bg-gradient-to-b from-emerald-950/40 to-emerald-900/10 border-emerald-500 text-emerald-300';
                              
                              return (
                                <button
                                  key={i}
                                  onClick={() => setSelectedSimDay(i)}
                                  type="button"
                                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer relative hover:scale-105 flex flex-col items-center gap-2 ${
                                    isSelected 
                                      ? `${colorClass} ring-1 ring-white/20 shadow-[0_4px_12px_rgba(255,255,255,0.05)]` 
                                      : 'bg-black/60 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                                  )}
                                  
                                  <span className="text-xs font-black uppercase font-mono tracking-wider">{pt.day}</span>
                                  <div className="h-7 w-1 bg-slate-900 rounded-full overflow-hidden relative">
                                    <div 
                                      className={`absolute bottom-0 w-full rounded-full ${
                                        pt.risk > 70 ? 'bg-[#FF3B30]' : pt.risk > 40 ? 'bg-amber-400' : 'bg-[#00FF66]'
                                      }`}
                                      style={{ height: `${pt.risk}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-black font-mono">{pt.risk}%</span>
                                  <span className="text-[9px] font-mono uppercase opacity-50">TENSION</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Day - Temporal Portal Peek details */}
                          {selectedSimDay !== null && (
                            <div className="bg-[#141414] p-4 rounded border border-white/5 space-y-2 animate-fadeIn">
                                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                  <span className="text-xs font-mono font-black text-[#00FF66] uppercase flex items-center gap-1">
                                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#00FF66]" /> Quantum Timeline Segment: {simResult.dailyRiskTrend[selectedSimDay]?.day}
                                  </span>
                                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                    simResult.dailyRiskTrend[selectedSimDay]?.risk > 70 
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                      : simResult.dailyRiskTrend[selectedSimDay]?.risk > 40 
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                      : 'bg-emerald-500/10 text-[#00FF66] border border-emerald-500/20'
                                  }`}>
                                    {simResult.dailyRiskTrend[selectedSimDay]?.risk > 70 ? "CRITICAL CRUNCH" : simResult.dailyRiskTrend[selectedSimDay]?.risk > 40 ? "COMPRESSED CAPACITY" : "STEADY FLIGHT"}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-slate-300 leading-relaxed font-mono">
                                  {selectedSimDay === 0 && (
                                    `🚀 Dimension Departure (${simResult.dailyRiskTrend[0]?.day}): Initiating preliminary scope for "${simTitle}". Your starting tension is fully stable at ${simResult.dailyRiskTrend[0]?.risk}%. Your baseline schedule absorbs the initial load, masking the upcoming cumulative compression.`
                                  )}
                                  {selectedSimDay === 1 && (
                                    `⚖️ Compressed Ascent (${simResult.dailyRiskTrend[1]?.day}): The workload intensity steps up. Cumulative sleep deprivation starts building up, triggering morning grogginess vectors. Focus hours are tight but holding. Stress: ${simResult.dailyRiskTrend[1]?.risk}%.`
                                  )}
                                  {selectedSimDay === 2 && (
                                    `🚨 The Peak Squeeze (${simResult.dailyRiskTrend[2]?.day} - Critical Overlap): Multiple deliverable milestones collide directly. Sleep deficit reaches its peak of -${simResult.sleepImpact} hours. Stress spikes to ${simResult.dailyRiskTrend[2]?.risk}%. Highest threat of procrastination or task defaults.`
                                  )}
                                  {selectedSimDay === 3 && (
                                    `🌊 Post-Crunch Recovery (${simResult.dailyRiskTrend[3]?.day}): Submissions cleared, timelines stabilize. Cognitive load drops back to ${simResult.dailyRiskTrend[3]?.risk}% as calendar blocks open. Focus reserve is actively recharging.`
                                  )}
                                  {selectedSimDay === 4 && (
                                    `🏆 Timeline Equilibrium (${simResult.dailyRiskTrend[4]?.day}): Month-end review. Your focus indices have leveled off at ${simResult.dailyRiskTrend[4]?.risk}%. A stable baseline is successfully restored, and the temporal threat has fully subsided.`
                                  )}
                                </p>
                              </div>
                            )}
                        </div>

                      </div>
                    ) : (
                      <div className="p-10 rounded-lg bg-slate-950/40 border border-dashed border-white/10 text-center space-y-3.5">
                        <Compass className="h-8 w-8 text-slate-500 mx-auto animate-pulse" />
                        <div className="space-y-1">
                          <span className="block text-sm font-mono font-bold text-slate-400 uppercase">Awaiting Quantum Simulation Parameters</span>
                          <span className="block text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Enter a prospective assignment, internship, or freelance project above, select a category, and click "Run Warp Simulation" to peer into the {simDays}-day temporal consequences.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content 4: AI Deadline Negotiator */}
              {activeTab === 'negotiator' && (
                <div className="space-y-4">
                  <div className="bg-[#141414] p-4 rounded border border-white/5 space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Deadline Negotiator</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      If you're in a critical squeeze, DeadlineOS acts on your behalf. Generate a high-agency, professional extension email draft recommending an optimized milestone delay.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-slate-400 font-mono mb-1">Reason for Adjustment</label>
                        <input
                          type="text"
                          value={negotiatorReason}
                          onChange={(e) => setNegotiatorReason(e.target.value)}
                          placeholder="e.g. debugging backpropagation routines"
                          className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-[#FF3B30] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-slate-400 font-mono mb-1">Recipient / Audience</label>
                        <input
                          type="text"
                          value={negotiatorAudience}
                          onChange={(e) => setNegotiatorAudience(e.target.value)}
                          placeholder="e.g. Professor Smith"
                          className="w-full bg-[#0F0F0F] border border-white/10 rounded p-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleNegotiateDraft}
                      disabled={isNegotiating}
                      className="w-full bg-white text-black py-2 rounded text-sm font-mono font-bold uppercase hover:bg-slate-200 transition-all"
                    >
                      {isNegotiating ? "Generating high-agency draft..." : "Generate Proposal Draft"}
                    </button>

                    {negotiatedDraft && (
                      <div className="p-4 rounded bg-slate-950 border border-white/5 space-y-3 relative">
                        <button
                          onClick={handleCopyEmail}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
                          title="Copy Draft"
                        >
                          {isEmailCopied ? <Check className="h-3.5 w-3.5 text-[#00FF66]" /> : <Copy className="h-3.5 w-3.5" />}
                          {isEmailCopied ? "Copied" : "Copy"}
                        </button>
                        <div className="text-xs font-mono text-[#00FF66] border-b border-white/5 pb-1">SUBJECT: {negotiatedDraft.subject}</div>
                        <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed pr-12">
                          {negotiatedDraft.body}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content 5: Life Balance Engine */}
              {activeTab === 'balance' && (
                <div className="space-y-4">
                  <div className="bg-[#141414] p-4 rounded border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Life Balance Engine</h3>
                      <span className="text-xs font-mono text-[#00FF66]">Optimizing Overall Well-being</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Adjust your preferred daily energy caps. The AI scheduler utilizes these constraints to automatically push or slide work sessions, protecting sleep and fitness from collapsing.
                    </p>

                    <div className="space-y-3">
                      {(Object.keys(lifeBalance) as Array<keyof typeof lifeBalance>).map((key) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="capitalize text-slate-300 font-mono">{key} Range</span>
                            <span className="font-mono text-slate-400">{lifeBalance[key]}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={lifeBalance[key]}
                              onChange={(e) => setLifeBalance({ ...lifeBalance, [key]: parseInt(e.target.value) })}
                              className="flex-1 accent-[#FF3B30]"
                            />
                            <span className="text-xs font-mono text-slate-500 w-12 text-right">
                              {lifeBalance[key] > 70 ? "High Allocation" : lifeBalance[key] > 40 ? "Balanced" : "Minimal"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>Rhythms Optimizer: Active</span>
                      <button 
                        onClick={() => {
                          setLifeBalance({ work: 60, study: 50, fitness: 60, sleep: 80, family: 70, entertainment: 50 });
                          setChatMessages(prev => [...prev, { role: 'assistant', content: "🔄 **Schedules Restructured**: Life-balance priority locked to *Sleep & Family*. Active study sessions pushed back; work constraints capped to 4h maximum today." }]);
                        }}
                        className="text-[#FF3B30] hover:underline"
                      >
                        Reset to Healthy Well-being Baseline
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </section>

      </main>

      {/* 2. Dashboard Footer */}
      <footer className="mt-8 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] opacity-40 gap-4">
        <div className="flex gap-6 flex-wrap justify-center">
          <span>G-Cal Sync: OK</span>
          <span>Slack Auth: OK</span>
          <span>Gmail API: Monitoring</span>
          <span>Jira API: Listening</span>
        </div>
        <div>
          System Status: Autonomous / Optimized & Ready
        </div>
      </footer>
      
    </div>
  );
}
