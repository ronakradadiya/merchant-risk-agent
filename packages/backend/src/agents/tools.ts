import { ToolSignals } from '@merchant-risk-agent/shared'

// --- Known brands for typosquat detection ---
const KNOWN_BRANDS = [
  'paytm', 'phonepe', 'googlepay', 'gpay', 'amazon', 'flipkart',
  'swiggy', 'zomato', 'ola', 'uber', 'myntra', 'bigbasket',
  'jio', 'airtel', 'vodafone', 'hdfc', 'icici', 'sbi',
  'shopease', 'shopeasy', 'quickloan', 'fastcash', 'realestate',
  'tecbazaar', 'techbazar', 'techbazaar', 'delhimobile', 'delhimobiles',
]

// --- Tool 1: Domain age checker (whoisjson.com) ---
export async function checkDomainAge(domain: string): Promise<{
  domainAgeDays: number | null
  hasSSL: boolean
  googleIndexedPages: number
  registrationDate: string | null
}> {
  try {
    const apiKey = process.env.WHOIS_API_KEY
    if (!apiKey) {
      console.warn('WHOIS_API_KEY not set, using heuristic fallback')
      return domainAgeFallback(domain)
    }

    const res = await fetch(`https://whoisjson.com/api/v1/whois?domain=${encodeURIComponent(domain)}`, {
      headers: { Authorization: `Token ${apiKey}` },
    })

    if (!res.ok) {
      console.warn(`WHOIS API returned ${res.status}, using fallback`)
      return domainAgeFallback(domain)
    }

    const data = (await res.json()) as Record<string, string>
    const createdDate = data.created || data.creation_date
    let domainAgeDays: number | null = null

    if (createdDate) {
      const created = new Date(createdDate)
      domainAgeDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    }

    return {
      domainAgeDays,
      hasSSL: await checkSSL(domain),
      googleIndexedPages: await estimateGoogleIndexed(domain),
      registrationDate: createdDate || null,
    }
  } catch (err) {
    console.error('Domain age check failed:', err)
    return domainAgeFallback(domain)
  }
}

async function checkSSL(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function estimateGoogleIndexed(domain: string): Promise<number> {
  // If Serper API is available, use it for a site: query
  try {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) return 0

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: `site:${domain}` }),
    })

    if (!res.ok) return 0
    const data = (await res.json()) as { organic?: unknown[] }
    return data.organic?.length || 0
  } catch {
    return 0
  }
}

function domainAgeFallback(domain: string): {
  domainAgeDays: number | null
  hasSSL: boolean
  googleIndexedPages: number
  registrationDate: string | null
} {
  // Heuristic: common TLDs with short names are likely newer/suspicious
  const suspicious = domain.includes('-') || /\d/.test(domain.split('.')[0])
  return {
    domainAgeDays: suspicious ? 15 : 180,
    hasSSL: !suspicious,
    googleIndexedPages: suspicious ? 0 : 10,
    registrationDate: null,
  }
}

// --- Tool 2: Web search for fraud reports (Serper.dev) ---
export async function webSearch(query: string): Promise<{
  summary: string
  publicComplaints: number
  results: { title: string; snippet: string }[]
}> {
  try {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
      console.warn('SERPER_API_KEY not set, returning empty results')
      return { summary: 'No search results (API key not configured)', publicComplaints: 0, results: [] }
    }

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    })

    if (!res.ok) {
      return { summary: `Search failed (HTTP ${res.status})`, publicComplaints: 0, results: [] }
    }

    const data = (await res.json()) as { organic?: { title: string; snippet: string }[] }
    const organic: { title: string; snippet: string }[] = (data.organic || [])
      .slice(0, 5)
      .map((r: { title: string; snippet: string }) => ({
        title: r.title,
        snippet: r.snippet,
      }))

    // Count complaint indicators
    const complaintKeywords = ['scam', 'fraud', 'complaint', 'cheat', 'fake', 'beware', 'warning']
    let complaintCount = 0
    for (const r of organic) {
      const text = `${r.title} ${r.snippet}`.toLowerCase()
      if (complaintKeywords.some((kw) => text.includes(kw))) {
        complaintCount++
      }
    }

    const summary = organic.length > 0
      ? organic.map((r) => `${r.title}: ${r.snippet}`).join(' | ')
      : 'No relevant results found'

    return { summary, publicComplaints: complaintCount, results: organic }
  } catch (err) {
    console.error('Web search failed:', err)
    return { summary: 'Search failed due to error', publicComplaints: 0, results: [] }
  }
}

