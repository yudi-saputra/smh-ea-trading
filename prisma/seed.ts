import "dotenv/config";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@smh.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me";

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
        displayName: "Super Admin",
      },
      create: {
        email,
        passwordHash,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        displayName: "Super Admin",
      },
    });

    console.log(`Seeded SUPER_ADMIN: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
