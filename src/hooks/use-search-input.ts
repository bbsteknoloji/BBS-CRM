"use client";

/**
 * Canlı arama için ortak hook.
 *
 * Özellikler:
 * - onChange ile çalışır (Enter gerekmez)
 * - 300 ms debounce (gereksiz request önler)
 * - Türkçe karakter normalleştirme (ş→s, ı→i, ğ→g, ü→u, ö→o, ç→c)
 * - Büyük/küçük harf duyarsız (toLowerCase)
 * - URL searchParams üzerinden çalışır (server-side filtreleme korunur)
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeSearch } from "@/lib/utils/normalize-search";

export function useSearchInput(basePath: string, debounceMs = 300) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Gösterilen değer (kullanıcının yazdığı — normalize edilmemiş)
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // searchParams ref — debounce closure'ında güncel değer için
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  // Dışarıdan URL değişirse (temizle butonu vb.) inputu senkronize et
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setValue(raw); // anında input güncellenir

      // Önceki timer'ı iptal et
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        params.delete("cursor"); // pagination sıfırla

        const normalized = normalizeSearch(raw.trim());
        if (normalized) {
          params.set("q", normalized);
        } else {
          params.delete("q");
        }

        startTransition(() => {
          router.push(`${basePath}?${params.toString()}`);
        });
      }, debounceMs);
    },
    [basePath, debounceMs, router, startTransition]
  );

  // Unmount'ta timer temizle
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { value, onChange: handleChange };
}
