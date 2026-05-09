'use client'

import DashboardLayout from '../../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Product } from '../../../../types'

interface CartItem {
  product: Product
  quantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [error, setError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .gt('stock', 0) // শুধু স্টক থাকা পণ্য দেখাবে
      .order('name')

    if (!error && data) {
      setProducts(data)
    }
    setFetchingProducts(false)
  }

  const addToCart = () => {
    if (!selectedProductId) {
      setError('একটি পণ্য নির্বাচন করুন')
      return
    }

    const product = products.find(p => p.id === selectedProductId)
    if (!product) return

    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        setError(`শুধু ${product.stock} টি স্টক আছে`)
        return
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      if (1 > product.stock) {
        setError(`শুধু ${product.stock} টি স্টক আছে`)
        return
      }
      setCart([...cart, { product, quantity: 1 }])
    }
    setSelectedProductId('')
    setError('')
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    if (newQuantity > product.stock) {
      setError(`শুধু ${product.stock} টি স্টক আছে`)
      return
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ))
    setError('')
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerName.trim()) {
      setError('কাস্টমারের নাম দিন')
      return
    }

    if (cart.length === 0) {
      setError('কমপক্ষে একটি পণ্য যোগ করুন')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('আপনি লগইন নন')
      setLoading(false)
      return
    }

    // ১. অর্ডার ইনসার্ট করুন
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          total_amount: getTotalAmount(),
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      setLoading(false)
      return
    }

    // ২. প্রতিটি পণ্যের জন্য স্টক আপডেট করুন
    for (const item of cart) {
      const newStock = item.product.stock - item.quantity
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product.id)

      if (stockError) {
        // কিছু ভুল হলে পুরো অর্ডার ডিলিট করুন
        await supabase.from('orders').delete().eq('id', order.id)
        setError(`স্টক আপডেট করতে সমস্যা: ${item.product.name}`)
        setLoading(false)
        return
      }
    }

    // ৩. সফল হলে অর্ডার পেজে রিডাইরেক্ট
    router.push('/dashboard/orders')
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">নতুন অর্ডার</h1>
            <p className="text-gray-600 mt-1">কাস্টমারের জন্য নতুন অর্ডার তৈরি করুন</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← ফিরে যান
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* বাম পাশে - কাস্টমার তথ্য ও পণ্য সিলেক্ট */}
          <div className="space-y-6">
            {/* কাস্টমার তথ্য ফর্ম */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">কাস্টমারের তথ্য</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    কাস্টমারের নাম *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="যেমন: মোঃ রহিম উদ্দিন"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ফোন নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="০১XXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* পণ্য সিলেক্ট */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">পণ্য যোগ করুন</h2>
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">পণ্য নির্বাচন করুন...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ৳{product.price} (স্টক: {product.stock})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addToCart}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  যোগ করুন
                </button>
              </div>
              {fetchingProducts && (
                <p className="text-gray-500 text-sm mt-2">পণ্য লোড হচ্ছে...</p>
              )}
              {products.length === 0 && !fetchingProducts && (
                <p className="text-yellow-600 text-sm mt-2">
                  কোনো পণ্য নেই। প্রথমে পণ্য যোগ করুন।
                </p>
              )}
            </div>
          </div>

          {/* ডান পাশে - কার্ট ও সামারি */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">অর্ডার সামারি</h2>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>কার্ট খালি</p>
                  <p className="text-sm mt-1">বাম পাশ থেকে পণ্য যোগ করুন</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {cart.map((item) => (
                      <div key={item.product.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">৳{item.product.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">মোট আইটেম:</span>
                      <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)} টি</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                      <span>মোট মূল্য:</span>
                      <span className="text-blue-600">৳{getTotalAmount().toLocaleString()}</span>
                    </div>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmit}
                      disabled={loading || cart.length === 0}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                    >
                      {loading ? 'অর্ডার হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}