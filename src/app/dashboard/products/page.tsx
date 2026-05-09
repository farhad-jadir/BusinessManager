'use client'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Product } from '../../../types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!confirm('পণ্যটি ডিলিট করতে চান?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!error) {
      setProducts(products.filter(p => p.id !== id))
    } else {
      alert('ডিলিট করতে সমস্যা হয়েছে')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">পণ্য সমূহ</h1>
        <button 
          onClick={() => window.location.href = '/dashboard/products/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + নতুন পণ্য
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">লোড হচ্ছে...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">কোনো পণ্য নেই। প্রথম পণ্য যোগ করুন!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">নাম</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">দাম</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">স্টক</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">ক্রিয়া</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">৳{product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ডিলিট
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}