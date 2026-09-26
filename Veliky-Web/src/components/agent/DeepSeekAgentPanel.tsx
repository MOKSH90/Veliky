import React, { useState, useEffect } from 'react';
import { DeepSeekHarnessService, DeepSeekSubagent } from '../../services/deepseekHarnessService';
import { Bot, Cpu, Terminal, Play, Pause, RefreshCw, Shield, Code, Database, Sparkles } from 'lucide-react';

export const DeepSeekAgentPanel: React.FC = () => {
  const [agents, setAgents] = useState<DeepSeekSubagent[]>([]);
  const [newRole, setNewRole] = useState<string>('');
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [isSpawning, setIsSpawning] = useState<boolean>(false);

  useEffect(() => {
    DeepSeekHarnessService.getSubagents().then(setAgents);
  }, []);

  const handleSpawn = async () => {
    if (!newRole.trim() || !newPrompt.trim()) return;
    setIsSpawning(true);
    const agent = await DeepSeekHarnessService.spawnSubagent(newRole, 'deepseek-r1', newPrompt);
    setAgents((prev) => [agent, ...prev]);
    setNewRole('');
    setNewPrompt('');
    setIsSpawning(false);
  };

  const toggleAgentStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((ag) => {
        if (ag.id === id) {
          const nextStatus = ag.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
          return { ...ag, status: nextStatus };
        }
        return ag;
      })
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-lg">DeepSeek Harness (`dsh`) Agent Engine</h3>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-medium border border-cyan-500/20">
          Cordis Plugin Runtime Active
        </span>
      </div>

      {/* Subagents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {agents.map((ag) => (
          <div key={ag.id} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-md">
                  {ag.role.includes('Code') ? (
                    <Code className="w-4 h-4" />
                  ) : ag.role.includes('Database') ? (
                    <Database className="w-4 h-4" />
                  ) : ag.role.includes('Security') ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{ag.name}</h4>
                  <p className="text-[11px] text-slate-400">{ag.model}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ag.status === 'RUNNING'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : ag.status === 'PAUSED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {ag.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 italic line-clamp-2 bg-slate-900/50 p-2 rounded border border-slate-800">
              {ag.activeTask || ag.role}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Tokens: {ag.tokensStreamed.toLocaleString()}</span>
              <button
                onClick={() => toggleAgentStatus(ag.id)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {ag.status === 'RUNNING' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{ag.status === 'RUNNING' ? 'Pause' : 'Resume'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Spawn Agent Form */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Spawn Autonomous Subagent (via DeepSeek Harness)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Agent Role (e.g. AST Code Refactoring Agent)"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500"
          />
          <input
            type="text"
            placeholder="Instruction / Goal for Subagent..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 md:col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSpawn}
            disabled={isSpawning}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
          >
            <Cpu className="w-3 h-3" />
            <span>{isSpawning ? 'Spawning Subagent Process...' : 'Spawn dsh Subagent'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
