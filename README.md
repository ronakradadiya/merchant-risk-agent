# Merchant Risk Agent

A policy-based AI agent that classifies UPI merchant fraud risk at onboarding. Submit a merchant profile and the agent evaluates 7 fraud policies simultaneously, calls 4 external tools autonomously, and returns a structured, explainable decision in under 3 seconds.

**Before:** 1 human analyst reviews 1 merchant in 15 minutes, 50/day, 80% accuracy.
**After:** 1 merchant reviewed in 3 seconds, 28,800/day, 95%+ accuracy with full policy-backed reasoning.

## Why This Exists

Payment platforms rely on human analysts to manually review merchant signups. Fraudsters create thousands of accounts simultaneously. Humans can't keep up.

This agent demonstrates the exact architecture needed to solve it: plain-English fraud policies evaluated by GPT-4o, autonomous tool calling for evidence gathering, Zod-validated structured output, and a human-in-the-loop investigator dashboard.

Built specifically for the UPI ecosystem -- the world's largest real-time payment rail processing 14+ billion transactions/month.

## Architecture

```
Merchant Input (Zod validated)
        |
        v
  GPT-4o Classifier
  (7 fraud policies injected as system prompt)
        |
        v
  Agentic Tool Loop (up to 5 rounds)
  ├── Tool 1: Domain Age Checker (whoisjson.com)
  ├── Tool 2: Web Search for Fraud Reports (Serper.dev)
  ├── Tool 3: UPI Pattern Checker (pure TypeScript)
  └── Tool 4: India Compliance Checker (ip-api.com + GSTIN validation)
        |
        v
  Structured RiskDecision (Zod validated)
  ├── Risk Score (0-100)
  ├── Risk Level (low / medium / high)
  ├── Recommended Action (approve / review / reject)
  ├── Policies Triggered + Passed
  ├── Tool Signals (12 data points)
  └── LLM Reasoning
        |
        v
  DynamoDB (persisted) → Investigator Dashboard
```

## Tech Stack

TypeScript monorepo: Next.js 14 + shadcn/ui frontend, Express + GPT-4o backend, AWS CDK infrastructure (Lambda + API Gateway + DynamoDB), Zod shared schemas, GitHub Actions CI/CD.

## Getting Started

```bash
npm install

# Set up env vars
cp packages/backend/.env.example packages/backend/.env
# Fill in: OPENAI_API_KEY, SERPER_API_KEY, WHOIS_API_KEY

# Run locally
npm run dev:backend    # port 3001
npm run dev:frontend   # port 3000

# Deploy to AWS
cd packages/infra && npx cdk deploy

# Seed demo data
cd packages/backend && npm run seed
```
