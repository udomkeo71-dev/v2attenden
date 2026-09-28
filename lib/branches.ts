import { Branch, BranchId } from "@/types";

export const V2_BRANCHES: Record<BranchId, Branch> = {
  BKK: {
    id: "BKK",
    nameKhmer: "សាខាបឹងកេងកង",
    nameEnglish: "Boeung Keng Kang (BKK)",
    addressKhmer: "ផ្លូវ ៣៦០, សង្កាត់បឹងកេងកង៣, ខណ្ឌចំការមន (បឹងកេងកង), រាជធានីភ្នំពេញ",
    addressEnglish: "St 360, BKK3, Chamkar mon, Phnom Penh",
    latitude: 11.5435,
    longitude: 104.9192,
    radiusMeters: 100,
    color: "#2563eb", // Blue
    contactNumber: "087 454 525 / 081 454 515",
    telegram: "087 454 525 / 081 454 515",
    facebookPage: "V2-Education",
  },
  OLP: {
    id: "OLP",
    nameKhmer: "សាខាអូឡាំពិក",
    nameEnglish: "Olympic (OLP)",
    addressKhmer: "ផ្លូវ ៣១៨, សង្កាត់ទួលស្វាយព្រៃ (អូឡាំពិក), រាជធានីភ្នំពេញ",
    addressEnglish: "St 318, Olymic, Tuol Svayprey, Phnom Penh",
    latitude: 11.5478,
    longitude: 104.9105,
    radiusMeters: 100,
    color: "#0891b2", // Cyan
    contactNumber: "087 309 060 / 087 306 090",
    telegram: "087 309 060 / 087 306 090",
    facebookPage: "V2 Education OLP",
  },
  TTP: {
    id: "TTP",
    nameKhmer: "សាខាទួលទំពូង",
    nameEnglish: "Toul Tompoung (TTP)",
    addressKhmer: "ផ្លូវ ៤៨០, សង្កាត់ទួលទំពូង២, ខណ្ឌចំការមន, រាជធានីភ្នំពេញ",
    addressEnglish: "St 480, TTP2, Chamkar mon, Phnom Penh",
    latitude: 11.5348,
    longitude: 104.9142,
    radiusMeters: 100,
    color: "#d97706", // Amber
    contactNumber: "086 309 060 / 086 872 871",
    telegram: "086 309 060 / 086 872 871",
    facebookPage: "V2 Education TTP",
  },
  TK: {
    id: "TK",
    nameKhmer: "សាខាទួលគោក",
    nameEnglish: "Toul Kork (TK)",
    addressKhmer: "ផ្លូវ ៥៦២, សង្កាត់បឹងកក់១, ខណ្ឌទួលគោក, រាជធានីភ្នំពេញ",
    addressEnglish: "St 562, Boeung Kak 1, Toul Kork, Phnom Penh",
    latitude: 11.5785,
    longitude: 104.8988,
    radiusMeters: 100,
    color: "#7c3aed", // Purple
    contactNumber: "070 611 618 / 077 611 618",
    telegram: "070 611 618 / 077 611 618",
    facebookPage: "V2 Education TK",
  },
  STM: {
    id: "STM",
    nameKhmer: "សាខាសន្ធរម៉ុក",
    nameEnglish: "Santhormok (STM)",
    addressKhmer: "ផ្លូវ ១៣២, សង្កាត់ទឹកល្អក់១, ខណ្ឌទួលគោក, រាជធានីភ្នំពេញ",
    addressEnglish: "St 132, Tuek L'ak 1, Toul Kork, Phnom Penh",
    latitude: 11.5645,
    longitude: 104.8962,
    radiusMeters: 100,
    color: "#059669", // Emerald
    contactNumber: "087 611 618 / 017 611 619",
    telegram: "087 611 618 / 017 611 619",
    facebookPage: "V2 Education STM",
  },
  BS: {
    id: "BS",
    nameKhmer: "សាខាបឹងស្នោ (ច្បារអំពៅ)",
    nameEnglish: "Boeung Snor (BS)",
    addressKhmer: "ផ្លូវជាតិលេខ១, សង្កាត់និរោធ, ខណ្ឌច្បារអំពៅ (បឹងស្នោ), រាជធានីភ្នំពេញ",
    addressEnglish: "RN 1, Niroth, Chbar Ampov, Phnom Penh",
    latitude: 11.5285,
    longitude: 104.9525,
    radiusMeters: 100,
    color: "#dc2626", // Red
    contactNumber: "086 61 1618 / 098 611 618",
    telegram: "086 61 1618 / 098 611 618",
    facebookPage: "V2 Education BS",
  },
  SS: {
    id: "SS",
    nameKhmer: "សាខាសែនសុខ",
    nameEnglish: "Sen Sok (SS)",
    addressKhmer: "មហាវិថី A, សង្កាត់ភ្នំពេញថ្មី, ខណ្ឌសែនសុខ, រាជធានីភ្នំពេញ",
    addressEnglish: "Avenue A , Phnom Penh Tmei, Sensok, Phnom Penh",
    latitude: 11.5792,
    longitude: 104.8785,
    radiusMeters: 100,
    color: "#e11d48", // Rose
    contactNumber: "081 309 060 / 099 306 090",
    telegram: "081 309 060 / 099 306 090",
    facebookPage: "V2 Education SS",
  },
  // Backward-compatibility aliases
  CA: {
    id: "CA",
    nameKhmer: "សាខាបឹងស្នោ (ច្បារអំពៅ)",
    nameEnglish: "Boeung Snor (BS)",
    addressKhmer: "ផ្លូវជាតិលេខ១, សង្កាត់និរោធ, ខណ្ឌច្បារអំពៅ (បឹងស្នោ), រាជធានីភ្នំពេញ",
    addressEnglish: "RN 1, Niroth, Chbar Ampov, Phnom Penh",
    latitude: 11.5285,
    longitude: 104.9525,
    radiusMeters: 100,
    color: "#dc2626",
    contactNumber: "086 61 1618 / 098 611 618",
    facebookPage: "V2 Education BS",
  },
  PSL: {
    id: "PSL",
    nameKhmer: "សាខាអូឡាំពិក",
    nameEnglish: "Olympic (OLP)",
    addressKhmer: "ផ្លូវ ៣១៨, សង្កាត់ទួលស្វាយព្រៃ (អូឡាំពិក), រាជធានីភ្នំពេញ",
    addressEnglish: "St 318, Olymic, Tuol Svayprey, Phnom Penh",
    latitude: 11.5478,
    longitude: 104.9105,
    radiusMeters: 100,
    color: "#0891b2",
    contactNumber: "087 309 060 / 087 306 090",
    facebookPage: "V2 Education OLP",
  },
  SR: {
    id: "SR",
    nameKhmer: "សាខាសែនសុខ",
    nameEnglish: "Sen Sok (SS)",
    addressKhmer: "មហាវិថី A, សង្កាត់ភ្នំពេញថ្មី, ខណ្ឌសែនសុខ, រាជធានីភ្នំពេញ",
    addressEnglish: "Avenue A , Phnom Penh Tmei, Sensok, Phnom Penh",
    latitude: 11.5792,
    longitude: 104.8785,
    radiusMeters: 100,
    color: "#e11d48",
    contactNumber: "081 309 060 / 099 306 090",
    facebookPage: "V2 Education SS",
  },
};

export const OFFICIAL_BRANCH_IDS: BranchId[] = ["BKK", "OLP", "TTP", "TK", "STM", "BS", "SS"];

export const BRANCH_LIST: Branch[] = OFFICIAL_BRANCH_IDS.map((id) => V2_BRANCHES[id]);

export function getBranchById(id: string): Branch | undefined {
  return V2_BRANCHES[id as BranchId];
}
