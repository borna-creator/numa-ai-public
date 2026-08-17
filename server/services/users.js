import EmailPassword from 'supertokens-node/recipe/emailpassword/index.js'
import { prisma } from '../db.js'

export async function createAuthUser(email, password) {
  const response = await EmailPassword.signUp('public', email, password)

  if (response.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
    const existing = await EmailPassword.getUserByEmail('public', email)
    if (!existing) throw new Error('Email already exists but user not found')
    return existing.id
  }

  if (response.status !== 'OK') {
    throw new Error(`SuperTokens signUp failed: ${response.status}`)
  }

  return response.user.id
}

export async function seedSupremeAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('⚠ SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping seed')
    return
  }

  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (existing) {
    console.log('✓ Supreme admin already exists:', existing.email)
    return
  }

  const superTokensUserId = await createAuthUser(email, password)

  await prisma.user.create({
    data: {
      email,
      superTokensUserId,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✓ Supreme admin created:', email)
}

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
