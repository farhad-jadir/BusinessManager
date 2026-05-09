'use client'

import DashboardLayout from '../../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: string
  created_at: string
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setOrder(data)
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'বাকি' },
      completed: { color: 'bg-green-100 text-green-800', text: 'সম্পন্ন' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'বাতিল' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>{config.text}</span>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">লোড হচ্ছে...</div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p className="text-red-600">অর্ডারটি পাওয়া যায়নি</p>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← অর্ডার পেজে ফিরে যান
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">অর্ডার ডিটেইলস</h1>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← অর্ডার লিস্ট
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">অর্ডার আইডি</p>
                <p className="font-mono text-sm">{order.id}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">কাস্টমারের তথ্য</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">নাম</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ফোন নম্বর</p>
                  <p className="font-medium">{order.customer_phone || 'নেই'}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">অর্ডারের তথ্য</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">মোট মূল্য</p>
                  <p className="text-2xl font-bold text-blue-600">৳{order.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">তারিখ</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString('bn-BD')}</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
              >
                অর্ডার পেজে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}