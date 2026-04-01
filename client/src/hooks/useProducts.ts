"use client";

import { useEffect, useState, useRef } from "react";
import { productsApi, categoriesApi } from "@/lib/api";
import { ApiProduct } from "@/lib/productUtils";

function sortProducts(products: ApiProduct[], sort: string): ApiProduct[] {
  const cloned = [...products];
  switch (sort) {
    case "asc":
      return cloned.sort((a, b) => {
        const pa = Math.min(...(a.variants || []).filter(v => v.isActive).map(v => Number(v.price)).filter(Boolean), Infinity);
        const pb = Math.min(...(b.variants || []).filter(v => v.isActive).map(v => Number(v.price)).filter(Boolean), Infinity);
        return pa - pb;
      });
    case "desc":
      return cloned.sort((a, b) => {
        const pa = Math.min(...(a.variants || []).filter(v => v.isActive).map(v => Number(v.price)).filter(Boolean), Infinity);
        const pb = Math.min(...(b.variants || []).filter(v => v.isActive).map(v => Number(v.price)).filter(Boolean), Infinity);
        return pb - pa;
      });
    case "oldest":
      return cloned.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    case "newest":
    default:
      return cloned.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
}

export function useProducts(params?: { category?: string; search?: string; sort?: string }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keep raw products for re-sorting without refetching
  const rawRef = useRef<ApiProduct[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productsApi.getAll({ category: params?.category, search: params?.search })
      .then((data) => {
        rawRef.current = data;
        setProducts(sortProducts(data, params?.sort || "newest"));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.category, params?.search]);

  // Re-sort when sort changes without refetching
  useEffect(() => {
    if (rawRef.current.length > 0) {
      setProducts(sortProducts(rawRef.current, params?.sort || "newest"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.sort]);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productsApi.getOne(slug)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { product, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
