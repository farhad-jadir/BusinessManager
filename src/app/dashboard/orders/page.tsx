'use client'
export const dynamic = 'force-dynamic'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

interface Order {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: string
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingStatus(id)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ))
    } else {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে')
    }
    setUpdatingStatus(null)
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('অর্ডারটি ডিলিট করতে চান? একবার ডিলিট করলে আর ফিরিয়ে আনা যাবে না।')) return

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (!error) {
      setOrders(orders.filter(order => order.id !== id))
    } else {
      alert('ডিলিট করতে সমস্যা হয়েছে')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, text: string, bg: string }> = {
      pending: { color: 'text-yellow-800', text: 'বাকি', bg: 'bg-yellow-100' },
      completed: { color: 'text-green-800', text: 'সম্পন্ন', bg: 'bg-green-100' },
      cancelled: { color: 'text-red-800', text: 'বাতিল', bg: 'bg-red-100' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{config.text}</span>
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || colors.pending
  }

  // ফিল্টারিং অর্ডার
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.customer_phone && order.customer_phone.includes(searchTerm))
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // পরিসংখ্যান
  const totalOrders = filteredOrders.length
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* হেডার সেকশন */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">অর্ডার সমূহ</h1>
            <p className="text-gray-600 mt-1">সমস্ত অর্ডার দেখুন ও পরিচালনা করুন</p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/orders/new'}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন অর্ডার
          </button>
        </div>

        {/* সার্চ ও ফিল্টার সেকশন */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* সার্চ বক্স */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="কাস্টমারের নাম বা ফোন নম্বর অনুসারে সার্চ করুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* স্ট্যাটাস ফিল্টার */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg transition flex-1 ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                সব ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg transition flex-1 ${
                  statusFilter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                বাকি ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg transition flex-1 ${
                  statusFilter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                সম্পন্ন ({orders.filter(o => o.status === 'completed').length})
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-2 rounded-lg transition flex-1 ${
                  statusFilter === 'cancelled' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                বাতিল ({orders.filter(o => o.status === 'cancelled').length})
              </button>
            </div>
          </div>
        </div>

        {/* পরিসংখ্যান কার্ড */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">মোট অর্ডার</p>
                <p className="text-3xl font-bold mt-1">{totalOrders}</p>
              </div>
              <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">মোট বিক্রি</p>
                <p className="text-3xl font-bold mt-1">৳{totalAmount.toLocaleString()}</p>
              </div>
              <svg className="w-10 h-10 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">বাকি অর্ডার</p>
                <p className="text-3xl font-bold mt-1">{pendingOrders}</p>
              </div>
              <svg className="w-10 h-10 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">সম্পন্ন অর্ডার</p>
                <p className="text-3xl font-bold mt-1">{completedOrders}</p>
              </div>
              <svg className="w-10 h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* অর্ডারের তালিকা টেবিল */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-3">লোড হচ্ছে...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600">কোনো অর্ডার পাওয়া যায়নি</p>
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  সব অর্ডার দেখুন
                </button>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600">কোনো অর্ডার নেই</p>
                <button 
                  onClick={() => window.location.href = '/dashboard/orders/new'}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  প্রথম অর্ডার নিন
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ক্রমিক</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">কাস্টমারের নাম</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ফোন</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">মোট মূল্য</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">তারিখ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ক্রিয়া</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.customer_phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">৳{order.total_amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `/dashboard/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            বিস্তারিত
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            disabled={updatingStatus === order.id}
                            className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(order.status)} ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                          >
                            <option value="pending" className="bg-yellow-100 text-yellow-800">বাকি</option>
                            <option value="completed" className="bg-green-100 text-green-800">সম্পন্ন</option>
                            <option value="cancelled" className="bg-red-100 text-red-800">বাতিল</option>
                          </select>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* ফুটার সেকশন */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
              <span>মোট {filteredOrders.length} টি অর্ডার দেখানো হচ্ছে</span>
              <div className="flex gap-4">
                <span>মোট বিক্রি: ৳{totalAmount.toLocaleString()}</span>
                {(searchTerm || statusFilter !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    ক্লিয়ার ফিল্টার
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}