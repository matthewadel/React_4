import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! as string);
const resend = new Resend(process.env.RESEND_API_KEY!);
export async function POST(request: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get("Stripe-Signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "charge.succeeded") {
    const charge = event.data.object;
    const productId = charge.metadata.productId;
    const email = charge.billing_details.email;
    const pricePaidInCents = charge.amount;

    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product || !email)
      return new NextResponse("Bad Request", { status: 400 });

    const userFields = {
      email,
      orders: { create: { productId, pricePaidInCents } },
    };
    const {
      orders: [order],
    } = await db.user.upsert({
      where: { email },
      create: userFields,
      update: userFields,
      select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const DownloadVerification = await db.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await resend.emails.send({
      from: "m@yahoo.com",
      to: email,
      subject: `Your ${product.name} download link`,
      react: <h1>Hi</h1>,
    });

    return new NextResponse();
  }
}
