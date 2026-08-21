import EmailPassword from 'supertokens-node/recipe/emailpassword/index.js'
import supertokens, { deleteUser as deleteSuperTokensUser } from 'supertokens-node'
import { prisma } from '../db.js'

/** Create a new auth login for org admins / users. Reuses auth only if the password matches. */
export async function createAuthUser(email, password) {
  const response = await EmailPassword.signUp('public', email, password)

  if (response.status === 'OK') {
    return response.user.id
  }

  if (response.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
    const signIn = await EmailPassword.signIn('public', email, password)
    if (signIn.status === 'OK') {
      // Auth account from a previous test — reuse when the password matches.
      return signIn.user.id
    }

    const err = new Error(
      `The email ${email} is already registered with a different password. Use a different email, or enter the password that was used when that login was first created.`,
    )
    err.code = 'AUTH_EMAIL_EXISTS'
    throw err
  }

  throw new Error(`SuperTokens signUp failed: ${response.status}`)
}

/** Seed-only helper — links env credentials to an existing SuperTokens login if needed. */
async function ensureSeedAuthUser(email, password) {
  const response = await EmailPassword.signUp('public', email, password)

  if (response.status === 'OK') {
    return response.user.id
  }

  if (response.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
    const signIn = await EmailPassword.signIn('public', email, password)
    if (signIn.status === 'OK') {
      return signIn.user.id
    }
    if (signIn.status === 'WRONG_CREDENTIALS_ERROR') {
      throw new Error(
        `Auth account exists for ${email} but SUPER_ADMIN_PASSWORD in .env does not match. Update .env or reset the SuperTokens database.`,
      )
    }
    throw new Error(`Could not resolve seed auth user (${signIn.status})`)
  }

  throw new Error(`SuperTokens signUp failed: ${response.status}`)
}

function getEmailPasswordLoginMethod(superTokensUserId) {
  return supertokens.getUser(superTokensUserId).then((user) => {
    if (!user) throw new Error('Auth user not found')
    const loginMethod = user.loginMethods.find((m) => m.recipeId === 'emailpassword')
    if (!loginMethod) throw new Error('Email/password login not found for user')
    return loginMethod
  })
}

export async function updateAuthUserPassword(superTokensUserId, newPassword) {
  const loginMethod = await getEmailPasswordLoginMethod(superTokensUserId)
  const result = await EmailPassword.updateEmailOrPassword({
    recipeUserId: loginMethod.recipeUserId,
    password: newPassword,
  })
  if (result.status === 'PASSWORD_POLICY_VIOLATED_ERROR') {
    throw new Error('Password does not meet policy requirements')
  }
  if (result.status !== 'OK') {
    throw new Error(`Password update failed: ${result.status}`)
  }
}

export async function updateAuthUserEmail(superTokensUserId, newEmail) {
  const loginMethod = await getEmailPasswordLoginMethod(superTokensUserId)
  const result = await EmailPassword.updateEmailOrPassword({
    recipeUserId: loginMethod.recipeUserId,
    email: newEmail,
  })
  if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
    const err = new Error('Email already in use')
    err.code = 'EMAIL_ALREADY_EXISTS'
    throw err
  }
  if (result.status !== 'OK') {
    throw new Error(`Email update failed: ${result.status}`)
  }
}

export async function deleteAuthUser(superTokensUserId) {
  await deleteSuperTokensUser(superTokensUserId, true)
}

export async function seedSupremeAdmin({ force = false } = {}) {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('⚠ SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping seed')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing?.superTokensUserId && force) {
    await updateAuthUserPassword(existing.superTokensUserId, password)
    console.log('✓ Supreme admin password updated from .env')
  }

  const superTokensUserId = await ensureSeedAuthUser(email, password)

  const profileDefaults = {
    superTokensUserId,
    role: 'SUPER_ADMIN',
    fullName: 'Super Admin',
    jobTitle: 'Platform Administrator',
  }

  const existingAfterAuth = await prisma.user.findUnique({ where: { email } })

  if (existingAfterAuth) {
    const needsSync =
      force ||
      existingAfterAuth.role !== 'SUPER_ADMIN' ||
      existingAfterAuth.superTokensUserId !== superTokensUserId

    if (needsSync) {
      await prisma.user.update({
        where: { id: existingAfterAuth.id },
        data: {
          ...profileDefaults,
          fullName: existingAfterAuth.fullName || profileDefaults.fullName,
          jobTitle: existingAfterAuth.jobTitle || profileDefaults.jobTitle,
        },
      })
      console.log('✓ Supreme admin profile synced:', email)
    } else {
      console.log('✓ Supreme admin already exists:', email)
    }
    return
  }

  const staleSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (staleSuperAdmin && staleSuperAdmin.email !== email) {
    console.warn(
      `⚠ Found super admin "${staleSuperAdmin.email}" but SUPER_ADMIN_EMAIL is "${email}". Creating profile for env email.`,
    )
  }

  await prisma.user.create({
    data: { email, ...profileDefaults },
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

export function isAuthProvisioningError(err) {
  if (err?.code === 'AUTH_EMAIL_EXISTS') {
    return true
  }

  const message = err?.message || ''
  return (
    message.includes('SUPER_ADMIN_PASSWORD') ||
    message.includes('already registered') ||
    message.includes('SuperTokens signUp failed') ||
    message.includes('Could not resolve seed auth user') ||
    message.includes('Initialisation not done') ||
    message.includes('AccountLinking')
  )
}
