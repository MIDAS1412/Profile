import type { PropsWithChildren } from 'react'

type ShellProps = PropsWithChildren<{
  accent?: 'ember' | 'ocean' | 'forest'
}>

export function Shell({ accent = 'ember', children }: ShellProps) {
  return (
    <div className={`app-shell accent-${accent}`}>
      <div className="app-background" />
      <div className="app-noise" />
      <main className="app-frame">{children}</main>
    </div>
  )
}
