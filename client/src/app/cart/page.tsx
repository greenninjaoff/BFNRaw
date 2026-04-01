// app/cart/page.tsx
import { Suspense } from "react";
import CartClient from "./CartClient";
import { getServerLang } from "@/i18n/serverLang";
import { messages } from "@/i18n/messages";

async function CartFallback() {
  const lang = await getServerLang();

  return (
    <div className="p-6">
      {messages[lang].cart.loading ?? "Loading cart..."}
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<CartFallback />}>
      <CartClient />
    </Suspense>
  );
}