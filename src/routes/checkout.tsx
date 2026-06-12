import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-store";
import { formatPKR } from "@/lib/currency";
import { Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.remove);
  const updateQty = useCart((s) => s.updateQuantity);
  const clearCart = useCart((s) => s.clear);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 10000 ? 0 : 350;
  const total = subtotal + shipping;

  async function handlePlaceOrder() {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          email: user?.email || "guest@example.com",
          subtotal,
          shipping,
          total,
          shipping_address: {
            city: "Karachi",
            country: "Pakistan",
          },
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_slug: item.slug,
        product_image: item.image,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      alert("Order placed successfully!");
    } catch (err: any) {
      console.error("Order error:", err);
      alert("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="font-display text-[32px] lg:text-[40px] mb-8">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Link to="/shop" className="text-sm underline mt-4 inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-border rounded-[4px]"
                >
                  <div className="w-20 h-24 bg-surface shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      Size: {item.size}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-surface"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-surface"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-black"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPKR(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="border border-border rounded-[4px] p-6">
                <h2 className="eyebrow mb-6">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders over Rs10,000
                    </p>
                  )}
                  <div className="border-t pt-3 flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatPKR(total)}</span>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full mt-6 h-11 bg-black text-white eyebrow rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
                <Link
                  to="/shop"
                  className="block text-center text-sm underline mt-4 hover:opacity-70"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
