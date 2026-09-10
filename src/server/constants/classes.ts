export const EXCEL_IMPORT_CLASS_DESC = "Created from student Excel import";

const naturalClassCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const getSchoolClassRank = (name: string) => {
  const normalized = name.trim().toLowerCase().replace(/[./_-]+/g, " ").replace(/\s+/g, " ");

  if (/^(play\s*(group|gourp)|pre\s*nursery)/.test(normalized)) return 10;
  if (/^nursery\b/.test(normalized) || /\bkg\s*0\b/.test(normalized)) return 20;
  if (/^(lkg|lower\s*kg)\b/.test(normalized) || /\bkg\s*1\b/.test(normalized)) return 30;
  if (/^(ukg|upper\s*kg|kg|prep)\b/.test(normalized) || /\bkg\s*2\b/.test(normalized)) return 40;

  const numericMatch = normalized.match(/(?:class|grade|std|standard)?\s*(\d{1,2})(?:st|nd|rd|th)?$/);
  if (numericMatch) return 100 + Number(numericMatch[1]);

  const romanClassNumbers: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
  };
  if (romanClassNumbers[normalized]) return 100 + romanClassNumbers[normalized];

  return Number.MAX_SAFE_INTEGER;
};

/** School order: Play Group → Nursery → LKG → UKG → Class 1…12 → other names. */
export const compareSchoolClassNames = (a: string, b: string) => {
  const rankDifference = getSchoolClassRank(a) - getSchoolClassRank(b);
  return rankDifference || naturalClassCollator.compare(a, b);
};
