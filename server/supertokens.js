import supertokens from 'supertokens-node'
import Session from 'supertokens-node/recipe/session/index.js'
import EmailPassword from 'supertokens-node/recipe/emailpassword/index.js'
import AccountLinking from 'supertokens-node/recipe/accountlinking/index.js'

export function initSuperTokens() {
  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567',
    },
    appInfo: {
      appName: 'NumaIQ QA',
      apiDomain: process.env.API_DOMAIN || process.env.WEBSITE_DOMAIN || 'http://localhost:5173',
      websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:5173',
      apiBasePath: '/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [{ id: 'email' }, { id: 'password' }],
        },
      }),
      AccountLinking.init({
        shouldDoAutomaticAccountLinking: async () => ({
          shouldAutomaticallyLink: true,
          shouldRequireVerification: false,
        }),
      }),
      Session.init(),
    ],
  })
}

export { supertokens, Session, EmailPassword, AccountLinking }
