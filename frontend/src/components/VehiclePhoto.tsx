// A vehicle's photo, or a neutral placeholder when there is none or it fails to load.
import { useState } from 'react'

export function VehiclePhoto({ src, name, className = '' }: {
  src?: string | null
  name: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const frame = `overflow-hidden bg-slate-100 ${className}`

  if (!src || failed) {
    return (
      <div role="img" aria-label={`No photo of ${name}`}
        className={`${frame} flex items-center justify-center text-4xl text-slate-300`}>
        <span aria-hidden="true">🚗</span>
      </div>
    )
  }
  return (
    <div className={frame}>
      <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
    </div>
  )
}
