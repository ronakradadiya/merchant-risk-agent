import { Policy } from '@merchant-risk-agent/shared'

export const INDIA_UPI_FRAUD_POLICIES: Policy[] = [
  {
    id: 'P1',
    name: 'New account high velocity',
    severity: 'critical',
    rule: `Flag any merchant account less than 30 days old that meets EITHER of
    these conditions:
    (1) Processing more than 500 transactions per month — this is a strong signal
        for high-ticket businesses (electronics, investment, loans) but should be
        weighted less heavily for low-ticket high-frequency businesses (food delivery,
        courier, grocery) where 500 transactions at small amounts is normal early
        growth behavior. Always consider the average transaction value alongside
        transaction count.
    (2) Monthly GMV (transactions × average transaction value) exceeds Rs 25 lakh —
        this annualizes to Rs 3 crore, far above the threshold for a new account
        with no established reputation. Even at lower transaction counts, a new
        account processing crores of rupees is a major fraud signal.
    Legitimate businesses rarely achieve this velocity or volume without an
    established presence. This pattern is strongly associated with burst fraud
    operations that maximize transactions before detection.
    Real case: Indian Finance Ministry data shows 13.42 lakh UPI fraud cases
    in FY2024 — burst fraud on new accounts is the #1 pattern.`,
  },
  {
    id: 'P2',
    name: 'UPI ID typosquat',
    severity: 'critical',
    rule: `Flag merchants whose UPI Virtual Payment Address (VPA) contains
    deliberate misspellings of known brands, numeric substitutions, or unusual
    suffixes like numbers after a dot (e.g. brand.9@upi). These patterns are
    commonly used to impersonate legitimate businesses and deceive buyers into
    paying the wrong merchant.
    Real case: Wibmo fraud report documents spoofed VPAs mimicking PM Cares Fund.
    NPCI now maintains lists of high-risk VPA patterns.`,
  },
  {
    id: 'P3',
    name: 'High-ticket electronics new online account',
    severity: 'high',
    rule: `Flag accounts under 60 days old selling electronics with an average
    transaction value above Rs 10,000 on an online platform where buyers pay
    before receiving goods. This policy targets fake online electronics sellers
    on social media shops, marketplaces, and e-commerce platforms where buyers
    pay via UPI upfront based on photos and descriptions without physically
    inspecting the product. Do NOT apply to physical retail where customers
    inspect products before paying.
    Real case: October 2025 — Delhi Police arrested mastermind of fake Instagram
    Apple reseller "delhi_apple_store0" who collected Rs 65,782 from one victim
    across 29 UPI transactions for an iPhone 16 Pro never delivered. Total
    estimated fraud Rs 8-9 lakh across multiple victims.
    Source: thestatesman.com/cities/delhi-police-arrest-mastermind-of-fake-instagram-iphone-scam`,
  },
  {
    id: 'P4',
    name: 'Fake storefront with suspicious new website',
    severity: 'high',
    rule: `Only evaluate this policy when the merchant has provided a website URL.
    If no website is provided, skip this policy entirely — many legitimate Indian
    small merchants operate without a website and went digital during the UPI boom
    without building one. Absence of a website is NOT a fraud signal.
    When a website IS provided, flag if ALL of the following are true:
    (1) Domain was registered less than 30 days ago
    (2) No SSL certificate present
    (3) Zero pages indexed by Google
    (4) At least one other policy (P1, P2, or P3) is also triggered
    The fraud pattern this catches is a fraudster who creates both a new merchant
    account AND a fake website simultaneously to appear legitimate. A real business
    building a website at the same time as setting up UPI is not suspicious unless
    other fraud signals are also present.
    Real case: CERT-In advisory 2023 and CloudSEK Diwali 2024 report — fake domains
    mimicking Amazon and Flipkart surged during festive season. Domains go live for
    a single day, harvest payments, then disappear. Domain registration under 7 days
    is a confirmed red flag per cybersecurity researchers.
    Source: newsmobile.in/top-story/from-fake-websites-to-upi-fraud`,
  },
  {
    id: 'P5',
    name: 'Missing or invalid GST for high-volume business',
    severity: 'medium',
    rule: `This policy enforces a legal compliance requirement, not just a fraud
    heuristic. Under India's GST Act, any business earning more than Rs 20 lakh
    per year is legally required to register for GST. A merchant doing high volume
    without GST compliance is either operating illegally or is fraudulent.
    Flag merchants who meet ANY of these conditions:
    (1) Monthly GMV above Rs 2,00,000 with no GST number provided — this annualizes
        to Rs 24 lakh, above the legal threshold.
    (2) GST number provided but fails GSTIN format validation — valid format is:
        2-digit state code + 10-char PAN + 1 digit + Z + 1 check digit
        e.g. 27AAPFU0939F1ZV (state 27 = Maharashtra). A fraudster providing an
        invalidly formatted GSTIN is actively lying, not just informally operating.
    (3) GSTIN state code does not match stated business location AND the account
        is under 60 days old or has other fraud signals present. Do NOT flag
        state code mismatch alone for established accounts — large legitimate
        businesses hold GSTINs registered in a different state from their
        operating location when they have multi-state operations. A new account
        with a state mismatch is suspicious. An established account with a state
        mismatch and no other signals is likely a legitimate multi-state business
        and should at most be routed to REVIEW, never auto-rejected.
    (4) GSTIN lookup via apisetu.gov.in returns inactive or non-existent status.
    Do NOT flag merchants with no GSTIN at low volume — many legitimate Indian small
    merchants in the informal economy have no formal tax registration and never needed
    it. Only flag when volume is high enough to make non-registration illegal.
    Real case: Thane Cyber Police uncovered a Rs 75.48 crore fake GST racket
    (Nov 2024-Apr 2025) where fake companies filed bogus GST claims using stolen
    digital identities. A nationwide fake GST registration network spanning 23 states
    was unearthed using forged PAN and Aadhaar cards.
    Regulatory basis: RBI's October 2025 merchant KYC mandate and FREE-AI framework
    both require payment platforms to verify merchant GST compliance at onboarding.
    Source: the420.in/thane-cyber-police-fake-gst-scam-75-crore-fraud-network`,
  },
]
