import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, selectCartSubtotal } from "@/lib/cart-store";
import { formatPKR } from "@/lib/currency";

export function CartDrawer() {
  const { items, isOpen, close, updateQty, remove } = useCart();
  const subtotal = useCart(selectCartSubtotal);
  const freeShipThreshold = 10000;
  const remaining = Math.max(0, freeShipThreshold - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white text-black flex flex-col"
          >
            <header className="flex items-center justify-between px-6 h-[72px] border-b">
              <h2 className="eyebrow">Your Bag ({items.length})</h2>
              <button onClick={close} aria-label="Close"><X size={20} /></button>
            </header>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <p className="font-display text-2xl mb-2">Your bag is empty.</p>
                <p className="text-sm text-muted-foreground mb-8">Begin with a piece worth keeping.</p>
                <Link to="/shop" onClick={close} className="h-11 px-8 inline-flex items-center bg-black text-white eyebrow rounded-[4px]">
                  Shop All
                </Link>
              </div>
            ) : (
              <>
                {remaining > 0 ? (
                  <p className="px-6 py-3 text-xs text-center text-muted-foreground border-b">
                    Spend <strong>{formatPKR(remaining)}</strong> more for free shipping
                  </p>
                ) : (
                  <p className="px-6 py-3 text-xs text-center bg-black text-white">
                    You've earned free shipping
                  </p>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-surface" />
                      <div className="flex-1 min-w-0">
                        <Link to="/product/$slug" params={{ slug: item.slug }} onClick={close} className="font-display text-base block truncate">
                          {item.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">Size {item.size}</div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center" aria-label="Decrease">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center" aria-label="Increase">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-medium">{formatPKR(item.price * item.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => remove(item.id)} aria-label="Remove" className="text-muted-foreground hover:text-black">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <footer className="border-t px-6 py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow">Subtotal</span>
                    <span className="font-display text-xl">{formatPKR(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shipping &amp; taxes calculated at checkout.</p>
                  <Link to="/checkout" onClick={close} className="block w-full h-11 bg-black text-white eyebrow rounded-[4px] flex items-center justify-center">
                    Proceed To Checkout
                  </Link>
                  <button onClick={close} className="block w-full text-center text-xs underline underline-offset-4">
                    Continue Shopping
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
