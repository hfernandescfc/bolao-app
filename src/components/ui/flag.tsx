import { getFlagUrl } from '@/lib/team-flags'

interface FlagProps {
  /** Código FIFA TLA do time (ex: BRA, MEX, ENG) */
  code?: string | null
  /** Largura em pixels — padrão 20 */
  size?: number
  className?: string
}

/**
 * Renderiza a bandeira do país como SVG vinda do CDN flag-icons.
 * Funciona em qualquer dispositivo (incluindo Windows, que não suporta emojis de bandeira).
 */
export function Flag({ code, size = 20, className = '' }: FlagProps) {
  const url = getFlagUrl(code)
  if (!url) {
    return (
      <span
        aria-hidden
        className={`inline-block rounded-[2px] bg-gray-200 ${className}`}
        style={{ width: size, height: Math.round(size * 0.75) }}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      className={`inline-block rounded-[2px] object-cover align-middle shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  )
}
