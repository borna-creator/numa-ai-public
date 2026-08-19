import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import supertokens, { Error as SuperTokensError } from 'supertokens-node'
import { middleware, errorHandler } from 'supertokens-node/framework/express/index.js'
import { initSuperTokens } from './supertokens.js'
import { seedSupremeAdmin } from './services/users.js'
import internalRouter from './routes/internal.js'
import meRouter from './routes/me.js'
import organizationsRouter from './routes/organizations.js'
import departmentsRouter from './routes/departments.js'
import usersRouter from './routes/users.js'
import scorecardsRouter from './routes/scorecards.js'
import callsRouter from './routes/calls.js'
import orgUsageRouter from './routes/orgUsage.js'
import { sanitizeUserFacingError } from '../shared/userFacingErrors.js'
import { ensureStorageRoot } from './services/storage.js'
import { Router } from 'express'
import { requireSession, loadAppUser } from './middleware/auth.js'
import { attachMemberOrg } from './middleware/orgAccess.js'

initSuperTokens()

const app = express()
const PORT = process.env.API_PORT || 3001

function getAllowedOrigins() {
  const base = process.env.WEBSITE_DOMAIN || 'http://localhost:5173'
  const origins = new Set([base])

  try {
    const url = new URL(base)
    const bareHost = url.hostname.replace(/^www\./, '')
    const hosts = new Set([url.hostname, `www.${bareHost}`, bareHost])
    const schemes = url.protocol === 'https:' ? ['https:', 'http:'] : ['http:', 'https:']

    for (const scheme of schemes) {
      for (const host of hosts) {
        origins.add(`${scheme}//${host}`)
      }
    }
  } catch {
    // ignore invalid WEBSITE_DOMAIN
  }

  return [...origins]
}

const allowedOrigins = getAllowedOrigins()

app.set('trust proxy', 1)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || allowedOrigins[0])
      } else {
        callback(new Error(`Origin not allowed: ${origin}`))
      }
    },
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  }),
)

app.use('/api/internal', express.json({ limit: '15mb' }))
app.use(express.json({ limit: '1mb' }))
app.use(middleware())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/me', meRouter)
app.use('/api/internal', internalRouter)
app.use('/api/organizations/:orgId/departments', departmentsRouter)
app.use('/api/organizations/:orgId/users', usersRouter)
app.use('/api/organizations/:orgId/scorecards', scorecardsRouter)
app.use('/api/organizations/:orgId/calls', callsRouter)
app.use('/api/organizations', organizationsRouter)

const orgMemberRouter = Router()
orgMemberRouter.use(requireSession, loadAppUser, attachMemberOrg)
orgMemberRouter.use('/scorecards', scorecardsRouter)
orgMemberRouter.use('/calls', callsRouter)
orgMemberRouter.use('/departments', departmentsRouter)
orgMemberRouter.use('/users', usersRouter)
app.use('/api/org/usage', orgUsageRouter)
app.use('/api/org', orgMemberRouter)

app.use((err, req, res, next) => {
  if (req.path.startsWith('/auth') || SuperTokensError.isErrorFromSuperTokens(err)) {
    return next(err)
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'request entity too large' })
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files in one upload' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err?.message?.includes('Unsupported audio format')) {
    return res.status(400).json({ error: err.message })
  }
  if (!res.headersSent) {
    console.error('API error:', err)
    res.status(err.status || 500).json({
      error: sanitizeUserFacingError(err.message || 'Internal server error'),
    })
    return
  }
  next(err)
})

app.use(errorHandler())

async function start() {
  await ensureStorageRoot()

  try {
    await seedSupremeAdmin()
  } catch (err) {
    console.error('⚠ Supreme admin seed failed (SuperTokens may be down):', err.message)
  }

  app.listen(PORT, () => {
    console.log(`✓ API running on http://localhost:${PORT}`)
    console.log(`✓ SuperTokens auth at http://localhost:${PORT}/auth`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
