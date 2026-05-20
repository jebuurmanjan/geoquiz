import React from 'react'

export default function OptionButton({ option, mode, onClick, state, disabled }) {
  // state: null | 'correct' | 'wrong'
  const className = ['option-btn', state].filter(Boolean).join(' ')

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {mode === 'name-to-flag' && (
        <>
          <span className="option-flag">{option.flag}</span>
          {disabled && <span className="option-name">{option.name}</span>}
        </>
      )}
      {mode === 'flag-to-name' && (
        <span>{option.name}</span>
      )}
    </button>
  )
}
