import { Policy } from '@merchant-risk-agent/shared'

export const INDIA_UPI_FRAUD_POLICIES: Policy[] = [
  {
    id: 'P1',
    name: 'New account high velocity',
    severity: 'critical',
    rule: `Flag any merchant account less than 30 days old processing more than
    500 transactions per month. Legitimate businesses rarely achieve this velocity
    without an established presence. This pattern is strongly associated with
    burst fraud operations that maximize transactions before detection.
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
    name: 'High-ticket electronics new account',
    severity: 'high',
    rule: `Flag accounts under 60 days old selling electronics with an average
    transaction value above Rs 10,000. Electronics fraud is the #1 UPI scam
    category in India — buyers pay for iPhones, laptops, or TVs and receive
    nothing. Legitimate electronics businesses build reputation over months
    before handling high-value transactions.
    Real case: September 2024 — gang defrauded Bajaj Electronics of Rs 4 crore
    via UPI chargebacks after receiving appliances.`,
  },
  {
    id: 'P4',
    name: 'No verifiable web presence',
    severity: 'high',
    rule: `Flag merchants whose website domain was registered less than 60 days
    ago, has no SSL certificate, or has zero pages indexed by Google. Legitimate
    businesses operating at scale have an established online presence. Scam
    storefronts are typically built days before launch and abandoned after
    collecting payments.
    Real case: CERT-In advisory 2023 — fake domains mimicking Amazon and Flipkart
    surged around Diwali. Indian Cybercrime Helpline received thousands of
    complaints about payments to these sites.`,
  },
  {
    id: 'P5',
    name: 'Location inconsistency',
    severity: 'medium',
    rule: `Flag merchants where two or more of these signals are inconsistent
    with their stated business location:
    (1) Mobile number prefix maps to a different Indian state — use TRAI
        numbering plan to resolve prefix to state.
    (2) Submission IP geolocation differs from stated location by more than
        500km — use ip-api.com to resolve IP to city/region.
    (3) Website server is hosted entirely outside India — check domain
        hosting IP via DNS + ip-api.com.
    Requiring two signals prevents false positives from VPNs or remote workers.
    Real case: Bajaj Electronics gang — accomplice in Rajasthan operating
    scams on a Hyderabad store. Cross-state location fraud is documented.`,
  },
  {
    id: 'P6',
    name: 'Missing GST for high-volume business',
    severity: 'medium',
    rule: `Flag high-value merchants who meet ANY of these conditions:
    (1) Monthly GMV above Rs 2,00,000 with no GST number provided — Indian
        businesses at this revenue are legally required to register under GST Act.
    (2) GST number provided but fails GSTIN format validation — valid format is:
        2-digit state code + 10-char PAN + 1 digit + Z + 1 check digit
        e.g. 27AAPFU0939F1ZV (state 27 = Maharashtra).
    (3) GSTIN state code does not match stated business location — e.g. state
        code 07 (Delhi) with a Mumbai address is a mismatch.
    (4) GSTIN lookup via apisetu.gov.in returns inactive or non-existent status.
    Real case: RBI enhanced fraud-risk directives now require payment platforms
    to verify merchant GST compliance. Merchant onboarding gaps are cited as
    a direct threat to UPI network integrity.`,
  },
]
