import { useState } from 'react'
import { Play, Pause, Square, Loader2, Zap, RotateCcw } from 'lucide-react'
import {
  useStartAgent,
  useStopAgent,
  usePauseAgent,
  useResumeAgent,
  useResetProject,
} from '../hooks/useProjects'
import type { AgentStatus } from '../lib/types'

interface AgentControlProps {
  projectName: string
  status: AgentStatus
  yoloMode?: boolean  // From server status - whether currently running in YOLO mode
}

export function AgentControl({ projectName, status, yoloMode = false }: AgentControlProps) {
  const [yoloEnabled, setYoloEnabled] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const startAgent = useStartAgent(projectName)
  const stopAgent = useStopAgent(projectName)
  const pauseAgent = usePauseAgent(projectName)
  const resumeAgent = useResumeAgent(projectName)
  const resetProject = useResetProject()

  const isLoading =
    startAgent.isPending ||
    stopAgent.isPending ||
    pauseAgent.isPending ||
    resumeAgent.isPending ||
    resetProject.isPending

  const handleStart = () => startAgent.mutate(yoloEnabled)
  const handleStop = () => stopAgent.mutate()
  const handlePause = () => pauseAgent.mutate()
  const handleResume = () => resumeAgent.mutate()
  const handleReset = () => {
    setResetError(null)
    resetProject.mutate(projectName, {
      onSuccess: () => {
        setShowResetConfirm(false)
        setResetError(null)
      },
      onError: (error: Error) => {
        setResetError(error.message || 'Failed to reset project')
      },
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <StatusIndicator status={status} />

      {/* YOLO Mode Indicator - shown when running in YOLO mode */}
      {(status === 'running' || status === 'paused') && yoloMode && (
        <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-neo-pending)] border-3 border-[var(--color-neo-border)]">
          <Zap size={14} className="text-yellow-900" />
          <span className="font-display font-bold text-xs uppercase text-yellow-900">
            YOLO
          </span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-1">
        {status === 'stopped' || status === 'crashed' ? (
          <>
            {/* Reset Button - only shown when stopped */}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading}
              className="neo-btn neo-btn-secondary text-sm py-2 px-3"
              title="Reset Project (clear all features)"
            >
              <RotateCcw size={18} />
            </button>
            {/* YOLO Toggle - only shown when stopped */}
            <button
              onClick={() => setYoloEnabled(!yoloEnabled)}
              className={`neo-btn text-sm py-2 px-3 ${
                yoloEnabled ? 'neo-btn-warning' : 'neo-btn-secondary'
              }`}
              title="YOLO Mode: Skip testing for rapid prototyping"
            >
              <Zap size={18} className={yoloEnabled ? 'text-yellow-900' : ''} />
            </button>
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="neo-btn neo-btn-success text-sm py-2 px-3"
              title={yoloEnabled ? "Start Agent (YOLO Mode)" : "Start Agent"}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
            </button>
          </>
        ) : status === 'running' ? (
          <>
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="neo-btn neo-btn-warning text-sm py-2 px-3"
              title="Pause Agent"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Pause size={18} />
              )}
            </button>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="neo-btn neo-btn-danger text-sm py-2 px-3"
              title="Stop Agent"
            >
              <Square size={18} />
            </button>
          </>
        ) : status === 'paused' ? (
          <>
            <button
              onClick={handleResume}
              disabled={isLoading}
              className="neo-btn neo-btn-success text-sm py-2 px-3"
              title="Resume Agent"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
            </button>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="neo-btn neo-btn-danger text-sm py-2 px-3"
              title="Stop Agent"
            >
              <Square size={18} />
            </button>
          </>
        ) : null}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-3 border-[var(--color-neo-border)] p-6 max-w-md">
            <h3 className="font-display font-bold text-lg mb-2">Reset Project?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will delete all features and re-run the initializer agent on the next start.
              Your app spec and project files will be preserved.
            </p>
            {resetError && (
              <div className="mb-4 p-2 bg-red-50 border-2 border-red-300 text-red-700 text-sm">
                {resetError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowResetConfirm(false)
                  setResetError(null)
                }}
                disabled={resetProject.isPending}
                className="neo-btn neo-btn-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetProject.isPending}
                className="neo-btn neo-btn-danger text-sm py-2 px-4"
              >
                {resetProject.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin inline mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusIndicator({ status }: { status: AgentStatus }) {
  const statusConfig = {
    stopped: {
      color: 'var(--color-neo-text-secondary)',
      label: 'Stopped',
      pulse: false,
    },
    running: {
      color: 'var(--color-neo-done)',
      label: 'Running',
      pulse: true,
    },
    paused: {
      color: 'var(--color-neo-pending)',
      label: 'Paused',
      pulse: false,
    },
    crashed: {
      color: 'var(--color-neo-danger)',
      label: 'Crashed',
      pulse: true,
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border-3 border-[var(--color-neo-border)]">
      <span
        className={`w-3 h-3 rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      <span
        className="font-display font-bold text-sm uppercase"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  )
}
