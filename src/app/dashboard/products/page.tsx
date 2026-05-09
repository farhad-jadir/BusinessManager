'use client'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Product } from '../../../types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('পণ্যটি ডিলিট করতে চান? একবার ডিলিট করলে আর ফিরিয়ে আনা যাবে না।')) return
    
    setDeleteLoading(id)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!error) {
      setProducts(products.filter(p => p.id !== id))
    } else {
      alert('ডিলিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    }
    setDeleteLoading(null)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">স্টক শেষ</span>
    } else if (stock < 10) {
      return <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">স্বল্প স্টক ({stock})</span>
    } else {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{stock} টি</span>
    }
  }

  const totalProducts = filteredProducts.length
  const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0)
  const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.stock), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* হেডার সেকশন */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">পণ্য সমূহ</h1>
            <p className="text-gray-600 mt-1">আপনার সমস্ত পণ্যের তালিকা ও ব্যবস্থাপনা</p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/products/new'}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন পণ্য যোগ করুন
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
              placeholder="পণ্যের নাম অনুসারে সার্চ করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* পরিসংখ্যান কার্ড */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">মোট পণ্য</p>
                <p className="text-3xl font-bold mt-1">{totalProducts}</p>
              </div>
              <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">মোট স্টক</p>
                <p className="text-3xl font-bold mt-1">{totalStock}</p>
              </div>
              <svg className="w-10 h-10 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">মোট মূল্য</p>
                <p className="text-3xl font-bold mt-1">৳{totalValue.toLocaleString()}</p>
              </div>
              <svg className="w-10 h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* পণ্যের তালিকা টেবিল */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-3">লোড হচ্ছে...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            {searchTerm ? (
              <>
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600">"<span className="font-semibold">{searchTerm}</span>" অনুসারে কোনো পণ্য পাওয়া যায়নি</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  সব পণ্য দেখুন
                </button>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-600">কোনো পণ্য নেই</p>
                <button 
                  onClick={() => window.location.href = '/dashboard/products/new'}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  আপনার প্রথম পণ্য যোগ করুন
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">পণ্যের নাম</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">দাম</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">স্টক অবস্থা</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">তারিখ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ক্রিয়া</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">৳{product.price.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">{getStockBadge(product.stock)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => window.location.href = `/dashboard/products/edit/${product.id}`}
                            className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            এডিট
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            disabled={deleteLoading === product.id}
                            className="text-red-600 hover:text-red-800 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            {deleteLoading === product.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            ডিলিট
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* ফুটার সেকশন */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-sm text-gray-600">
              <span>মোট {filteredProducts.length} টি পণ্য দেখানো হচ্ছে</span>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ক্লিয়ার ফিল্টার
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}