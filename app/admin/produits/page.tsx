import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { listAllProducts } from "@/lib/queries/admin";
import { formatFcfa } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/admin-search";
import { Pagination } from "@/components/ui/pagination";
import { ProductActiveToggle } from "@/components/admin/admin-actions";
import type { AdminProductRow } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };
const PAGE_SIZE = 25;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  let products: AdminProductRow[] = [];
  let total = 0;
  try {
    const res = await listAllProducts({ q, page, pageSize: PAGE_SIZE });
    products = res.products;
    total = res.total;
  } catch {
    products = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produits</h1>
        <AdminSearch placeholder="Nom du produit..." />
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {p.image_url ? (
                <Image src={p.image_url} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFcfa(p.price)} - Stock {p.stock}
              </p>
              <Link
                href={`/boutique/${p.vendor_id}`}
                className="text-xs text-primary hover:underline"
                target="_blank"
              >
                {p.shop_name}
              </Link>
            </div>
            <div className="flex flex-col items-end gap-2">
              {p.is_active ? (
                <Badge variant="success">Visible</Badge>
              ) : (
                <Badge variant="secondary">Masque</Badge>
              )}
              <ProductActiveToggle id={p.id} active={p.is_active} />
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Aucun produit trouve.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} />
    </div>
  );
}
