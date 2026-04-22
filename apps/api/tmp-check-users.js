const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const p = new PrismaClient();

async function main() {
  const newPassword = 'Admin@1234';
  const hash = await argon2.hash(newPassword, { type: argon2.argon2id });

  // Reset password for the account tied to username PRGER179531 / phone 6360075529
  const user = await p.user.findFirst({
    where: { profile: { phonePrimary: { endsWith: '6360075529' } } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, username: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  await p.user.update({ where: { id: user.id }, data: { password: hash } });
  console.log(`Password reset to "${newPassword}" for:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Username: ${user.username}`);
  console.log(`\nYou can now login with:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Username: ${user.username}`);
  console.log(`  Phone:    6360075529`);
  console.log(`  Password: ${newPassword}`);
}

main().catch(console.error).finally(() => p.$disconnect());

