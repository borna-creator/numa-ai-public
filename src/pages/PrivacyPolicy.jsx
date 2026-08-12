import LegalPage from '../components/LegalPage'
import { SITE } from '../config/site'

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`Privacy Policy for ${SITE.name} — how we collect, use, and protect your information.`}
      path="/privacy"
    >
      <p>
        This Privacy Policy describes how {SITE.legalName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        collects, uses, and shares information when you visit our website or use our services.
        By accessing or using our services, you agree to the practices described in this policy.
      </p>

      <Section title="1. Information We Collect">
        <p>We may collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-slate-800">Contact information</strong> — such as your name,
            email address, phone number, and company name when you request a demo or contact us.
          </li>
          <li>
            <strong className="text-slate-800">Usage data</strong> — such as pages visited,
            browser type, device information, IP address, and referring URLs collected
            automatically through cookies and similar technologies.
          </li>
          <li>
            <strong className="text-slate-800">Service data</strong> — such as call recordings,
            transcriptions, and analytics generated when you use our voice agent or QA platform
            services under a separate agreement.
          </li>
        </ul>
      </Section>

      <Section title="2. How We Use Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide, operate, and improve our website and services</li>
          <li>Respond to inquiries and communicate with you</li>
          <li>Send service-related notices and marketing communications (where permitted)</li>
          <li>Analyze usage trends and enhance user experience</li>
          <li>Comply with legal obligations and protect our rights</li>
        </ul>
      </Section>

      <Section title="3. Sharing of Information">
        <p>
          We do not sell your personal information. We may share information with trusted
          third-party service providers who assist us in operating our website and delivering
          our services (such as hosting, analytics, and communication tools), subject to
          appropriate confidentiality obligations. We may also disclose information if required
          by law or to protect the rights, property, or safety of {SITE.legalName}, our users,
          or others.
        </p>
      </Section>

      <Section title="4. Cookies and Tracking">
        <p>
          We use cookies and similar technologies to remember preferences, analyze traffic,
          and improve our website. You can control cookies through your browser settings.
          Disabling cookies may affect certain features of the site.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <p>
          We retain personal information for as long as necessary to fulfill the purposes
          outlined in this policy, unless a longer retention period is required or permitted
          by law. Service data retention is governed by your applicable service agreement.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement reasonable administrative, technical, and organizational measures to
          protect your information. However, no method of transmission over the internet or
          electronic storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="7. International Transfers">
        <p>
          Your information may be processed in countries other than your country of residence,
          including the United Arab Emirates. By using our services, you consent to the
          transfer of information to these locations.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>
          Depending on your jurisdiction, you may have the right to access, correct, delete,
          or restrict the processing of your personal information, or to object to certain
          processing activities. To exercise these rights, please contact us using the
          details below.
        </p>
      </Section>

      <Section title="9. Children&apos;s Privacy">
        <p>
          Our services are not directed to individuals under the age of 18. We do not
          knowingly collect personal information from children. If you believe we have
          collected such information, please contact us so we can delete it.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised
          policy on this page and update the &quot;Last updated&quot; date. Your continued use
          of our services after changes become effective constitutes acceptance of the
          updated policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p>
          {SITE.legalName}<br />
          {SITE.address.line1}<br />
          {SITE.address.line2}<br />
          {SITE.address.country}<br />
          Email: <a href={`mailto:${SITE.email}`} className="text-numa-600 hover:underline">{SITE.email}</a><br />
          Phone: <a href={`tel:${SITE.phoneTel}`} className="text-numa-600 hover:underline">{SITE.phone}</a>
        </p>
      </Section>
    </LegalPage>
  )
}
