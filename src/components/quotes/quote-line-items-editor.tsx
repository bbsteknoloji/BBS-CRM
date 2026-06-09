"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Search, X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTotals } from "@/lib/quotes/calculations";
import { currencySymbol } from "@/lib/utils/currency-format";
import type { QuoteFormInput } from "@/lib/validations/quote";

export type ProductOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  type?: string;
};

type Line = QuoteFormInput["lineItems"][number];

const emptyLine = (): Line => ({
  productId: "",
  productCode: "",
  description: "",
  quantity: 1,
  unit: "adet",
  unitPrice: 0,
  taxRate: 20,
});

const TYPE_LABELS: Record<string, string> = {
  PRODUCT: "Ürünler",
  SERVICE: "Hizmetler",
};

// ─── Portal Dropdown ──────────────────────────────────────────────────────────
// Dropdown'ı body'e mount ederek overflow/z-index sorunlarını çözer.

function useDropdownPosition(
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  open: boolean
) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const update = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: r.width,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return pos;
}

// ─── Arama Combobox ───────────────────────────────────────────────────────────
function ProductCombobox({
  products,
  selectedId,
  onSelect,
}: {
  products: ProductOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pos = useDropdownPosition(triggerRef, open);
  const selected = products.find((p) => p.id === selectedId);

  // Düz filtrelenmiş liste (klavye gezintisi için)
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [products, query]);

  // Gruplu liste (görünüm için)
  const grouped = useMemo(() => {
    const map = new Map<string, ProductOption[]>();
    for (const p of filtered) {
      const key = p.type ?? "DİĞER";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filtered]);

  // Dışa tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Açılınca search'e fokus
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30);
      setActiveIndex(-1);
    }
  }, [open]);

  // Aktif öğeyi görünüre getir
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleOpen() {
    setOpen((v) => !v);
    setQuery("");
  }

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect("");
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) handleSelect(item.id);
    }
  }

  // Satır numarası (gruplar içindeki global sıra)
  function globalIdx(type: string, localIdx: number) {
    let offset = 0;
    for (const [k, v] of grouped) {
      if (k === type) return offset + localIdx;
      offset += v.length;
    }
    return localIdx;
  }

  return (
    <div className="relative w-full">
      {/* Tetikleyici */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
      >
        <span className="flex-1 truncate text-left">
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {selected.sku}
              </span>
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Ürün seç veya ara…</span>
          )}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Temizle"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown — React Portal ile body'e mount edilir, tamamen opak */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: Math.max(pos.width, 340),
            zIndex: 9999,
            backgroundColor: "hsl(var(--card))",
          }}
          className="rounded-md border border-border shadow-2xl flex flex-col"
          onKeyDown={handleKeyDown}
        >
          {/* Arama satırı */}
          <div className="flex items-center gap-2 border-b bg-card px-3 py-2 shrink-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              placeholder="SKU veya ürün adı…"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => { setQuery(""); setActiveIndex(-1); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              {filtered.length} / {products.length}
            </span>
          </div>

          {/* Liste */}
          <div ref={listRef} className="overflow-y-auto bg-card" style={{ maxHeight: 288 }}>
            {/* Manuel ekle */}
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${!selectedId ? "bg-accent/60" : ""}`}
            >
              <span className="text-muted-foreground italic">— Manuel ekle</span>
              {!selectedId && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                <span className="font-medium">&ldquo;{query}&rdquo;</span> için sonuç bulunamadı
              </p>
            ) : (
              Array.from(grouped.entries()).map(([type, items]) => (
                <div key={type}>
                  {/* Grup başlığı */}
                  <div className="sticky top-0 bg-muted px-3 py-1 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABELS[type] ?? type}
                    </span>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>

                  {/* Ürün satırları */}
                  {items.map((p, localI) => {
                    const idx = globalIdx(type, localI);
                    const isActive = activeIndex === idx;
                    const isSelected = p.id === selectedId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-idx={idx}
                        onClick={() => handleSelect(p.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left
                          ${isActive ? "bg-accent" : "hover:bg-accent/60"}
                          ${isSelected ? "font-medium" : ""}`}
                      >
                        {/* SKU */}
                        <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 truncate">
                          {p.sku}
                        </span>
                        {/* Ürün adı */}
                        <span className="flex-1 truncate min-w-0">{p.name}</span>
                        {/* Fiyat */}
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {Number(p.unitPrice).toLocaleString("tr-TR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Ana editor ──────────────────────────────────────────────────────────────
type Props = {
  initialItems?: Line[];
  products: ProductOption[];
  currency: string;
};

export function QuoteLineItemsEditor({ initialItems, products, currency }: Props) {
  const [lines, setLines] = useState<Line[]>(
    initialItems?.length ? initialItems : [emptyLine()]
  );

  const totals = useMemo(
    () =>
      calculateTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
        }))
      ),
    [lines]
  );

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  }

  function handleProductSelect(productId: string, index: number) {
    if (!productId) {
      updateLine(index, { productId: "" });
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(index, {
      productId: p.id,
      productCode: p.sku,
      description: p.name,
      unit: p.unit,
      unitPrice: Number(p.unitPrice),
      taxRate: Number(p.taxRate),
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="lineItems"
        value={JSON.stringify(lines)}
        readOnly
      />

      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-12"
          >
            {/* Katalog arama */}
            <div className="sm:col-span-6">
              <label className="block text-xs text-muted-foreground mb-1">
                Katalogdan seç ({products.length} ürün)
              </label>
              <ProductCombobox
                products={products}
                selectedId={line.productId ?? ""}
                onSelect={(id) => handleProductSelect(id, index)}
              />
            </div>

            {/* Ürün kodu */}
            <div className="sm:col-span-6">
              <label className="block text-xs text-muted-foreground mb-1">
                Ürün kodu
              </label>
              <Input
                value={line.productCode ?? ""}
                placeholder="Örn: UPS-10KVA"
                onChange={(e) =>
                  updateLine(index, {
                    productCode: e.target.value,
                    productId: "",
                  })
                }
              />
            </div>

            {/* Açıklama */}
            <div className="sm:col-span-4">
              <label className="block text-xs text-muted-foreground mb-1">
                Açıklama *
              </label>
              <Input
                value={line.description}
                required
                onChange={(e) =>
                  updateLine(index, { description: e.target.value })
                }
              />
            </div>

            {/* Miktar */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">
                Miktar
              </label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                required
                value={line.quantity}
                onChange={(e) => {
                  const next = parseFloat(e.target.value);
                  updateLine(index, {
                    quantity: Number.isFinite(next) && next > 0 ? next : 1,
                  });
                }}
              />
            </div>

            {/* Birim */}
            <div className="sm:col-span-1">
              <label className="block text-xs text-muted-foreground mb-1">
                Birim
              </label>
              <Input
                value={line.unit}
                onChange={(e) => updateLine(index, { unit: e.target.value })}
              />
            </div>

            {/* Birim fiyat */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">
                Birim fiyat
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) =>
                  updateLine(index, {
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* KDV */}
            <div className="sm:col-span-1">
              <label className="block text-xs text-muted-foreground mb-1">
                KDV %
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={line.taxRate}
                onChange={(e) =>
                  updateLine(index, {
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Satır toplam + sil */}
            <div className="flex items-end justify-between sm:col-span-2">
              <div>
                <p className="text-xs text-muted-foreground">Satır toplam</p>
                <p className="font-medium tabular-nums">
                  {totals.lines[index]?.lineTotal.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {currencySymbol(currency)}
                </p>
              </div>
              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setLines((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Kalem ekle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLines((prev) => [...prev, emptyLine()])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Kalem ekle
      </Button>

      {/* Toplamlar */}
      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ara toplam</span>
          <span className="tabular-nums font-medium">
            {totals.subtotal.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currencySymbol(currency)}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-muted-foreground">KDV toplam</span>
          <span className="tabular-nums">
            {totals.taxTotal.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currencySymbol(currency)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
          <span>Genel toplam</span>
          <span className="tabular-nums">
            {totals.total.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {currencySymbol(currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
