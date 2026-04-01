import ProductList from "@/components/ProductList";
import { Suspense } from "react";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) => {
  const sp = await searchParams;
  return (
    <Suspense>
      <ProductList category={sp.category} params="products" />
    </Suspense>
  );
};

export default ProductsPage;
