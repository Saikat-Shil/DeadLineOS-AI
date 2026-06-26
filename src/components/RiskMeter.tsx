import React from 'react';
import { AlertOctagon, Brain, Calendar, ShieldAlert, Zap } from 'lucide-react';
import { Task } from '../types';

interface RiskMeterProps {
  task: Task;
  onActivateRescue: (taskId: string) => void;
}

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

export default function RiskMeter({ task, onActivateRescue }: RiskMeterProps) {
  const getRiskColor = (score: number) => {
    if (score < 35) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score < 70) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getRiskGradient = (score: number) => {
    if (score < 35) return 'from-emerald-500 to-teal-500';
    if (score < 70) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  const hoursLeft = Math.max(0, Math.round((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)));
  const isEmergency = task.isEmergencyMode || hoursLeft < 24;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 ${
      isEmergency 
        ? 'border-rose-500/50 bg-slate-950/90 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse' 
        : 'border-slate-800 bg-slate-900/60 shadow-xl'
    }`} id={`risk-meter-${task.id}`}>
      
      {/* Background glow */}
      <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-3xl bg-gradient-to-br ${
        isEmergency ? 'from-rose-500 to-red-500' : 'from-blue-500 to-violet-500'
      }`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEmergency ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider animate-bounce">
              <ShieldAlert className="h-3.5 w-3.5" /> Emergency Rescue Active
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              <Brain className="h-3.5 w-3.5 text-blue-400" /> AI Risk Forecast
            </div>
          )}
        </div>
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {formatCountdown(task.deadline)}
        </span>
      </div>

      <div className="mb-6">
        <h4 className="text-slate-200 font-medium text-lg truncate mb-1">{task.title}</h4>
        <p className="text-xs text-slate-400 line-clamp-1 italic">{task.riskReason}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Risk Circle Gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-28 w-28 flex items-center justify-center">
            {/* SVG Arc Progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                className="transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - task.riskScore / 100)}
                strokeLinecap="round"
                fill="transparent"
                stroke={`url(#riskGradient-${task.id})`}
              />
              <defs>
                <linearGradient id={`riskGradient-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
                  <stop offset="100%" className="text-rose-500" stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-100 tracking-tight font-mono">
                {task.riskScore}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Risk Score
              </span>
            </div>
          </div>
        </div>

        {/* Forecasted metrics */}
        <div className="col-span-2 space-y-3.5 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Stress Prediction</span>
            <span className={`font-mono font-bold ${
              task.riskScore > 75 ? 'text-red-400' : task.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {task.riskScore > 75 ? '🔥 High Stress' : task.riskScore > 40 ? '⚡ Elevated' : '🍃 Controlled'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Required Effort</span>
            <span className="font-mono text-slate-200 font-semibold">{task.estimatedHours} hours</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Buffer Index</span>
            <span className={`font-mono font-bold ${hoursLeft > task.estimatedHours * 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hoursLeft > task.estimatedHours * 3 ? 'Safe Margin' : 'Critical Squeeze'}
            </span>
          </div>
        </div>
      </div>

      {isEmergency && (
        <div className="mt-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Deadline Rescue Engine Engaged:</span> Unfinished tasks have been prioritized, a Pomodoro block scheduled, and high-impact actions moved to the top. Keep focus to beat the risk!
          </div>
        </div>
      )}

      {!task.isEmergencyMode && task.riskScore >= 50 && (
        <button
          onClick={() => onActivateRescue(task.id)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs tracking-wider uppercase font-mono shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95"
          id={`btn-rescue-${task.id}`}
        >
          <Zap className="h-4 w-4 animate-bounce" /> Force Deadline Rescue Mode
        </button>
      )}
    </div>
  );
}
