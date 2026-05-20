import React from 'react'

export default function ModeCard({ icon, title, desc, selected, onClick }) {
  return (
    <button className={`mode-card ${selected ? 'selected' : ''}`} onClick={onClick} type="button">
      {selected && <span className="check-badge">✓</span>}
      <span className="mode-icon">{icon}</span>
      <span className="mode-title">{title}</span>
      <span className="mode-desc">{desc}</span>
    </button>
  )
}
