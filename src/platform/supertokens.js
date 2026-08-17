import SuperTokens from 'supertokens-auth-react'
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword'
import Session from 'supertokens-auth-react/recipe/session'

// Always match the browser URL in production (avoids http page → https API mismatch).
const websiteDomain =
  typeof window !== 'undefined'
    ? window.location.origin
    : import.meta.env.VITE_WEBSITE_DOMAIN || 'http://localhost:5173'
const apiDomain = import.meta.env.VITE_API_DOMAIN || websiteDomain

SuperTokens.init({
  appInfo: {
    appName: 'NumaIQ QA',
    apiDomain,
    websiteDomain,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init(),
    Session.init(),
  ],
})

export { Session, EmailPassword }
