/** Hebrew names of languages, for interface text such as "כתבו באנגלית". */
const NAMES: Record<string, { name: string; in: string }> = {
  en: { name: "אנגלית", in: "באנגלית" },
  es: { name: "ספרדית", in: "בספרדית" },
  fr: { name: "צרפתית", in: "בצרפתית" },
  de: { name: "גרמנית", in: "בגרמנית" },
  it: { name: "איטלקית", in: "באיטלקית" },
  pt: { name: "פורטוגזית", in: "בפורטוגזית" },
  ru: { name: "רוסית", in: "ברוסית" },
  ar: { name: "ערבית", in: "בערבית" },
  he: { name: "עברית", in: "בעברית" },
  yi: { name: "יידיש", in: "ביידיש" },
  zh: { name: "סינית", in: "בסינית" },
  ja: { name: "יפנית", in: "ביפנית" },
  ko: { name: "קוריאנית", in: "בקוריאנית" },
};

export const languageName = (code: string) => NAMES[code]?.name ?? code;
export const inLanguage = (code: string) => NAMES[code]?.in ?? code;