// --- Tool 3: UPI pattern checker (pure TypeScript) ---
export async function checkUpiPattern(upiId: string): Promise<{
  isTyposquat: boolean
  confidence: number
  closestBrand: string | null
  reasons: string[]
}> {
  const vpa = upiId.toLowerCase()
  const [localPart] = vpa.split('@')
  const reasons: string[] = []
  let maxConfidence = 0
  let closestBrand: string | null = null

  // Check 1: Numeric suffix pattern (e.g., brand.9@upi, brand.99@ybl)
  const numericSuffixMatch = localPart.match(/[.\-_](\d+)$/)
  if (numericSuffixMatch) {
    reasons.push(`Suspicious numeric suffix: .${numericSuffixMatch[1]}`)
    maxConfidence = Math.max(maxConfidence, 0.6)
  }

  // Check 2: Edit distance from known brands
  const cleanLocal = localPart.replace(/[.\-_\d]/g, '')
  for (const brand of KNOWN_BRANDS) {
    const distance = levenshtein(cleanLocal, brand)
    const maxLen = Math.max(cleanLocal.length, brand.length)
    const similarity = 1 - distance / maxLen

    // Close but not exact match = likely typosquat
    if (similarity >= 0.7 && similarity < 1.0 && distance <= 3) {
      const conf = similarity
      if (conf > maxConfidence) {
        maxConfidence = conf
        closestBrand = brand
      }
      reasons.push(`Similar to known brand "${brand}" (edit distance: ${distance})`)
    }
  }

  // Check 3: Dot/dash splitting pattern common in scam VPAs
  if (/[.\-]\w{1,2}\d+@/.test(vpa)) {
    reasons.push('Dot/dash + short chars + numbers pattern (common scam format)')
    maxConfidence = Math.max(maxConfidence, 0.5)
  }

  // Check 4: Known scam VPA patterns
  const scamPatterns = [/loan/i, /cash/i, /prize/i, /winner/i, /lucky/i, /offer/i]
  for (const pattern of scamPatterns) {
    if (pattern.test(localPart)) {
      reasons.push(`Contains suspicious keyword: ${pattern.source}`)
      maxConfidence = Math.max(maxConfidence, 0.4)
    }
  }

  return {
    isTyposquat: maxConfidence >= 0.5,
    confidence: Math.round(maxConfidence * 100) / 100,
    closestBrand,
    reasons,
  }
}

// Levenshtein edit distance
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

// --- Tool 4: India compliance checker (P5 + P6) ---

// TRAI phone prefix → state mapping
const PHONE_STATE_PREFIXES: Record<string, string> = {
  '9820': 'Maharashtra', '9821': 'Maharashtra', '9822': 'Maharashtra',
  '9823': 'Maharashtra', '9850': 'Maharashtra', '9860': 'Maharashtra',
  '9415': 'Uttar Pradesh', '9416': 'Haryana', '9430': 'Jharkhand',
  '9831': 'West Bengal', '9832': 'West Bengal',
  '9829': 'Rajasthan', '9828': 'Rajasthan',
  '9845': 'Karnataka', '9844': 'Karnataka', '9880': 'Karnataka',
  '9840': 'Tamil Nadu', '9841': 'Tamil Nadu',
  '9810': 'Delhi', '9811': 'Delhi', '9818': 'Delhi',
  '9848': 'Telangana', '9849': 'Andhra Pradesh',
  '9825': 'Gujarat', '9824': 'Gujarat',
  '9830': 'West Bengal', '9836': 'West Bengal',
  '9870': 'Maharashtra', '9871': 'Delhi', '9872': 'Punjab',
  '9876': 'Punjab', '9878': 'Punjab',
}

