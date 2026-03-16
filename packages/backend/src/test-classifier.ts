import 'dotenv/config'
import { MerchantInput } from '@merchant-risk-agent/shared'
import { classifyMerchant } from './agents/classifier'

const TEST_MERCHANTS: { label: string; expected: string; input: MerchantInput }[] = [
  // --- 5 Fraud cases ---
  {
    label: 'ShopEasy Electronics (typosquat + new + high-ticket)',
    expected: 'REJECT',
    input: {
      merchantName: 'ShopEasy Electronics',
      upiId: 'shopeas.y9@ybl',
      businessType: 'Electronics',
      accountAgeDays: 12,
      avgTransactionINR: 15000,
      websiteUrl: 'https://shopeasyelec.in',
      location: 'Delhi',
      transactionVolume30d: 750,
    },
  },
  {
    label: 'Delhi Mobile House (high velocity + electronics)',
    expected: 'REJECT',
    input: {
      merchantName: 'Delhi Mobile House',
      upiId: 'delhimobiles.x7@paytm',
      businessType: 'Electronics',
      accountAgeDays: 8,
      avgTransactionINR: 22000,
      websiteUrl: 'https://delhimobilehouse.in',
      location: 'Delhi',
      transactionVolume30d: 1200,
    },
  },
  {
    label: 'QuickLoans India (scam pattern)',
    expected: 'REJECT',
    input: {
      merchantName: 'QuickLoans India',
      upiId: 'quickloan.99@ybl',
      businessType: 'Financial Services',
      accountAgeDays: 5,
      avgTransactionINR: 50000,
      location: 'Mumbai',
      transactionVolume30d: 900,
    },
  },
  {
    label: 'FastCash Loans (brand impersonation)',
    expected: 'REJECT',
    input: {
      merchantName: 'FastCash Loans',
      upiId: 'fastcash.now9@paytm',
      businessType: 'Lending',
      accountAgeDays: 3,
      avgTransactionINR: 75000,
      location: 'Bangalore',
      transactionVolume30d: 600,
    },
  },
  {
    label: 'RealEstateDeals (no GST + high volume)',
    expected: 'REJECT',
    input: {
      merchantName: 'RealEstateDeals',
      upiId: 'realestate.deals5@ybl',
      businessType: 'Real Estate',
      accountAgeDays: 20,
      avgTransactionINR: 100000,
      websiteUrl: 'https://realestate-deals.in',
      location: 'Pune',
      transactionVolume30d: 300,
    },
  },
  // --- 3 Edge cases ---
  {
    label: 'TechBazaar Online (moderate risk)',
    expected: 'REJECT',
    input: {
      merchantName: 'TechBazaar Online',
      upiId: 'techbazarr@ybl',
      businessType: 'Electronics',
      accountAgeDays: 45,
      avgTransactionINR: 12000,
      websiteUrl: 'https://techbazaar.co.in',
      location: 'Hyderabad',
      transactionVolume30d: 400,
    },
  },
  {
    label: 'Mumbai Tiffin Co (borderline)',
    expected: 'REVIEW',
    input: {
      merchantName: 'Mumbai Tiffin Co',
      upiId: 'mumbaititffin@upi',
      businessType: 'Food & Catering',
      accountAgeDays: 25,
      avgTransactionINR: 350,
      location: 'Mumbai',
      transactionVolume30d: 600,
    },
  },
  {
    label: 'NewStartup Tech (new but legit signals)',
    expected: 'REVIEW',
    input: {
      merchantName: 'NewStartup Tech',
      upiId: 'newstartuptech@okaxis',
      businessType: 'Software Services',
      accountAgeDays: 15,
      avgTransactionINR: 5000,
      websiteUrl: 'https://newstartuptech.com',
      location: 'Bangalore',
      transactionVolume30d: 80,
      gstNumber: '29AABCU9603R1ZM',
    },
  },
  // --- 2 Legitimate cases ---
  {
    label: 'Priya Fashion Hub (established, low risk)',
    expected: 'APPROVE',
    input: {
      merchantName: 'Priya Fashion Hub',
      upiId: 'priyafashion@upi',
      businessType: 'Fashion & Apparel',
      accountAgeDays: 365,
      avgTransactionINR: 1200,
      websiteUrl: 'https://priyafashionhub.com',
      location: 'Jaipur',
      transactionVolume30d: 200,
      gstNumber: '08AABCU1234R1ZP',
      phoneNumber: '+919876543210',
    },
  },
  {
    label: 'Sharma Grocery Store (well-established)',
    expected: 'APPROVE',
    input: {
      merchantName: 'Sharma Grocery Store',
      upiId: 'sharmagrocery@okicici',
      businessType: 'Grocery',
      accountAgeDays: 730,
      avgTransactionINR: 500,
      websiteUrl: 'https://sharmagrocery.in',
      location: 'Lucknow',
      transactionVolume30d: 150,
      gstNumber: '09AABCU5678R1ZQ',
      phoneNumber: '+919123456789',
    },
  },
]

async function runTests() {
  console.log('=== Merchant Risk Classifier Test Suite ===\n')

  let passed = 0
  let failed = 0

  for (const test of TEST_MERCHANTS) {
    try {
      console.log(`Testing: ${test.label}`)
      console.log(`  Expected: ${test.expected}`)

      const decision = await classifyMerchant(test.input)

      const actual = decision.recommendedAction.toUpperCase()
      const match = actual === test.expected
      const status = match ? 'PASS' : 'MISMATCH'

      console.log(`  Result:   ${actual} (score: ${decision.riskScore})`)
      console.log(`  Status:   ${status}`)
      console.log(`  Policies: ${decision.policiesTriggered.length} triggered, ${decision.policiesPassed.length} passed`)
      console.log(`  Duration: ${decision.reviewDurationMs}ms`)
      console.log(`  Reasoning: ${decision.reasoning.substring(0, 120)}...`)
      console.log()

      if (match) passed++
      else failed++
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : err}`)
      console.log()
      failed++
    }
  }

  console.log('=== Results ===')
  console.log(`Passed: ${passed}/${TEST_MERCHANTS.length}`)
  console.log(`Failed: ${failed}/${TEST_MERCHANTS.length}`)
}

runTests().catch(console.error)
