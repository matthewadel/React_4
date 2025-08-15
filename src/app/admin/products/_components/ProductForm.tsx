"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import { useActionState, useState } from "react";
import { addProduct, updateProduct } from "@/app/admin/_actions/products";
import { useFormStatus } from "react-dom";
import { Product } from "@/generated/prisma";
import Image from "next/image";

export function ProductForm({ product }: { product?: Product | null }) {
  const [error, action] = useActionState(
    !product ? addProduct : updateProduct.bind(null, product.id),
    null
  );
  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents
  );

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product?.name || ""}
        />
        {error?.properties?.name && (
          <div className="text-destructive">
            {error.properties.name.errors.join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceInCents">Price In Cents</Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents}
          defaultValue={product?.priceInCents || ""}
          onChange={(e) => setPriceInCents(Number(e.target.value))}
        />
        <div className="text-muted-foreground">
          {formatCurrency(priceInCents || 0 / 100)}
        </div>
        {error?.properties?.priceInCents && (
          <div className="text-destructive">
            {error.properties.priceInCents.errors.join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={product?.description || ""}
        />
        {error?.properties?.description && (
          <div className="text-destructive">
            {error.properties.description.errors.join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label htmlFor="file">FIle</Label>
        <input type="file" id="file" name="file" required={!product} />
        {!!product && (
          <div className="text-muted-foreground">{product?.filePath}</div>
        )}
        {error?.properties?.file && (
          <div className="text-destructive">
            {error.properties.file.errors.join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label htmlFor="image">Image</Label>
        <input type="file" id="image" name="image" required={!product} />
        {!!product && (
          <Image
            height="400"
            width="400"
            alt="product image"
            src={product?.imagePath || ""}
          />
        )}
        {error?.properties?.image && (
          <div className="text-destructive">
            {error.properties.image.errors.join(", ")}
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
