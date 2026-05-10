'use client'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

// টাইপ ডিফাইন করার জন্য লোকাল ইন্টারফেস
interface Customer {
  id: string
  user_id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
  created_at: string
}

interface Order {
  id: string
  total_amount: number
  created_at: string
  status: string
  customer_phone: string
  user_id: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // প্রথমে কাস্টমারদের ডাটা আনি
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('total_spent', { ascending: false })

      if (!customersError && customersData) {
        // প্রতিটি কাস্টমারের জন্য অর্ডার কাউন্ট এবং টোটাল স্পেন্ট আপডেট করি
        for (const customer of customersData) {
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('customer_phone', customer.phone)
            .eq('status', 'completed')

          const totalOrders = orders?.length || 0
          const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
          const lastOrder = orders?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

          // কাস্টমার আপডেট করি
          await supabase
            .from('customers')
            .update({
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrder?.created_at || null
            })
            .eq('id', customer.id)
        }

        // আবার ফেচ করি আপডেটেড ডাটা
        const { data: updatedCustomers } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('total_spent', { ascending: false })

        setCustomers(updatedCustomers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerOrders = async (customer: Customer) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false })

      setCustomerOrders(orders || [])
      setSelectedCustomer(customer)
      setShowOrdersModal(true)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('customers')
        .insert([
          {
            user_id: user.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null,
            total_orders: 0,
            total_spent: 0,
            last_order_date: null
          }
        ])

      if (!error) {
        setShowAddModal(false)
        setFormData({ name: '', phone: '', email: '', address: '' })
        fetchCustomers()
      } else {
        alert('কাস্টমার যোগ করতে সমস্যা হয়েছে। ফোন নম্বর আগে থেকেই থাকতে পারে।')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('কাস্টমার যোগ করতে সমস্যা হয়েছে')
    } finally {
      setFormLoading(false)
    }
  }

  const deleteCustomer = async (id: string, phone: string) => {
    if (!confirm('এই কাস্টমারকে ডিলিট করতে চান? তার সমস্ত অর্ডার থাকবে কিন্তু কাস্টমার লিস্ট থেকে চলে যাবে।')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (!error) {
        setCustomers(customers.filter(c => c.id !== id))
      } else {
        alert('ডিলিট করতে সমস্যা হয়েছে')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('ডিলিট করতে সমস্যা হয়েছে')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const getStatusBadge = (totalSpent: number) => {
    if (totalSpent > 50000) {
      return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">প্লাটিনাম</span>
    } else if (totalSpent > 20000) {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">গোল্ড</span>
    } else if (totalSpent > 5000) {
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">সিলভার</span>
    } else {
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">নিয়মিত</span>
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* হেডার সেকশন */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">কাস্টমার ব্যবস্থাপনা</h1>
            <p className="text-gray-600 mt-1">আপনার সকল কাস্টমারের তালিকা ও ইতিহাস</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            নতুন কাস্টমার
          </button>
        </div>

        {/* সার্চ বার */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="নাম বা ফোন নম্বর অনুসারে সার্চ করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* কাস্টমার লিস্ট */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">{searchTerm ? 'কোনো কাস্টমার খুঁজে পাওয়া যায়নি' : 'কোনো কাস্টমার নেই'}</p>
            {!searchTerm && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                প্রথম কাস্টমার যোগ করুন
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
                      {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                    </div>
                    {getStatusBadge(customer.total_spent)}
                  </div>
                  
                  {customer.address && (
                    <p className="text-sm text-gray-600 mt-2 flex items-start gap-1">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {customer.address}
                    </p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">মোট অর্ডার</p>
                        <p className="font-semibold text-gray-900">{customer.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">মোট খরচ</p>
                        <p className="font-semibold text-blue-600">৳{customer.total_spent.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">শেষ অর্ডার</p>
                        <p className="text-sm text-gray-600">
                          {customer.last_order_date 
                            ? new Date(customer.last_order_date).toLocaleDateString('bn-BD')
                            : 'কোনো অর্ডার নেই'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => fetchCustomerOrders(customer)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      অর্ডার ইতিহাস
                    </button>
                    <button
                      onClick={() => deleteCustomer(customer.id, customer.phone)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* অর্ডার ইতিহাস মডাল */}
      {showOrdersModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedCustomer.name} - এর অর্ডার ইতিহাস</h2>
                <p className="text-sm text-gray-500 mt-1">ফোন: {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {customerOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">কোনো অর্ডার নেই</p>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">অর্ডার আইডি: {order.id.slice(0, 8)}...</p>
                          <p className="text-sm text-gray-500">
                            তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">৳{order.total_amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'completed' ? 'সম্পন্ন' : order.status === 'cancelled' ? 'বাতিল' : 'বাকি'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* নতুন কাস্টমার মডাল */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">নতুন কাস্টমার যোগ করুন</h2>
            </div>
            <form onSubmit={addCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">নাম *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ফোন নম্বর *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ইমেইল (ঐচ্ছিক)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ঠিকানা (ঐচ্ছিক)</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {formLoading ? 'যোগ হচ্ছে...' : 'কাস্টমার যোগ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}