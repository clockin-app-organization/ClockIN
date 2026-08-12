// lib/mdaData.ts
// Government of Sierra Leone — Ministries, Departments & Agencies (MDAs)
// Used to power the searchable Designation/Role dropdown on the attendance form.

export interface MdaOffice {
  name: string;
  abbr: string;
}

export interface Mda {
  name: string;
  abbr: string;
  offices: MdaOffice[];
}

// Order matters: this is the display/priority order (major ministries first).
export const MDA_LIST: Mda[] = [
  {
    name: "Office of the President",
    abbr: "OoP",
    offices: [
      { name: "Chief Minister's Office", abbr: "CMO" },
      { name: "Office of National Security", abbr: "ONS" },
      { name: "National Disaster Management Agency", abbr: "NDMA" },
      { name: "Presidential Delivery Unit", abbr: "PDU" },
      { name: "Public Sector Reform Unit", abbr: "PSRU" },
      { name: "Directorate of Science, Technology and Innovation", abbr: "DSTI" },
      { name: "State House Administration", abbr: "SHA" },
    ],
  },
  {
    name: "Ministry of Finance",
    abbr: "MoF",
    offices: [
      { name: "Accountant General's Department", abbr: "AGD" },
      { name: "Budget Bureau", abbr: "BB" },
      { name: "Debt Management Division", abbr: "DMD" },
      { name: "Internal Audit Directorate", abbr: "IAD" },
      { name: "Public Investment Management Unit", abbr: "PIMU" },
      { name: "National Revenue Authority", abbr: "NRA" },
      { name: "National Public Procurement Authority", abbr: "NPPA" },
      { name: "Financial Intelligence Agency", abbr: "FIA" },
      { name: "National Commission for Privatization", abbr: "NCP" },
    ],
  },
  {
    name: "Ministry of Planning and Economic Development",
    abbr: "MoPED",
    offices: [
      { name: "National Planning Directorate", abbr: "NPD" },
      { name: "Monitoring & Evaluation Directorate", abbr: "M&E" },
      { name: "Development Cooperation Directorate", abbr: "DCD" },
      { name: "Public Investment Coordination", abbr: "PIC" },
    ],
  },
  {
    name: "Ministry of Justice",
    abbr: "MoJ",
    offices: [
      { name: "Law Officers' Department", abbr: "LOD" },
      { name: "Legislative Drafting Division", abbr: "LDD" },
      { name: "Civil Division", abbr: "CD" },
      { name: "Criminal Division", abbr: "CrD" },
      { name: "Administrator & Registrar General", abbr: "ARG" },
      { name: "Legal Aid Board", abbr: "LAB" },
    ],
  },
  {
    name: "Ministry of Internal Affairs",
    abbr: "MoIA",
    offices: [
      { name: "Sierra Leone Police", abbr: "SLP" },
      { name: "Sierra Leone Immigration Department", abbr: "SLID" },
      { name: "Sierra Leone Correctional Service", abbr: "SLCS" },
      { name: "National Fire Force", abbr: "NFF" },
      { name: "National Civil Registration Authority", abbr: "NCRA" },
      { name: "National Drug Law Enforcement Agency", abbr: "NDLEA" },
    ],
  },
  {
    name: "Ministry of Defence",
    abbr: "MoD",
    offices: [
      { name: "Republic of Sierra Leone Armed Forces", abbr: "RSLAF" },
      { name: "Joint Force Command", abbr: "JFC" },
      { name: "Military Hospital", abbr: "MH" },
      { name: "Defence Headquarters", abbr: "DHQ" },
    ],
  },
  {
    name: "Ministry of Foreign Affairs and International Cooperation",
    abbr: "MFAIC",
    offices: [
      { name: "Bilateral Affairs Directorate", abbr: "BAD" },
      { name: "Multilateral Affairs Directorate", abbr: "MAD" },
      { name: "Protocol Division", abbr: "PD" },
      { name: "Consular Affairs Division", abbr: "CAD" },
      { name: "Embassies & High Commissions", abbr: "EHC" },
    ],
  },
  {
    name: "Ministry of Health",
    abbr: "MoH",
    offices: [
      { name: "National Public Health Agency", abbr: "NPHA" },
      { name: "National Medical Supplies Agency", abbr: "NMSA" },
      { name: "Pharmacy Board of Sierra Leone", abbr: "PBSL" },
      { name: "District Health Management Teams", abbr: "DHMTs" },
      { name: "Teaching Hospitals", abbr: "TH" },
      { name: "Hospitals Directorate", abbr: "HD" },
      { name: "Disease Surveillance Division", abbr: "DSD" },
    ],
  },
  {
    name: "Ministry of Basic and Senior Secondary Education",
    abbr: "MBSSE",
    offices: [
      { name: "Teaching Service Commission", abbr: "TSC" },
      { name: "West African Examinations Council – Sierra Leone", abbr: "WAEC-SL" },
      { name: "Inspectorate Directorate", abbr: "ID" },
      { name: "Curriculum Directorate", abbr: "CD" },
      { name: "Free Quality School Education Secretariat", abbr: "FQSE" },
    ],
  },
  {
    name: "Ministry of Technical and Higher Education",
    abbr: "MTHE",
    offices: [
      { name: "Tertiary Education Commission", abbr: "TEC" },
      { name: "Universities", abbr: "UNIs" },
      { name: "Polytechnics", abbr: "POLYs" },
      { name: "Technical & Vocational Education and Training Institutions", abbr: "TVET" },
      { name: "Scholarships Directorate", abbr: "SD" },
    ],
  },
  {
    name: "Ministry of Agriculture and Food Security",
    abbr: "MAFS",
    offices: [
      { name: "Crops Division", abbr: "CD" },
      { name: "Livestock Division", abbr: "LD" },
      { name: "Agricultural Extension Services", abbr: "AES" },
      { name: "Seed Certification Unit", abbr: "SCU" },
      { name: "Agricultural Engineering Division", abbr: "AED" },
      { name: "Agricultural Research Institutes", abbr: "ARI" },
    ],
  },
  {
    name: "Ministry of Fisheries and Marine Resources",
    abbr: "MFMR",
    offices: [
      { name: "Fisheries Monitoring Centre", abbr: "FMC" },
      { name: "Licensing Unit", abbr: "LU" },
      { name: "Aquaculture Division", abbr: "AD" },
      { name: "Marine Surveillance Unit", abbr: "MSU" },
      { name: "Fisheries Research Division", abbr: "FRD" },
    ],
  },
  {
    name: "Ministry of Mines and Mineral Resources",
    abbr: "MMMR",
    offices: [
      { name: "Geological Survey Department", abbr: "GSD" },
      { name: "Mines Inspectorate Division", abbr: "MID" },
      { name: "Licensing Directorate", abbr: "LD" },
      { name: "Precious Minerals Trading Unit", abbr: "PMTU" },
      { name: "National Minerals Agency", abbr: "NMA" },
    ],
  },
  {
    name: "Ministry of Trade and Industry",
    abbr: "MTI",
    offices: [
      { name: "Trade Directorate", abbr: "TD" },
      { name: "Industrial Development Directorate", abbr: "IDD" },
      { name: "Small and Medium Enterprise Directorate", abbr: "SME" },
      { name: "Consumer Protection Unit", abbr: "CPU" },
      { name: "Sierra Leone Standards Bureau", abbr: "SLSB" },
    ],
  },
  {
    name: "Ministry of Communications, Technology and Innovation",
    abbr: "MoCTI",
    offices: [
      { name: "National Communications Authority", abbr: "NatCA" },
      { name: "National Cyber Security Coordination Centre", abbr: "NCSCC" },
      { name: "Government ICT Directorate", abbr: "GICT" },
      { name: "Postal Services Directorate", abbr: "PSD" },
      { name: "Digital Government Programmes", abbr: "DGP" },
    ],
  },
  {
    name: "Ministry of Information and Civic Education",
    abbr: "MoICE",
    offices: [
      { name: "Government Information Service", abbr: "GIS" },
      { name: "Civic Education Directorate", abbr: "CED" },
      { name: "Public Relations Unit", abbr: "PRU" },
      { name: "Government Printing Department", abbr: "GPD" },
    ],
  },
  {
    name: "Ministry of Employment, Labour and Social Security",
    abbr: "MELSS",
    offices: [
      { name: "Labour Department", abbr: "LD" },
      { name: "Employment Services Directorate", abbr: "ESD" },
      { name: "Occupational Safety & Health Division", abbr: "OSHD" },
      { name: "Industrial Relations Division", abbr: "IRD" },
      { name: "National Social Security and Insurance Trust", abbr: "NASSIT" },
    ],
  },
  {
    name: "Ministry of Social Welfare",
    abbr: "MSW",
    offices: [
      { name: "Child Welfare Directorate", abbr: "CWD" },
      { name: "Disability Affairs Directorate", abbr: "DAD" },
      { name: "Family Support Services", abbr: "FSS" },
      { name: "Social Protection Programmes", abbr: "SPP" },
    ],
  },
  {
    name: "Ministry of Gender and Children's Affairs",
    abbr: "MoGCA",
    offices: [
      { name: "Gender Affairs Directorate", abbr: "GAD" },
      { name: "Child Protection Directorate", abbr: "CPD" },
      { name: "Women's Empowerment Programmes", abbr: "WEP" },
      { name: "Gender Policy Unit", abbr: "GPU" },
    ],
  },
  {
    name: "Ministry of Youth Affairs",
    abbr: "MoYA",
    offices: [
      { name: "Youth Development Directorate", abbr: "YDD" },
      { name: "Entrepreneurship Programmes", abbr: "EP" },
      { name: "Skills Development Division", abbr: "SDD" },
      { name: "National Youth Service", abbr: "NYS" },
    ],
  },
  {
    name: "Ministry of Sports",
    abbr: "MoS",
    offices: [
      { name: "National Sports Authority", abbr: "NSA" },
      { name: "Stadium Management", abbr: "SM" },
      { name: "Sports Federations", abbr: "SF" },
      { name: "Community Sports Development", abbr: "CSD" },
    ],
  },
  {
    name: "Ministry of Tourism and Cultural Affairs",
    abbr: "MTCA",
    offices: [
      { name: "National Tourist Board", abbr: "NTB" },
      { name: "Monuments and Relics Commission", abbr: "MRC" },
      { name: "National Museums", abbr: "NM" },
      { name: "Cultural Affairs Directorate", abbr: "CAD" },
    ],
  },
  {
    name: "Ministry of Transport and Aviation",
    abbr: "MTA",
    offices: [
      { name: "Sierra Leone Civil Aviation Authority", abbr: "SLCAA" },
      { name: "Sierra Leone Ports Authority", abbr: "SLPA" },
      { name: "Sierra Leone Maritime Administration", abbr: "SLMA" },
      { name: "Road Transport Directorate", abbr: "RTD" },
    ],
  },
  {
    name: "Ministry of Works and Public Assets",
    abbr: "MWPA",
    offices: [
      { name: "Government Buildings Directorate", abbr: "GBD" },
      { name: "Public Assets Directorate", abbr: "PAD" },
      { name: "Engineering Services Division", abbr: "ESD" },
      { name: "Mechanical Services Division", abbr: "MSD" },
    ],
  },
  {
    name: "Ministry of Lands, Housing and Country Planning",
    abbr: "MLHCP",
    offices: [
      { name: "Surveys Division", abbr: "SD" },
      { name: "Lands Division", abbr: "LD" },
      { name: "Physical Planning Division", abbr: "PPD" },
      { name: "Housing Directorate", abbr: "HD" },
      { name: "Land Registration Unit", abbr: "LRU" },
    ],
  },
  {
    name: "Ministry of Water Resources and Sanitation",
    abbr: "MWRS",
    offices: [
      { name: "Guma Valley Water Company", abbr: "GVWC" },
      { name: "Sierra Leone Water Company", abbr: "SALWACO" },
      { name: "Rural Water Directorate", abbr: "RWD" },
      { name: "Sanitation Directorate", abbr: "SanD" },
    ],
  },
  {
    name: "Ministry of Local Government and Community Affairs",
    abbr: "MLGCA",
    offices: [
      { name: "Freetown City Council", abbr: "FCC" },
      { name: "Bo City Council", abbr: "BCC" },
      { name: "Kenema City Council", abbr: "KCC" },
      { name: "Makeni City Council", abbr: "MCC" },
      { name: "District Councils", abbr: "DCs" },
      { name: "Chiefdom Administrations", abbr: "CA" },
    ],
  },
  {
    name: "Ministry of Public Administration and Political Affairs",
    abbr: "MoPAPA",
    offices: [
      { name: "Human Resource Management Office", abbr: "HRMO" },
      { name: "Public Service Commission", abbr: "PSC" },
      { name: "Public Service Training College", abbr: "PSTC" },
      { name: "Performance Management Directorate", abbr: "PMD" },
    ],
  },
  {
    name: "Independent Constitutional & Oversight Institutions",
    abbr: "ICOI",
    offices: [
      { name: "Parliament of Sierra Leone", abbr: "PoSL" },
      { name: "Judiciary of Sierra Leone", abbr: "JSL" },
      { name: "Audit Service Sierra Leone", abbr: "ASSL" },
      { name: "Anti-Corruption Commission", abbr: "ACC" },
      { name: "Electoral Commission for Sierra Leone", abbr: "ECSL" },
      { name: "Political Parties Regulation Commission", abbr: "PPRC" },
      { name: "Human Rights Commission of Sierra Leone", abbr: "HRCSL" },
      { name: "Right to Access Information Commission", abbr: "RAIC" },
      { name: "Statistics Sierra Leone", abbr: "Stats SL" },
      { name: "Sierra Leone Broadcasting Corporation", abbr: "SLBC" },
      { name: "National Commission for Social Action", abbr: "NaCSA" },
    ],
  },
];

