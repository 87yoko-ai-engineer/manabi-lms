// 動作確認用: 佐藤(u-1)の完了記録を表示
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const rows = await p.unitProgress.findMany({
    where: { userId: "u-1" },
    select: { unitId: true, completedAt: true },
    orderBy: { unitId: "asc" },
  });
  console.log(JSON.stringify(rows, null, 1));
}

main().finally(() => p.$disconnect());
