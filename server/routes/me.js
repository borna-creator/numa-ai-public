import { Router } from 'express'
import { requireSession, loadAppUser } from '../middleware/auth.js'

const router = Router()

router.get('/', requireSession, loadAppUser, (req, res) => {
  const { id, email, fullName, jobTitle, role, organizationId, departmentId, organization, department } =
    req.appUser
  res.json({
    user: {
      id,
      email,
      fullName,
      jobTitle,
      role,
      organizationId,
      departmentId,
      organization: organization ? { id: organization.id, name: organization.name, slug: organization.slug } : null,
      department: department ? { id: department.id, name: department.name } : null,
    },
  })
})

export default router
