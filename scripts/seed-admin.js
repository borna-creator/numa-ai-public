import 'dotenv/config'
import { prisma } from '../server/db.js'
import { seedSupremeAdmin } from '../server/services/users.js'
import { initSuperTokens } from '../server/supertokens.js'

initSuperTokens()

async function main() {
  await seedSupremeAdmin({ force: true })
}

main()
  .catch((err) => {
    console.error('Failed to seed supreme admin:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
