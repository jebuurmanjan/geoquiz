import React from 'react'

export default function StatPill({ value, label, type }) {
  return (
    <div className={`stat-pill ${type}`}>
      <div className="pill-value">{value}</div>
      <div className="pill-label">{label}</div>
    </div>
  )
}
