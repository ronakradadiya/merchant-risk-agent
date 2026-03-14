import { Policy } from '@merchant-risk-agent/shared'

export const INDIA_UPI_FRAUD_POLICIES: Policy[] = [
  {
    id: 'P1',
    name: 'New account high velocity',
    severity: 'critical',
    rule: `Flag any merchant account less than 30 days old processing more than
    500 transactions per month. Legitimate businesses rarely achieve this velocity
    without an established presence. This pattern is strongly associated with
    burst fraud operations that maximize transactions before detection.`,
  },
  {
    id: 'P2',
    name: 'UPI ID typosquat',
    severity: 'critical',
    rule: `Flag merchants whose UPI Virtual Payment Address (VPA) contains
    deliberate misspellings of known brands, numeric substitutions, or unusual
    suffixes like numbers after a dot (e.g. brand.9@upi). These patterns are
    commonly used to impersonate legitimate businesses and deceive buyers into
    paying the wrong merchant.`,
  },
  {
    id: 'P3',
    name: 'High-ticket electronics new account',
    severity: 'high',
    rule: `Flag accounts under 60 days old selling electronics with an average
    transaction value above Rs 10,000. Electronics fraud is the #1 UPI scam
    category in India — buyers pay for iPhones, laptops, or TVs and receive
    nothing. Legitimate electronics businesses build reputation over months
    before handling high-value transactions.`,
  },
  {
    id: 'P4',
    name: 'No verifiable web presence',
    severity: 'high',
    rule: `Flag merchants whose website domain was registered less than 60 days
    ago, has no SSL certificate, or has zero pages indexed by Google. Legitimate
    businesses operating at scale have an established online presence. Scam
    storefronts are typically built days before launch and abandoned after
    collecting payments.`,
  },
  {
    id: 'P5',
    name: 'Location inconsistency',
    severity: 'medium',
    rule: `Flag merchants where the UPI bank registration city differs
    significantly from the stated business location. This pattern is common
    in remotely-operated scam businesses that claim to be local to build
    buyer trust while actually operating from a different state or city.`,
  },
  {
    id: 'P6',
    name: 'Missing GST for high-volume business',
    severity: 'medium',
    rule: `Flag electronics or high-value goods merchants with monthly GMV
    above Rs 2,00,000 who have no GST registration number. Indian businesses
    at this revenue scale are legally required to register for GST. Absence
    of GST registration at high volumes is a strong indicator of an
    unregistered or fraudulent operation.`,
  },
]
