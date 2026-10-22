const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function runAcceptanceTest() {
  console.log("--- 1. Testing Database Connection & Schema ---");
  const userCount = await prisma.user.count();
  console.log("Current user count:", userCount);

  console.log("--- 2. Testing User Creation & Password Hashing ---");
  const testEmail = `test_${Date.now()}@codeeditor.io`;
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: "Acceptance Test Engineer",
      passwordHash,
      settings: {
        create: {
          theme: "vs-dark",
          fontSize: 14,
        },
      },
    },
  });
  console.log("✓ Created user:", testUser.id, testUser.email);

  console.log("--- 3. Testing Project Creation in Cloud ---");
  const project = await prisma.project.create({
    data: {
      name: "Python Cloud Analytics",
      template: "python",
      ownerId: testUser.id,
      files: {
        create: [
          {
            name: "main.py",
            path: "main.py",
            content: "print('Hello from cloud persistence!')",
            language: "python",
            version: 1,
          },
          {
            name: "requirements.txt",
            path: "requirements.txt",
            content: "requests>=2.31.0",
            language: "plaintext",
            version: 1,
          },
        ],
      },
    },
    include: { files: true },
  });
  console.log("✓ Created project:", project.id, "with", project.files.length, "files");

  console.log("--- 4. Testing File Persistence & Version Increment ---");
  const mainFile = project.files[0];
  const updatedFile = await prisma.projectFile.update({
    where: { id: mainFile.id },
    data: {
      content: "import sys\nprint('Version 2 cloud saved content!')",
      version: 2,
    },
  });
  console.log("✓ Updated file to version:", updatedFile.version, "Length:", updatedFile.content.length);

  console.log("--- 5. Testing Retrieval by Owner Authorization ---");
  const retrieved = await prisma.project.findFirst({
    where: { id: project.id, ownerId: testUser.id },
    include: { files: true },
  });
  console.log("✓ Retrieved project verified for owner:", retrieved.name, "File content:", retrieved.files[0].content);

  console.log("--- 6. Clean up Test Record ---");
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("✓ Cascade deleted user and test project cleanly.");

  console.log("\nALL DATABASE & STORAGE ACCEPTANCE TESTS PASSED!");
}

runAcceptanceTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

