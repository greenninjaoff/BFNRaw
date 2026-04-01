import { cookies } from "next/headers";
import type { Lang } from "@/stores/langStore";

export async function getServerLang(): Promise<Lang> {
    const cookieStore = await cookies(); // 👈 await here
    const lang = cookieStore.get("lang")?.value;

    if (lang === "ru" || lang === "uz" || lang === "en") {
        return lang;
    }

    return "en";
}