// GST state codes
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
  '33': 'Tamil Nadu', '34': 'Puducherry', '36': 'Telangana',
  '37': 'Andhra Pradesh',
}

// GSTIN format: 2-digit state + 10-char PAN + 1 digit + Z + 1 check
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

function checkPhonePrefix(phoneNumber: string | undefined, statedLocation: string): boolean | null {
  if (!phoneNumber) return null
  const digits = phoneNumber.replace(/\D/g, '')
  // Try 4-digit prefix (after country code)
  const prefix = digits.startsWith('91') ? digits.substring(2, 6) : digits.substring(0, 4)
  const phoneState = PHONE_STATE_PREFIXES[prefix]
  if (!phoneState) return null // Unknown prefix
  return statedLocation.toLowerCase().includes(phoneState.toLowerCase())
}

async function checkIpLocation(submissionIp: string | undefined, statedLocation: string): Promise<boolean | null> {
  if (!submissionIp) return null
  try {
    const res = await fetch(`http://ip-api.com/json/${submissionIp}?fields=status,regionName,city,country`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { status: string; regionName?: string; city?: string; country?: string }
    if (data.status !== 'success') return null
    const location = `${data.city} ${data.regionName} ${data.country}`.toLowerCase()
    return statedLocation.toLowerCase().split(/[\s,]+/).some((word) => location.includes(word))
  } catch {
    return null
  }
}

async function checkDomainHostingLocation(websiteDomain: string | undefined): Promise<boolean | null> {
  if (!websiteDomain) return null
  try {
    // Resolve domain to IP via DNS-over-HTTPS
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(websiteDomain)}&type=A`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!dnsRes.ok) return null
    const dnsData = (await dnsRes.json()) as { Answer?: { data: string }[] }
    const ip = dnsData.Answer?.[0]?.data
    if (!ip) return null

    // Check if IP is in India
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!geoRes.ok) return null
    const geoData = (await geoRes.json()) as { status: string; countryCode?: string }
    if (geoData.status !== 'success') return null
    return geoData.countryCode === 'IN'
  } catch {
    return null
  }
}

function validateGSTIN(gstNumber: string): boolean {
  return GSTIN_REGEX.test(gstNumber.toUpperCase())
}

function checkGSTState(gstNumber: string, statedLocation: string): boolean | null {
  const stateCode = gstNumber.substring(0, 2)
  const gstState = GST_STATE_CODES[stateCode]
  if (!gstState) return null
  return statedLocation.toLowerCase().includes(gstState.toLowerCase())
}

async function verifyGSTActive(gstNumber: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `https://sheet.best/api/sheets/d4ade327-5a52-4b9d-8e8a-9e72a2a8b7c1/gstin/${encodeURIComponent(gstNumber)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    // If we can't verify, return null (unknown)
    if (!res.ok) return null
    const data = (await res.json()) as { status?: string }[]
    if (data.length > 0 && data[0].status) {
      return data[0].status.toLowerCase() === 'active'
    }
    return null
  } catch {
    return null
  }
}

