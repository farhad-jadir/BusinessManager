'use client'

import DashboardLayout from '../components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // পণ্য সংখ্যা
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // অর্ডার সংখ্যা
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        products: productsCount || 0,
        orders: ordersCount || 0,
        customers: 0, // পরে যোগ করব
      })
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">ড্যাশবোর্ড</h1>
      
      {/* স্ট্যাটাস কার্ড */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-2xl font-bold">{stats.products}</div>
          <div className="text-gray-600">মোট পণ্য</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl mb-2">🛒</div>
          <div className="text-2xl font-bold">{stats.orders}</div>
          <div className="text-gray-600">মোট অর্ডার</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats.customers}</div>
          <div className="text-gray-600">মোট কাস্টমার</div>
        </div>
      </div>

      {/* স্বাগতম বার্তা */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">স্বাগতম!</h2>
        <p className="text-gray-700">
          আপনার ব্যবসা পরিচালনা করতে সাইডবার থেকে অপশন নির্বাচন করুন।
        </p>
      </div>
    </DashboardLayout>
  )
}