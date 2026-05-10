export interface Product {
  id: string
  user_id: string
  name: string
  price: number
  stock: number
  description?: string
  image_url?: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  status: string
  created_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  phone: string
  email?: string
  address?: string
  total_orders: number
  total_spent: number
  last_order_date: string | null
  created_at: string
}