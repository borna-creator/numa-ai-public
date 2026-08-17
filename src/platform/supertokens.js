import SuperTokens from 'supertokens-auth-react'
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword'
import Session from 'supertokens-auth-react/recipe/session'

const websiteDomain = import.meta.env.VITE_WEBSITE_DOMAIN || window.location.origin
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
