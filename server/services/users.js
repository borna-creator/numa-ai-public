import EmailPassword from 'supertokens-node/recipe/emailpassword/index.js'
import supertokens, { deleteUser as deleteSuperTokensUser } from 'supertokens-node'
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

  const superTokensUserId = await createAuthUser(email, password)

  const profileDefaults = {
    superTokensUserId,
    role: 'SUPER_ADMIN',
    fullName: 'Super Admin',
    jobTitle: 'Platform Administrator',
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    const needsSync =
      force ||
      existing.role !== 'SUPER_ADMIN' ||
      existing.superTokensUserId !== superTokensUserId

    if (needsSync) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...profileDefaults,
          fullName: existing.fullName || profileDefaults.fullName,
          jobTitle: existing.jobTitle || profileDefaults.jobTitle,
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
