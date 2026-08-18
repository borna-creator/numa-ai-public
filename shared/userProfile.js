export function parseRequiredUserProfile(fullName, jobTitle) {
  const name = fullName?.trim()
  const title = jobTitle?.trim()

  if (!name) {
    throw new Error('Full name is required')
  }
  if (!title) {
    throw new Error('Role is required')
  }

  return { fullName: name, jobTitle: title }
}

export function parseOptionalUserProfile({ fullName, jobTitle }) {
  const data = {}

  if (fullName !== undefined) {
    const name = fullName?.trim()
    if (!name) {
      throw new Error('Full name cannot be empty')
    }
    data.fullName = name
  }

  if (jobTitle !== undefined) {
    const title = jobTitle?.trim()
    if (!title) {
      throw new Error('Role cannot be empty')
    }
    data.jobTitle = title
  }

  return data
}

export function getUserDisplayName(user) {
  if (!user) return '—'
  return user.fullName?.trim() || user.email || '—'
}

export function formatUserWithRole(user) {
  const name = getUserDisplayName(user)
  if (user?.jobTitle?.trim()) {
    return `${name} · ${user.jobTitle.trim()}`
  }
  return name
}
