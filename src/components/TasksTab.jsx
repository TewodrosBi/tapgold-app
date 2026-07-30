import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, Globe, Video, Award } from 'lucide-react';
import { DailyCheckIn } from './DailyCheckIn';
import { triggerHaptic } from '../utils/telegram';

export const TasksTab = ({ streakData, onClaimCheckIn, onClaimReward }) => {
  const [completedTasks, setCompletedTasks] = useState([]);

  const tasks = [
    { id: 'tg_channel', title: 'Join Telegram Channel', reward: 5000, icon: MessageSquare },
    { id: 'twitter_follow', title: 'Follow on X (Twitter)', reward: 2500, icon: Globe },
    { id: 'youtube_sub', title: 'Subscribe to YouTube', reward: 3000, icon: Video },
    { id: 'daily_checkin', title: 'Daily Check-in Reward', reward: 1000, icon: Award },
  ];

  const handleTaskClick = (taskId, reward) => {
    if (completedTasks.includes(taskId)) return;
    triggerHaptic('success');
    setCompletedTasks((prev) => [...prev, taskId]);
    onClaimReward(reward);
  };

  return (
    <div className="w-full px-4 py-3 select-none space-y-4">
      {/* 2. Relocated Daily Check-in Calendar under Daily Rewards section */}
      <DailyCheckIn streakData={streakData} onClaimCheckIn={onClaimCheckIn} />

      {/* Social Tasks & Quests */}
      <div className="glass-panel rounded-2xl p-4 shadow-xl">
        <h3 className="text-base font-extrabold text-amber-300 mb-1">📋 Daily Quests & Tasks</h3>
        <p className="text-xs text-slate-400 mb-4">Complete simple tasks to earn extra bonus coins!</p>

        <div className="space-y-2.5">
          {tasks.map((task) => {
            const Icon = task.icon;
            const isDone = completedTasks.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id, task.reward)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/10 hover:border-amber-500/30 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{task.title}</div>
                    <div className="text-[11px] font-semibold text-amber-400">+{task.reward.toLocaleString()} 🪙</div>
                  </div>
                </div>

                <div>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <button className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30">
                      Claim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
