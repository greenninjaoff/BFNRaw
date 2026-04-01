import useLangStore from "@/stores/langStore";
import { messages } from "@/i18n/messages";

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function useT() {
  const { lang } = useLangStore();
  const dict = messages[lang];

  return (key: string) => {
    const val = getByPath(dict, key);
    return typeof val === "string" ? val : key;
  };
}
