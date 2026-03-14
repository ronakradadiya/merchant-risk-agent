import { checkUpiPattern } from './agents/tools'

async function main() {
  const tests = [
    'shopeas.y9@ybl',
    'fastcash.now9@paytm',
    'quickloan.99@ybl',
    'delhimobiles.x7@paytm',
    'techbazarr@ybl',
    'priyafashion@upi',
    'sharmagrocery@okicici',
    'ananyacrafts@okaxis',
  ]

  console.log('=== UPI Pattern Checker Tests ===\n')
  for (const upi of tests) {
    const r = await checkUpiPattern(upi)
    console.log(`${upi}`)
    console.log(`  Typosquat: ${r.isTyposquat} (confidence: ${r.confidence})`)
    console.log(`  Closest brand: ${r.closestBrand || 'none'}`)
    if (r.reasons.length > 0) console.log(`  Reasons: ${r.reasons.join('; ')}`)
    console.log()
  }
}

main()
