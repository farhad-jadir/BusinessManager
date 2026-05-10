'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUserEmail(user.email || '')
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* সাইডবার */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">ব্যবসা ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-400 mt-2">{userEmail}</p>
        </div>
        <nav className="mt-8">
          <Link href="/dashboard" className="block px-6 py-3 hover:bg-gray-800 transition">
            📊 ড্যাশবোর্ড
          </Link>
          <Link href="/dashboard/products" className="block px-6 py-3 hover:bg-gray-800 transition">
            📦 পণ্য
          </Link>
          <Link href="/dashboard/orders" className="block px-6 py-3 hover:bg-gray-800 transition">
            🛒 অর্ডার
          </Link>
          <Link href="/dashboard/customers" className="block px-6 py-3 hover:bg-gray-800 transition">
            👥 কাস্টমার
          </Link>
<Link href="/dashboard/reports" className="block px-6 py-3 hover:bg-gray-800 transition">
  📈 রিপোর্টস
</Link>
<Link href="/dashboard/profile" className="block px-6 py-3 hover:bg-gray-800 transition">
  👤 প্রোফাইল
</Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-6 py-3 hover:bg-gray-800 transition mt-20 text-red-400"
          >
            🚪 লগআউট
          </button>
        </nav>
      </div>

      {/* মূল কন্টেন্ট */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  )
}