// ── Flattened, searchable index ────────────────────────────────────────────

export interface MdaSearchEntry {
  /** Unique key for React lists / selection tracking */
  key: string;
  /** The display label stored in the form field when selected */
  value: string;
  /** Primary name shown in the row */
  name: string;
  /** Abbreviation shown in the row */
  abbr: string;
  /** Parent MDA name, if this entry is a sub-office (undefined for top-level MDAs) */
  parentName?: string;
  /** True if this entry is a top-level MDA rather than a sub-office */
  isMda: boolean;
  /** Original order index, used to keep "major ministries first" ordering stable */
  order: number;
}

function buildSearchIndex(): MdaSearchEntry[] {
  const entries: MdaSearchEntry[] = [];
  MDA_LIST.forEach((mda, mdaIdx) => {
    entries.push({
      key: `mda:${mda.abbr}`,
      value: `${mda.name} (${mda.abbr})`,
      name: mda.name,
      abbr: mda.abbr,
      isMda: true,
      order: mdaIdx * 1000,
    });
    mda.offices.forEach((office, officeIdx) => {
      entries.push({
        key: `office:${mda.abbr}:${office.abbr}:${officeIdx}`,
        value: `${office.name} (${office.abbr}) – ${mda.name} (${mda.abbr})`,
        name: office.name,
        abbr: office.abbr,
        parentName: mda.name,
        isMda: false,
        order: mdaIdx * 1000 + officeIdx + 1,
      });
    });
  });
  return entries;
}

export const MDA_SEARCH_INDEX: MdaSearchEntry[] = buildSearchIndex();

/**
 * Search MDAs/offices by name or abbreviation. Matches are ranked so that
 * abbreviation exact/startsWith matches surface first, then name matches,
 * preserving the "major ministries first" order as a tiebreaker.
 */
export function searchMdas(query: string, limit = 30): MdaSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: Array<{ entry: MdaSearchEntry; score: number }> = [];

  for (const entry of MDA_SEARCH_INDEX) {
    const abbrLc = entry.abbr.toLowerCase();
    const nameLc = entry.name.toLowerCase();

    let score = -1;
    if (abbrLc === q) score = 0;
    else if (abbrLc.startsWith(q)) score = 1;
    else if (nameLc.startsWith(q)) score = 2;
    else if (abbrLc.includes(q)) score = 3;
    else if (nameLc.includes(q)) score = 4;
    else if (entry.parentName?.toLowerCase().includes(q)) score = 5;

    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => a.score - b.score || a.entry.order - b.entry.order);
  return scored.slice(0, limit).map((s) => s.entry);
}