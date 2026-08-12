import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import VoiceAgents from '../components/VoiceAgents'
import QAPlatform from '../components/QAPlatform'
import Languages from '../components/Languages'
import Features from '../components/Features'
import Team from '../components/Team'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import PageHead from '../components/PageHead'
import { SEO } from '../config/site'

export default function HomePage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
  }, [hash])

  return (
    <>
      <PageHead title={SEO.title} description={SEO.description} path="/" />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>
          <Hero />
          <VoiceAgents />
          <QAPlatform />
          <Languages />
          <Features />
          <Team />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  )
}
