/** Source badge config — maps source slugs to display labels and colors */

export const SOURCE_TAGS: Record<string, { label: string; bg: string; text: string }> = {
  // Primary sources
  realtor:         { label: "Realtor",       bg: "bg-red-50",     text: "text-red-700" },
  aln:             { label: "ALN",           bg: "bg-purple-50",  text: "text-purple-700" },
  email:           { label: "Email",         bg: "bg-amber-50",   text: "text-amber-700" },

  // MLS feed (ABOR / any MLS)
  mls:             { label: "MLS",           bg: "bg-sky-50",     text: "text-sky-700" },
  abor:            { label: "MLS",           bg: "bg-sky-50",     text: "text-sky-700" },

  // Zillow sources
  zillow:          { label: "Zillow",        bg: "bg-indigo-50",  text: "text-indigo-700" },
  zfsbo:           { label: "ZFSBO",         bg: "bg-orange-50",  text: "text-orange-700" },
  zcomingsoon:     { label: "Z-Coming Soon", bg: "bg-yellow-50",  text: "text-yellow-700" },

  // Austin residential sites & brokerages
  clubhouse:       { label: "Clubhouse",     bg: "bg-emerald-50", text: "text-emerald-700" },
  atxpocket:       { label: "ATX Pocket",    bg: "bg-teal-50",    text: "text-teal-700" },
  kuw:             { label: "KUW",           bg: "bg-rose-50",    text: "text-rose-700" },
  ubs:             { label: "UBS",           bg: "bg-blue-50",    text: "text-blue-700" },

  // Manual / agent-entered
  manual:          { label: "Manual",        bg: "bg-gray-100",   text: "text-gray-600" },
};

export function getSourceTag(slug: string) {
  return SOURCE_TAGS[slug] ?? { label: slug.toUpperCase(), bg: "bg-gray-100", text: "text-gray-500" };
}
