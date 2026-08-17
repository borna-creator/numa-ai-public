import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import supertokens from 'supertokens-node'
import { middleware, errorHandler } from 'supertokens-node/framework/express/index.js'
import { initSuperTokens } from './supertokens.js'
import { seedSupremeAdmin } from './services/users.js'
import meRouter from './routes/me.js'
import organizationsRouter from './routes/organizations.js'
import departmentsRouter from './routes/departments.js'
import usersRouter from './routes/users.js'

initSuperTokens()

const app = express()
const PORT = process.env.API_PORT || 3001
const websiteDomain = process.env.WEBSITE_DOMAIN || 'http://localhost:5173'

app.use(
  cors({
    origin: websiteDomain,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  }),
)

app.use(express.json())
app.use(middleware())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/me', meRouter)
app.use('/api/organizations', organizationsRouter)
app.use('/api/organizations/:orgId/departments', departmentsRouter)
app.use('/api/organizations/:orgId/users', usersRouter)

app.use(errorHandler())

async function start() {
  await seedSupremeAdmin()

  app.listen(PORT, () => {
    console.log(`✓ API running on http://localhost:${PORT}`)
    console.log(`✓ SuperTokens auth at http://localhost:${PORT}/auth`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