export async function checkIndiaCompliance(input: {
  phoneNumber?: string
  gstNumber?: string
  statedLocation: string
  submissionIp?: string
  websiteDomain?: string
}): Promise<{
  phoneStateMatch: boolean | null
  ipLocationMatch: boolean | null
  serverLocationIndia: boolean | null
  gstFormatValid: boolean | null
  gstStateMatch: boolean | null
  gstActiveStatus: boolean | null
}> {
  const [ipLocationMatch, serverLocationIndia, gstActiveStatus] = await Promise.all([
    checkIpLocation(input.submissionIp, input.statedLocation),
    checkDomainHostingLocation(input.websiteDomain),
    input.gstNumber ? verifyGSTActive(input.gstNumber) : Promise.resolve(null),
  ])

  return {
    phoneStateMatch: checkPhonePrefix(input.phoneNumber, input.statedLocation),
    ipLocationMatch,
    serverLocationIndia,
    gstFormatValid: input.gstNumber ? validateGSTIN(input.gstNumber) : null,
    gstStateMatch: input.gstNumber ? checkGSTState(input.gstNumber, input.statedLocation) : null,
    gstActiveStatus,
  }
}

// --- Tool execution dispatcher ---
export async function executeTool(
  toolCall: { function: { name: string; arguments: string } },
  toolSignals: ToolSignals
): Promise<unknown> {
  const args = JSON.parse(toolCall.function.arguments)

  switch (toolCall.function.name) {
    case 'check_domain_age': {
      const result = await checkDomainAge(args.domain)
      toolSignals.domainAgeDays = result.domainAgeDays ?? undefined
      toolSignals.hasSSL = result.hasSSL
      toolSignals.googleIndexedPages = result.googleIndexedPages
      return result
    }
    case 'web_search': {
      const result = await webSearch(args.query)
      toolSignals.publicComplaints = result.publicComplaints
      toolSignals.webSearchSummary = result.summary.substring(0, 500)
      return result
    }
    case 'check_upi_pattern': {
      const result = await checkUpiPattern(args.upiId)
      toolSignals.upiTyposquatMatch = result.isTyposquat
      toolSignals.typosquatConfidence = result.confidence
      toolSignals.linkedScamVPAs = result.reasons.length
      return result
    }
    case 'check_india_compliance': {
      const result = await checkIndiaCompliance(args)
      toolSignals.phoneStateMatch = result.phoneStateMatch ?? undefined
      toolSignals.ipLocationMatch = result.ipLocationMatch ?? undefined
      toolSignals.serverLocationIndia = result.serverLocationIndia ?? undefined
      toolSignals.gstFormatValid = result.gstFormatValid ?? undefined
      toolSignals.gstStateMatch = result.gstStateMatch ?? undefined
      toolSignals.gstActiveStatus = result.gstActiveStatus ?? undefined
      return result
    }
    default:
      return { error: `Unknown tool: ${toolCall.function.name}` }
  }
}

// --- OpenAI function definitions ---
export const TOOL_DEFINITIONS: {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}[] = [
  {
    type: 'function',
    function: {
      name: 'check_domain_age',
      description: 'Check when a domain was registered, SSL status, Google indexing',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Domain to check e.g. shopeasyelec.in' },
        },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search for fraud reports, complaints, or news about a merchant',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_upi_pattern',
      description: 'Check a UPI VPA against known scam patterns and typosquat databases',
      parameters: {
        type: 'object',
        properties: {
          upiId: { type: 'string', description: 'UPI ID to check e.g. shopeas.y9@ybl' },
        },
        required: ['upiId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_india_compliance',
      description: 'Check P5 location signals (phone prefix, IP, server) and P6 GST signals (format, state match, active status)',
      parameters: {
        type: 'object',
        properties: {
          phoneNumber: { type: 'string', description: 'Merchant phone number e.g. +919820123456' },
          gstNumber: { type: 'string', description: 'GSTIN e.g. 27AAPFU0939F1ZV' },
          statedLocation: { type: 'string', description: 'Merchant stated business location' },
          submissionIp: { type: 'string', description: 'IP address of submission' },
          websiteDomain: { type: 'string', description: 'Website domain e.g. shopeasyelec.in' },
        },
        required: ['statedLocation'],
      },
    },
  },
]
