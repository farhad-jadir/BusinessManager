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