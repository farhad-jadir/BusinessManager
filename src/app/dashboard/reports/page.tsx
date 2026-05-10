'use client'

import DashboardLayout from '../../../app/components/DashboardLayout'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface MonthlyData {
  month: string
  sales: number
  orders: number
}

interface TopProduct {
  name: string
  quantity: number
  total: number
}

interface Order {
  id: string
  total_amount: number
  created_at: string
  status: string
  user_id: string
}

// Custom label component for PieChart
const CustomPieLabel = ({ name, quantity }: { name?: string; quantity?: number }) => {
  return `${name}: ${quantity} টি`
}

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [dateRange, setDateRange] = useState<string>('6')

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const months = parseInt(dateRange)

      const monthlySales: Record<
        string,
        { sales: number; orders: number }
      > = {}

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)

        const monthName = date.toLocaleString('bn-BD', {
          month: 'long',
        })

        monthlySales[monthName] = {
          sales: 0,
          orders: 0,
        }
      }

      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error(error)
        return
      }

      const orders: Order[] = data || []

      if (orders.length > 0) {
        orders.forEach((order) => {
          const date = new Date(order.created_at)

          const monthName = date.toLocaleString('bn-BD', {
            month: 'long',
          })

          if (monthlySales[monthName]) {
            monthlySales[monthName].sales += Number(order.total_amount || 0)
            monthlySales[monthName].orders += 1
          }
        })
      }

      const chartData: MonthlyData[] = Object.entries(monthlySales).map(
        ([month, data]) => ({
          month,
          sales: data.sales,
          orders: data.orders,
        })
      )

      setMonthlyData(chartData)

      const total = orders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      )

      setTotalRevenue(total)
      setTotalOrders(orders.length)
      setAverageOrderValue(
        orders.length > 0 ? total / orders.length : 0
      )

      // Demo products
      const demoProducts: TopProduct[] = [
        {
          name: 'প্রোডাক্ট ১',
          quantity: 45,
          total: 45000,
        },
        {
          name: 'প্রোডাক্ট ২',
          quantity: 32,
          total: 32000,
        },
        {
          name: 'প্রোডাক্ট ৩',
          quantity: 28,
          total: 28000,
        },
      ]

      setTopProducts(demoProducts)
    } catch (error) {
      console.error('Reports Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Business tips logic outside JSX for better TypeScript handling
  const getBusinessTips = () => {
    const tips = []

    if (averageOrderValue < 1000 && averageOrderValue > 0) {
      tips.push('💡 আপনার গড় অর্ডার মান কম। ক্রস-সেল বা আপসেল করার চেষ্টা করুন।')
    }

    if (totalOrders < 10 && totalOrders > 0) {
      tips.push('💡 অর্ডার সংখ্যা বাড়াতে মার্কেটিং কার্যক্রম জোরদার করুন।')
    }

    if (topProducts.length > 0) {
      const firstProduct = topProducts[0]
      if (firstProduct && firstProduct.quantity > 40) {
        tips.push(`💡 আপনার টপ প্রোডাক্ট "${firstProduct.name}" খুব ভালো বিক্রি হচ্ছে। এটির স্টক সবসময় রাখুন।`)
      }
    }

    if (monthlyData.length > 1) {
      const lastMonth = monthlyData[monthlyData.length - 1]
      const firstMonth = monthlyData[0]
      if (lastMonth && firstMonth && lastMonth.sales > firstMonth.sales) {
        tips.push('📈 বিক্রি বৃদ্ধি পাচ্ছে! ধারাবাহিকতা বজায় রাখুন।')
      }
    }

    return tips
  }

  const businessTips = getBusinessTips()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              রিপোর্ট ও বিশ্লেষণ
            </h1>

            <p className="mt-1 text-gray-600">
              আপনার ব্যবসার গুরুত্বপূর্ণ পরিসংখ্যান
            </p>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3">গত ৩ মাস</option>
            <option value="6">গত ৬ মাস</option>
            <option value="12">গত ১২ মাস</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>

            <p className="mt-3 text-gray-600">লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Revenue */}
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">মোট আয়</p>

                    <p className="mt-1 text-3xl font-bold">
                      ৳{totalRevenue.toLocaleString()}
                    </p>
                  </div>

                  <svg
                    className="h-12 w-12 text-blue-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Orders */}
              <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-6 text-white shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100">মোট অর্ডার</p>

                    <p className="mt-1 text-3xl font-bold">
                      {totalOrders}
                    </p>
                  </div>

                  <svg
                    className="h-12 w-12 text-green-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>

              {/* Average */}
              <div className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-100">
                      গড় অর্ডার মান
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      ৳
                      {Math.round(
                        averageOrderValue
                      ).toLocaleString()}
                    </p>
                  </div>

                  <svg
                    className="h-12 w-12 text-purple-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Line Chart */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">
                  মাসিক বিক্রির প্রবণতা
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3B82F6"
                      name="বিক্রি (৳)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">
                  মাসিক অর্ডার সংখ্যা
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="orders"
                      fill="#10B981"
                      name="অর্ডার সংখ্যা"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">
                  শীর্ষ বিক্রি পণ্য
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="quantity"
                      nameKey="name"
                      labelLine={false}
                      label={CustomPieLabel}
                    >
                      {topProducts.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">
                  বিক্রি সারাংশ
                </h2>

                <div className="space-y-3">
                  {monthlyData.map((data, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <span className="font-medium">
                        {data.month}
                      </span>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          বিক্রি: ৳
                          {data.sales.toLocaleString()}
                        </p>

                        <p className="text-xs text-gray-500">
                          অর্ডার: {data.orders} টি
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Business Tips */}
            {businessTips.length > 0 && (
              <div className="rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>

                  ব্যবসার পরামর্শ
                </h2>

                <div className="space-y-2 text-gray-700">
                  {businessTips.map((tip, index) => (
                    <p key={index}>{tip}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}