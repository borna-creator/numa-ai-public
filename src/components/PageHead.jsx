import { useEffect } from 'react'

export default function PageHead({ title, description, path = '' }) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    let metaDescription = document.querySelector('meta[name="description"]')
    const prevDescription = metaDescription?.getAttribute('content') ?? ''

    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)
    }

    let canonical = document.querySelector('link[rel="canonical"]')
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://numaiq.com'
    const canonicalUrl = `${siteUrl}${path}`

    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    return () => {
      document.title = prevTitle
      if (metaDescription) {
        metaDescription.setAttribute('content', prevDescription)
      }
    }
  }, [title, description, path])

  return null
}
