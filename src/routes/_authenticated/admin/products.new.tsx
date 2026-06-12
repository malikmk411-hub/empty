import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  head: () => ({ meta: [{ title: "New product — Admin" }] }),
  component: () => (
    <div className="space-y-8">
      <h1 className="font-display text-[40px] leading-none">New product</h1>
      <ProductForm />
    </div>
  ),
});
