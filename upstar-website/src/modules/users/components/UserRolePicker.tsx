"use client"
import { useState } from 'react'

type Props = {
  roles: string[]
  onChange: (roles: string[]) => void
}

const ALL_ROLES = ['admin', 'moderator', 'analyst', 'support', 'reader']

export default function UserRolePicker({ roles, onChange }: Props) {
  const [localRoles, setLocalRoles] = useState<string[]>(roles)

  const toggle = (r: string) => {
    const next = localRoles.includes(r) ? localRoles.filter(x => x !== r) : [...localRoles, r]
    setLocalRoles(next)
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ROLES.map(r => (
        <button
          key={r}
          onClick={() => toggle(r)}
          className={`px-2 py-1 rounded text-xs border ${localRoles.includes(r) ? 'bg-brand-500 text-white border-brand-400' : 'bg-white/5 border-white/10 text-white/80'}`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}



