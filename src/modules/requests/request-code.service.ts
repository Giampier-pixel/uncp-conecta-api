import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class RequestCodeService {
  async next(tx: Prisma.TransactionClient): Promise<string> {
    const rows = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('request_code_seq') AS nextval`;
    const correlativo = String(Number(rows[0].nextval)).padStart(5, '0');
    return `UNCP${correlativo}`;
  }
}
