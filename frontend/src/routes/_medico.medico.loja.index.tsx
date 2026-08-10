import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShoppingCart, Search, X, Plus, Minus, MessageCircle, Package } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { cn } from "../lib/cn";
import { apiListCatalogItems, type CatalogItemResponse } from "../lib/api/catalog";
import { apiCreateOrder } from "../lib/api/orders";

export const Route = createFileRoute("/_medico/medico/loja/")({
  component: LojaPage,
});

type CartLine = { item: CatalogItemResponse; qty: number };

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

function Banner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-navy-deep via-brand-navy to-black px-8 py-12 text-center sm:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-bg" />
      <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-accent">America Anatomy Institute</p>
      <h1 className="relative mt-3 font-display text-3xl text-brand-white sm:text-4xl">Loja exclusiva para médicos</h1>
      <p className="relative mx-auto mt-3 max-w-lg text-sm text-fg-muted">
        Peças anatômicas de alta fidelidade, direto para o seu consultório.
      </p>
    </div>
  );
}

function ProductCard({ item, onAdd, onOpen }: { item: CatalogItemResponse; onAdd: () => void; onOpen: () => void }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface-1 transition-shadow hover:shadow-[var(--shadow-pop)]">
      <button
        onClick={onOpen}
        className="relative flex h-40 items-center justify-center border-b border-line bg-surface-2"
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain p-3" />
        ) : (
          <Package size={32} className="text-fg-muted" strokeWidth={1.5} />
        )}
        {item.category && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-fg">
            {item.category}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <button onClick={onOpen} className="text-left text-sm font-medium leading-snug text-fg hover:text-accent">
          {item.title}
        </button>
        {item.description && <p className="line-clamp-2 flex-1 text-xs text-fg-muted">{item.description}</p>}
        <div className="mt-2 border-t border-line pt-3">
          <p className="mb-2 text-center font-display text-lg text-fg">{formatPrice(item.price)}</p>
          <Button size="sm" className="w-full" onClick={onAdd}>
            + Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ item, onClose, onAdd }: { item: CatalogItemResponse; onClose: () => void; onAdd: () => void }) {
  return (
    <div className="fixed inset-0 z-[600] overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-line-strong bg-popover shadow-[var(--shadow-pop)]">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-muted hover:text-fg"
        >
          <X size={16} />
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="flex items-center justify-center border-b border-line bg-surface-2 p-8 sm:border-b-0 sm:border-r">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="max-h-64 object-contain" />
            ) : (
              <Package size={48} className="text-fg-muted" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col p-6">
            {item.category && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">{item.category}</p>}
            <h2 className="font-display text-xl text-fg">{item.title}</h2>
            {item.description && <p className="mt-2 flex-1 text-sm text-fg-muted">{item.description}</p>}
            <div className="mt-auto space-y-3 border-t border-line pt-4">
              <p className="font-display text-2xl text-fg">{formatPrice(item.price)}</p>
              <Button
                className="w-full"
                onClick={() => {
                  onAdd();
                  onClose();
                }}
              >
                + Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  cart,
  onClose,
  onChangeQty,
  onCheckout,
  checkingOut,
}: {
  cart: CartLine[];
  onClose: () => void;
  onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  checkingOut: boolean;
}) {
  const total = cart.reduce((sum, line) => sum + Number(line.item.price ?? 0) * line.qty, 0);

  return (
    <div className="fixed inset-0 z-[600]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col border-l border-line-strong bg-popover shadow-[var(--shadow-pop)]">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <p className="flex items-center gap-2 font-display text-lg text-fg">
            <ShoppingCart size={18} /> Carrinho ({cart.reduce((s, l) => s + l.qty, 0)})
          </p>
          <button onClick={onClose} className="text-fg-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-fg-muted">
            <ShoppingCart size={40} strokeWidth={1.5} />
            <p className="text-sm">Carrinho vazio. Adicione produtos para continuar.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.map((line) => (
                <div key={line.item.id} className="flex items-center gap-3 border-b border-line pb-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-2">
                    {line.item.imageUrl ? (
                      <img src={line.item.imageUrl} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Package size={18} className="text-fg-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-fg">{line.item.title}</p>
                    <p className="text-sm font-semibold text-fg">{formatPrice(String(Number(line.item.price ?? 0) * line.qty))}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => onChangeQty(line.item.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-fg-muted hover:text-fg"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center text-xs font-medium text-fg">{line.qty}</span>
                    <button
                      onClick={() => onChangeQty(line.item.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-fg-muted hover:text-fg"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between font-display text-lg text-fg">
                <span>Total</span>
                <span>{formatPrice(String(total))}</span>
              </div>
              <Button
                className="w-full"
                leftIcon={<MessageCircle size={14} />}
                loading={checkingOut}
                onClick={onCheckout}
              >
                Finalizar via WhatsApp
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LojaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<CatalogItemResponse | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiListCatalogItems(),
  });

  const products = useMemo(() => items.filter((i) => i.type === "PRODUCT"), [items]);
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!term) return true;
      return p.title.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term);
    });
  }, [products, search, category]);

  function addToCart(item: CatalogItemResponse) {
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty ?? 0) + 1 },
    }));
    toast({ kind: "success", title: `${item.title} adicionado ao carrinho` });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const line = prev[id];
      if (!line) return prev;
      const nextQty = line.qty + delta;
      if (nextQty <= 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...line, qty: nextQty } };
    });
  }

  const cartLines = Object.values(cart);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      for (const line of cartLines) {
        await apiCreateOrder(line.item.id, line.qty);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });

      const linhas = cartLines
        .map((l) => `🧪 ${l.item.title} — ${formatPrice(l.item.price)} (x${l.qty})`)
        .join("\n");
      const total = cartLines.reduce((s, l) => s + Number(l.item.price ?? 0) * l.qty, 0);
      const msg = `Olá! Gostaria de confirmar meu pedido na America Anatomy Institute:\n\n${linhas}\n\nTotal: ${formatPrice(String(total))}\n\nMédico: ${user?.name ?? ""}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");

      setCart({});
      setCartOpen(false);
      toast({ kind: "success", title: "Pedido confirmado", description: "Você pode acompanhar em Meus Pedidos." });
    },
    onError: (err) => toast({ kind: "error", title: "Erro ao finalizar pedido", description: (err as Error).message }),
  });

  return (
    <PageContainer className="max-w-none">
      <Banner />

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="h-10 w-full rounded-lg border border-line bg-surface-1 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent/60 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex h-10 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:brightness-95"
        >
          <ShoppingCart size={16} /> Carrinho
          {cartLines.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-white px-1 text-[11px] font-bold text-brand-navy">
              {cartLines.reduce((s, l) => s + l.qty, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !category ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === cat ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} onAdd={() => addToCart(item)} onOpen={() => setDetailItem(item)} />
          ))}
        </div>
      )}

      {detailItem && (
        <ProductModal item={detailItem} onClose={() => setDetailItem(null)} onAdd={() => addToCart(detailItem)} />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cartLines}
          onClose={() => setCartOpen(false)}
          onChangeQty={changeQty}
          onCheckout={() => checkoutMutation.mutate()}
          checkingOut={checkoutMutation.isPending}
        />
      )}
    </PageContainer>
  );
}
