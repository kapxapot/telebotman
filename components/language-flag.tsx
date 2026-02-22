import { getCountryCode } from "@/lib/languages";

type Props = {
  code: string;
};

export function LanguageFlag({ code }: Props) {
  const country = getCountryCode(code);

  if (!country) {
    return null;
  }

  return <span className={`fi fi-${country.toLowerCase()}`} />;
}
