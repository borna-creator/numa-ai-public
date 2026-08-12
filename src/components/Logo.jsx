import iconLogo from '../../resources/numa_iq_icon.png'
import wideLogo from '../../resources/numa_iq_wide_logo.png'

export function LogoIcon({ className = 'h-9 w-auto' }) {
  return (
    <img
      src={iconLogo}
      alt="NumaIQ"
      className={className}
    />
  )
}

export function LogoWide({ className = 'h-10 w-auto' }) {
  return (
    <img
      src={wideLogo}
      alt="NumaIQ — Voice Agents | Telephony"
      className={className}
    />
  )
}

export default function Logo({ variant = 'icon', className }) {
  if (variant === 'wide') {
    return <LogoWide className={className ?? 'h-10 w-auto'} />
  }
  return <LogoIcon className={className ?? 'h-9 w-auto'} />
}
