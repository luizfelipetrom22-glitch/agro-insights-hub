export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string
          target_id: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          target_id?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          target_id?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          active: boolean
          commodity: string
          condition: string
          created_at: string
          id: string
          phone: string | null
          threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          commodity: string
          condition: string
          created_at?: string
          id?: string
          phone?: string | null
          threshold: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          commodity?: string
          condition?: string
          created_at?: string
          id?: string
          phone?: string | null
          threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      buyer_profiles: {
        Row: {
          avatar_url: string | null
          avg_quantity: number | null
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          interests: string[]
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          avg_quantity?: number | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interests?: string[]
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          avg_quantity?: number | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interests?: string[]
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      contact_events: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string | null
          producer_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          producer_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          producer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          listing_id: string | null
          producer_id: string
          request_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string | null
          producer_id: string
          request_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string | null
          producer_id?: string
          request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          producer_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          producer_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          producer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          certifications: string[]
          city: string | null
          created_at: string
          description: string | null
          family_farming: boolean
          harvest: string | null
          id: string
          organic: boolean
          photos: string[]
          price: number | null
          product: string
          quantity: number
          state: string | null
          status: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications?: string[]
          city?: string | null
          created_at?: string
          description?: string | null
          family_farming?: boolean
          harvest?: string | null
          id?: string
          organic?: boolean
          photos?: string[]
          price?: number | null
          product: string
          quantity?: number
          state?: string | null
          status?: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications?: string[]
          city?: string | null
          created_at?: string
          description?: string | null
          family_farming?: boolean
          harvest?: string | null
          id?: string
          organic?: boolean
          photos?: string[]
          price?: number | null
          product?: string
          quantity?: number
          state?: string | null
          status?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      producer_seasons: {
        Row: {
          area_hectares: number | null
          created_at: string
          crop: string | null
          expected_yield_bags_ha: number | null
          freight_storage_cost_ha: number | null
          harvest_cost_ha: number | null
          id: string
          land_cost_ha: number | null
          operation_cost_ha: number | null
          season_name: string | null
          seeds_fertilizers_cost_ha: number | null
          target_margin_pct: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          crop?: string | null
          expected_yield_bags_ha?: number | null
          freight_storage_cost_ha?: number | null
          harvest_cost_ha?: number | null
          id?: string
          land_cost_ha?: number | null
          operation_cost_ha?: number | null
          season_name?: string | null
          seeds_fertilizers_cost_ha?: number | null
          target_margin_pct?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          crop?: string | null
          expected_yield_bags_ha?: number | null
          freight_storage_cost_ha?: number | null
          harvest_cost_ha?: number | null
          id?: string
          land_cost_ha?: number | null
          operation_cost_ha?: number | null
          season_name?: string | null
          seeds_fertilizers_cost_ha?: number | null
          target_margin_pct?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          crops: string[] | null
          farm_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          crops?: string[] | null
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          crops?: string[] | null
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          city: string | null
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          product: string
          quantity: number
          state: string | null
          status: string
          target_price: number | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          product: string
          quantity?: number
          state?: string | null
          status?: string
          target_price?: number | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          product?: string
          quantity?: number
          state?: string | null
          status?: string
          target_price?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: string
          created_at: string
          harvest: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          harvest?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          harvest?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          area_hectares: number
          created_at: string
          crop: string
          exchange_rate: number
          id: string
          input_cost: number
          price_per_bag: number
          result: Json | null
          updated_at: string
          user_id: string
          yield_bags_per_ha: number
        }
        Insert: {
          area_hectares?: number
          created_at?: string
          crop: string
          exchange_rate?: number
          id?: string
          input_cost?: number
          price_per_bag?: number
          result?: Json | null
          updated_at?: string
          user_id: string
          yield_bags_per_ha?: number
        }
        Update: {
          area_hectares?: number
          created_at?: string
          crop?: string
          exchange_rate?: number
          id?: string
          input_cost?: number
          price_per_bag?: number
          result?: Json | null
          updated_at?: string
          user_id?: string
          yield_bags_per_ha?: number
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_send_message: {
        Args: { _conversation_id: string; _sender: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_pair: { Args: { _a: string; _b: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      open_reports_count: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "user" | "admin"
      user_type: "produtor" | "comprador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
      user_type: ["produtor", "comprador"],
    },
  },
} as const
