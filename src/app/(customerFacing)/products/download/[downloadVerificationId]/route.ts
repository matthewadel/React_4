import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import db from "@/db/db";

export async function GET(
  req: NextRequest,
  {
    params: { downloadVerificationId },
  }: { params: { downloadVerificationId: string } }
) {
  const data = await db.downloadVerification.findUnique({
    where: { id: downloadVerificationId, expiresAt: { gt: new Date() } },
    select: { product: { select: { filePath: true, name: true } } },
  });

  if (!data)
    return NextResponse.redirect(
      new URL("/products/download/expired", req.url)
    );

  const product = data.product;
  const { size } = await fs.stat(product.filePath);
  const fileBuffer = await fs.readFile(product.filePath);
  const file = new Uint8Array(fileBuffer);
  const extension = product.filePath.split(".").pop();

  return new NextResponse(file, {
    headers: {
      "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
      "Content-Length": size.toString(),
    },
  });
}
