Seed（种子）用来**初始化数据库数据**。

Seed 脚本放在 `prisma/` 目录下：

```text
prisma/
├── schema.prisma
└── seed.ts
```

`prisma/seed.ts` 示例如下：

```ts title="prisma/seed.ts"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "admin",
      email: "admin@test.com",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

配置 `package.json`：

```json title="package.json"
{
  "scripts": {
    "prisma:seed": "tsx prisma/seed.ts"
  }
}
```

运行 Seed：

```sh
pnpm prisma:seed
```
