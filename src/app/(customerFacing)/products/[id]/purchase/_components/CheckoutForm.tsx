"use client";

import { checkIfrderExists } from "@/app/_actions/order";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Product } from "@/generated/prisma";
import { formatCurrency } from "@/lib/formatters";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useState } from "react";

type CheckoutFormProps = {
  product: Product;
  clientSecret: string;
};

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);
export function CheckoutForm({ product, clientSecret }: CheckoutFormProps) {
  return (
    <div className="max-w-5xl w-full mx-auto pace-y-8">
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image
            className="object-cover"
            src={product.imagePath}
            alt={product.name}
            fill
          />
        </div>
        <div>
          <div className="text-lg">
            {formatCurrency(product.priceInCents / 100)}
          </div>

          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product.description}
          </div>
        </div>
      </div>
      <Elements options={{ clientSecret }} stripe={stripe}>
        <Form priceInCents={product.priceInCents} productId={product.id} />
      </Elements>
    </div>
  );
}

function Form({
  priceInCents,
  productId,
}: {
  priceInCents: number;
  productId?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (stripe === null || elements === null || email == null) return;
    setLoading(true);

    const orderExist = await checkIfrderExists(email, productId);

    if (orderExist) {
      setErrorMessage(
        "You have already purchased this product, try downloading it from my orders page"
      );
      setLoading(false);
      return;
    }
    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/stripe/purchase-success`,
        },
      })
      .then(({ error }) => {
        if (error.type === "card_error" || error.type === "validation_error") {
          setErrorMessage(error.message);
        } else setErrorMessage("An unexpected error occured.");
      })
      .finally(() => setLoading(false));
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          {errorMessage && (
            <CardDescription className="text-destructive">
              {errorMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <div className="mt-4">
            <LinkAuthenticationElement
              onChange={(e) => setEmail(e.value.email)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={!stripe || !elements || loading}
          >
            {loading
              ? "purchasing ..."
              : `Purchase - ${formatCurrency(priceInCents / 100)}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
