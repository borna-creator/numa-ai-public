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

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description={`Terms and Conditions for using ${SITE.name} website and services.`}
      path="/terms"
    >
      <p>
        These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the
        website and services provided by {SITE.legalName} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        By accessing our website or using our services, you agree to be bound by these Terms.
        If you do not agree, please do not use our services.
      </p>

      <Section title="1. Services">
        <p>
          {SITE.legalName} provides AI-powered voice agent and quality assurance platform
          services for business use. Specific features, service levels, and pricing are
          defined in a separate order form, statement of work, or master service agreement
          between you and {SITE.legalName}.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and have the authority to enter into these Terms
          on behalf of yourself or the organization you represent. By using our services,
          you represent that you meet these requirements.
        </p>
      </Section>

      <Section title="3. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use our services for any unlawful, fraudulent, or harmful purpose</li>
          <li>Violate applicable telecommunications, privacy, or data protection laws</li>
          <li>Attempt to gain unauthorized access to our systems or other users&apos; data</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from our platform</li>
          <li>Interfere with or disrupt the integrity or performance of our services</li>
          <li>Use our services to send spam, harass individuals, or impersonate others</li>
        </ul>
      </Section>

      <Section title="4. Account and Access">
        <p>
          Where account credentials are provided, you are responsible for maintaining the
          confidentiality of your login information and for all activities under your account.
          You must notify us promptly of any unauthorized use or security breach.
        </p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          All content, software, trademarks, and technology associated with our services
          are owned by or licensed to {SITE.legalName}. We grant you a limited, non-exclusive,
          non-transferable license to use our services in accordance with these Terms and
          any applicable agreement. You retain ownership of your data submitted to our platform.
        </p>
      </Section>

      <Section title="6. Confidentiality">
        <p>
          Each party agrees to protect the other party&apos;s confidential information and use
          it only for purposes related to the services. Confidentiality obligations do not
          apply to information that is publicly available, independently developed, or
          rightfully received from a third party without restriction.
        </p>
      </Section>

      <Section title="7. Disclaimers">
        <p>
          Our website and services are provided on an &quot;as is&quot; and &quot;as available&quot; basis
          without warranties of any kind, whether express or implied, including warranties
          of merchantability, fitness for a particular purpose, or non-infringement. We do
          not warrant that our services will be uninterrupted, error-free, or completely secure.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {SITE.legalName} shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages, or any loss
          of profits, revenue, data, or business opportunities arising from your use of our
          services. Our total liability for any claim shall not exceed the fees paid by you
          to {SITE.legalName} in the twelve (12) months preceding the claim, or one hundred
          US dollars (USD 100), whichever is greater.
        </p>
      </Section>

      <Section title="9. Indemnification">
        <p>
          You agree to indemnify and hold harmless {SITE.legalName} and its officers,
          directors, employees, and agents from any claims, damages, losses, or expenses
          (including reasonable legal fees) arising from your use of our services, your
          violation of these Terms, or your violation of any third-party rights.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We may suspend or terminate your access to our services at any time if you breach
          these Terms or if required by law. Upon termination, your right to use the services
          ceases immediately. Provisions that by their nature should survive termination
          will remain in effect.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the
          United Arab Emirates, without regard to conflict of law principles. Any disputes
          arising under these Terms shall be subject to the exclusive jurisdiction of the
          courts of Dubai, United Arab Emirates.
        </p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>
          We may modify these Terms at any time by posting the updated version on this page.
          Material changes will be indicated by updating the &quot;Last updated&quot; date. Your
          continued use of our services after changes take effect constitutes acceptance of
          the revised Terms.
        </p>
      </Section>

      <Section title="13. Contact Us">
        <p>
          For questions about these Terms, please contact us at:
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
