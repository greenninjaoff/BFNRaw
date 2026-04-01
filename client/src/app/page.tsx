import { Suspense } from "react";
import ProductList from "@/components/ProductList";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) => {
  const sp = await searchParams;
  return (
    <Suspense>
      <ProductList category={sp.category} params="homepage" />
    </Suspense>
  );
};

export default Homepage;
