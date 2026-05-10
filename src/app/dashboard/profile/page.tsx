'use client'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface Profile {
  business_name: string
  business_logo: string
  business_phone: string
  business_email: string
  business_address: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    business_logo: '',
    business_phone: '',
    business_email: '',
    business_address: ''
  })
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
    }
  }

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile({
        business_name: data.business_name || '',
        business_logo: data.business_logo || '',
        business_phone: data.business_phone || '',
        business_email: data.business_email || '',
        business_address: data.business_address || ''
      })
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('business-assets')
      .upload(filePath, file)

    if (uploadError) {
      setMessage('লোগো আপলোড করতে সমস্যা হয়েছে')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('business-assets')
      .getPublicUrl(filePath)

    setProfile({ ...profile, business_logo: publicUrl })
    setUploading(false)
    setMessage('লোগো আপলোড সফল')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        business_name: profile.business_name,
        business_logo: profile.business_logo,
        business_phone: profile.business_phone,
        business_email: profile.business_email,
        business_address: profile.business_address,
        updated_at: new Date()
      })

    if (error) {
      setMessage('প্রোফাইল সেভ করতে সমস্যা হয়েছে')
    } else {
      setMessage('প্রোফাইল সফলভাবে আপডেট হয়েছে!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-3">লোড হচ্ছে...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">প্রোফাইল সেটিংস</h1>
          <p className="text-gray-600 mt-1">আপনার ব্যবসার তথ্য পরিচালনা করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* লোগো আপলোড */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">ব্যবসার লোগো</h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {profile.business_logo ? (
                  <img src={profile.business_logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition inline-block">
                    {uploading ? 'আপলোড হচ্ছে...' : 'লোগো নির্বাচন করুন'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF (সর্বোচ্চ 2MB)</p>
              </div>
            </div>
          </div>

          {/* ব্যবসার তথ্য */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">ব্যবসার তথ্য</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ব্যবসার নাম
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={profile.business_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="যেমন: রহিম ট্রেডার্স"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ফোন নম্বর
                </label>
                <input
                  type="tel"
                  name="business_phone"
                  value={profile.business_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="০১XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ইমেইল
                </label>
                <input
                  type="email"
                  name="business_email"
                  value={profile.business_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ঠিকানা
                </label>
                <textarea
                  name="business_address"
                  value={profile.business_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="আপনার ব্যবসার সম্পূর্ণ ঠিকানা"
                />
              </div>
            </div>
          </div>

          {/* অ্যাকাউন্ট তথ্য */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">অ্যাকাউন্ট তথ্য</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                লগইন ইমেইল
              </label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">ইমেইল পরিবর্তন করতে সাপোর্টে যোগাযোগ করুন</p>
            </div>
          </div>

          {/* মেসেজ ও বাটন */}
          {message && (
            <div className={`p-3 rounded-lg ${message.includes('সফল') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'সেভ হচ্ছে...' : 'প্রোফাইল সেভ করুন'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}