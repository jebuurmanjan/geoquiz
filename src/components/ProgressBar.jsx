import React from 'react'

export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="quiz-progress">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label">{current} / {total}</div>
    </div>
  )
}
