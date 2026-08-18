import fs from 'node:fs/promises'
import path from 'node:path'
import { createReadStream } from 'node:fs'

export const STORAGE_ROOT = path.resolve(
  process.env.CALL_STORAGE_PATH || path.join(process.cwd(), 'storage', 'calls'),
)

const UPLOAD_TMP = path.join(STORAGE_ROOT, '_uploads')

export async function ensureStorageRoot() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true })
  await fs.mkdir(UPLOAD_TMP, { recursive: true })
}

export function getUploadTmpDir() {
  return UPLOAD_TMP
}

export function getCallDir(orgId, callId) {
  return path.join(STORAGE_ROOT, orgId, callId)
}

export function resolveStoragePath(relativePath) {
  const absolute = path.resolve(STORAGE_ROOT, relativePath)
  if (!absolute.startsWith(STORAGE_ROOT)) {
    throw new Error('Invalid storage path')
  }
  return absolute
}

export async function finalizeCallUpload(orgId, callId, tmpPath, originalName) {
  const ext = path.extname(originalName) || '.audio'
  const callDir = getCallDir(orgId, callId)
  await fs.mkdir(callDir, { recursive: true })

  const filename = `original${ext.toLowerCase()}`
  const relativePath = path.join(orgId, callId, filename)
  const absolutePath = resolveStoragePath(relativePath)

  await fs.rename(tmpPath, absolutePath)
  return relativePath.replace(/\\/g, '/')
}

export async function deleteCallFiles(relativePath) {
  const absolutePath = resolveStoragePath(relativePath)
  const callDir = path.dirname(absolutePath)
  await fs.rm(callDir, { recursive: true, force: true })
}

export function createCallReadStream(relativePath) {
  return createReadStream(resolveStoragePath(relativePath))
}
