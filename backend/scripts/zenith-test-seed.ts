// Creates the "Zenith Testing" sandbox org and its five logins. NON-DESTRUCTIVE: every write is an
// upsert keyed by email or org name, so existing organisations, users and data are left untouched.
// Safe to run repeatedly.
//   npm run zenith:seed        (local)   /   npm run zenith:seed:prod   (built, on the server)
//
// The four role accounts are reachable by the right-edge quick-switch (TEST_SWITCH=true) and by normal
// login. The Super Admin is reachable by NORMAL LOGIN ONLY — it is never in the quick-switch, because a
// platform admin can see every customer org. These passwords are fixed on purpose (sandbox test org).
import { hashPassword } from '../src/auth/crypto.js'
import { getPrisma } from '../src/config/database.js'
import { ZENITH_ORG_NAME, ZENITH_ROLES } from '../src/controllers/test-switch.controller.js'

const SUPER = { email: 'superadmin@zenithtesting.in', name: 'Zenith Super Admin', password: '2GEb4457mkYcQy' }
const PASSWORDS: Record<string, string> = {
  'tenant@zenithtesting.in': 'Hc7t6iSZQM2YKX',
  'dataentry@zenithtesting.in': 'P4eXgPcfvEASjo',
  'reviewer@zenithtesting.in': 'qFmisKEn7vboVB',
  'verifier@zenithtesting.in': 'YvazxWtzFRtpgS',
}

const db = getPrisma()
const upsertUser = async (email: string, name: string, password: string, platformRole: 'SUPER_ADMIN' | null) => {
  const data = { name, platformRole, isActive: true, mustChangePassword: false, mfaEnabled: false, mfaSecret: null, mfaLastStep: null, failedLoginCount: 0, lockedUntil: null }
  return db.user.upsert({ where: { email }, update: data, create: { email, passwordHash: await hashPassword(password), ...data } })
}

const org = await db.organization.findFirst({ where: { name: ZENITH_ORG_NAME } })
  ?? await db.organization.create({ data: { name: ZENITH_ORG_NAME, legalName: 'Zenith Testing', country: 'India', subscription: { create: { planName: 'Testing', status: 'ACTIVE', startDate: new Date() } } } })

await upsertUser(SUPER.email, SUPER.name, SUPER.password, 'SUPER_ADMIN')

// Super Admin is created above; the loop handles the four org-membership roles only.
for (const a of ZENITH_ROLES.filter((r) => r.id !== 'super')) {
  const user = await upsertUser(a.email, `Zenith ${a.label}`, PASSWORDS[a.email], null)
  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: a.role },
    create: { userId: user.id, organizationId: org.id, role: a.role },
  })
}

console.log(`Zenith Testing ready: ${ZENITH_ROLES.map((a) => a.role).join(', ')} + Super Admin (normal login only).`)
await db.$disconnect()
