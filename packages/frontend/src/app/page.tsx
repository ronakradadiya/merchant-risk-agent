import { MerchantForm } from '@/components/MerchantForm'

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Merchant Review</h1>
        <p className="mt-1 text-gray-600">
          Submit a merchant profile for AI-powered fraud risk assessment.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <MerchantForm />
      </div>
    </div>
  )
}
