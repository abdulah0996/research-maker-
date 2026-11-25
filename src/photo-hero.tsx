import type { ReactNode } from 'react'
import './photo-hero.css'

export function PhotoHero({ image, className = '', children }: { image: ReactNode; className?: string; children: ReactNode }) {
  return <section className={'photo-hero ' + className}>
    <div className="photo-hero-image" aria-hidden="true">{image}</div>
    {children}
  </section>
}
