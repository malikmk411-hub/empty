export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          slug: string
          name: string
          subtitle: string | null
          description: string
          fabric_details: string | null
          care_instructions: string | null
          material: string | null
          category_id: string | null
          subcategory: string | null
          price: number
          compare_at_price: number | null
          sale_price: number | null
          currency: string
          images: string[]
          tags: string[]
          status: string
          is_featured: boolean
          is_new: boolean
          is_limited_edition: boolean
          rating_avg: number
          rating_count: number
          total_stock: number
          sku: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          subtitle?: string | null
          description?: string
          fabric_details?: string | null
          care_instructions?: string | null
          material?: string | null
          category_id?: string | null
          subcategory?: string | null
          price: number
          compare_at_price?: number | null
          sale_price?: number | null
          currency?: string
          images?: string[]
          tags?: string[]
          status?: string
          is_featured?: boolean
          is_new?: boolean
          is_limited_edition?: boolean
          rating_avg?: number
          rating_count?: number
          total_stock?: number
          sku?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          subtitle?: string | null
          description?: string
          fabric_details?: string | null
          care_instructions?: string | null
          material?: string | null
          category_id?: string | null
          subcategory?: string | null
          price?: number
          compare_at_price?: number | null
          sale_price?: number | null
          currency?: string
          images?: string[]
          tags?: string[]
          status?: string
          is_featured?: boolean
          is_new?: boolean
          is_limited_edition?: boolean
          rating_avg?: number
          rating_count?: number
          total_stock?: number
          sku?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          size: string
          color: string | null
          color_hex: string | null
          stock: number
          reserved_stock: number
          sku: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          size: string
          color?: string | null
          color_hex?: string | null
          stock?: number
          reserved_stock?: number
          sku?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          size?: string
          color?: string | null
          color_hex?: string | null
          stock?: number
          reserved_stock?: number
          sku?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          email: string
          status: string
          payment_status: string
          subtotal: number
          shipping: number
          tax: number
          discount: number
          total: number
          currency: string
          shipping_address: Json
          billing_address: Json | null
          payment_method: string | null
          payment_ref: string | null
          notes: string | null
          tracking_number: string | null
          coupon_id: string | null
          discount_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          user_id?: string | null
          email: string
          status?: string
          payment_status?: string
          subtotal?: number
          shipping?: number
          tax?: number
          discount?: number
          total?: number
          currency?: string
          shipping_address: Json
          billing_address?: Json | null
          payment_method?: string | null
          payment_ref?: string | null
          notes?: string | null
          tracking_number?: string | null
          coupon_id?: string | null
          discount_id?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          email?: string
          status?: string
          payment_status?: string
          subtotal?: number
          shipping?: number
          tax?: number
          discount?: number
          total?: number
          currency?: string
          shipping_address?: Json
          billing_address?: Json | null
          payment_method?: string | null
          payment_ref?: string | null
          notes?: string | null
          tracking_number?: string | null
          coupon_id?: string | null
          discount_id?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          product_slug: string
          product_image: string | null
          size: string | null
          quantity: number
          unit_price: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          product_slug: string
          product_image?: string | null
          size?: string | null
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          product_slug?: string
          product_image?: string | null
          size?: string | null
          quantity?: number
          unit_price?: number
          line_total?: number
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string | null
          full_name: string
          phone: string
          address_line1: string
          address_line2: string | null
          city: string
          province: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string | null
          full_name: string
          phone: string
          address_line1: string
          address_line2?: string | null
          city: string
          province: string
          postal_code: string
          country?: string
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          label?: string | null
          full_name?: string
          phone?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          province?: string
          postal_code?: string
          country?: string
          is_default?: boolean
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          title: string | null
          body: string | null
          is_verified_purchase: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          title?: string | null
          body?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          title?: string | null
          body?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
      product_status: "draft" | "active" | "archived"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      discount_type: "percentage" | "fixed"
      discount_scope: "product" | "category" | "all"
      inventory_change_reason: "restock" | "sale" | "adjustment" | "return" | "reservation" | "release"
    }
  }
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Update"]
