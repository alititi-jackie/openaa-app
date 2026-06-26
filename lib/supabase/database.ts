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
      account_deletion_requests: {
        Row: {
          id: string
          metadata: Json
          processed_at: string | null
          reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["deletion_status"]
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_status"]
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_hash: string | null
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_module_permissions: {
        Row: {
          module_key: string
          permission_key: string
        }
        Insert: {
          module_key: string
          permission_key: string
        }
        Update: {
          module_key?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_module_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          name: string
          permission_key: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          name: string
          permission_key: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          name?: string
          permission_key?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          allowed: boolean
          permission_key: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          permission_key: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          permission_key?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          last_admin_login_at: string | null
          note: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          last_admin_login_at?: string | null
          note?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          last_admin_login_at?: string | null
          note?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_exemptions: {
        Row: {
          created_at: string
          exemption_key: string
          expires_at: string | null
          granted_by: string | null
          id: string
          is_enabled: boolean
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exemption_key: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exemption_key?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_exemptions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_exemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_modules: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          is_allowed: boolean
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_allowed?: boolean
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          is_allowed?: boolean
          module_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_modules_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_permissions: {
        Row: {
          created_at: string
          effect: Database["public"]["Enums"]["permission_effect"]
          granted_by: string | null
          id: string
          permission_key: string
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effect: Database["public"]["Enums"]["permission_effect"]
          granted_by?: string | null
          id?: string
          permission_key: string
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effect?: Database["public"]["Enums"]["permission_effect"]
          granted_by?: string | null
          id?: string
          permission_key?: string
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["permission_key"]
          },
          {
            foreignKeyName: "admin_user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          address: string | null
          contact_name: string | null
          content: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          ends_at: string | null
          external_url: string | null
          href: string | null
          id: string
          image_asset_id: string | null
          is_active: boolean
          link_type: string
          metadata: Json
          open_mode: string
          placement: string
          slug: string | null
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
          wechat: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          ends_at?: string | null
          external_url?: string | null
          href?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          link_type?: string
          metadata?: Json
          open_mode?: string
          placement: string
          slug?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
          wechat?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          ends_at?: string | null
          external_url?: string | null
          href?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          link_type?: string
          metadata?: Json
          open_mode?: string
          placement?: string
          slug?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
          wechat?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_category: string | null
          business_name: string
          business_profile: string | null
          city_id: string | null
          created_at: string
          id: string
          is_active: boolean
          is_public: boolean
          public_email: string | null
          public_phone: string | null
          public_wechat: string | null
          service_area: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_category?: string | null
          business_name: string
          business_profile?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          public_email?: string | null
          public_phone?: string | null
          public_wechat?: string | null
          service_area?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_category?: string | null
          business_name?: string
          business_profile?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          public_email?: string | null
          public_phone?: string | null
          public_wechat?: string | null
          service_area?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          metadata: Json
          name: string
          slug: string
          sort_order: number
          state_code: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          name: string
          slug: string
          sort_order?: number
          state_code: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json
          name?: string
          slug?: string
          sort_order?: number
          state_code?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      dmv_exam_results: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          passed: boolean
          score: number
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          passed: boolean
          score: number
          total: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          passed?: boolean
          score?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dmv_exam_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dmv_question_imports: {
        Row: {
          created_at: string
          id: string
          imported_count: number
          metadata: Json
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          imported_count?: number
          metadata?: Json
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          imported_count?: number
          metadata?: Json
          source?: string
        }
        Relationships: []
      }
      dmv_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          is_active: boolean
          language: string
          metadata: Json
          options: Json
          question_text: string
          sort_order: number
          source_question_id: string | null
          source_version: string | null
          state: string
          updated_at: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          options: Json
          question_text: string
          sort_order?: number
          source_question_id?: string | null
          source_version?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          options?: Json
          question_text?: string
          sort_order?: number
          source_question_id?: string | null
          source_version?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      dmv_user_progress: {
        Row: {
          answered_at: string
          is_correct: boolean | null
          question_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          is_correct?: boolean | null
          question_id: string
          user_id: string
        }
        Update: {
          answered_at?: string
          is_correct?: boolean | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dmv_user_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "dmv_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dmv_user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dmv_wrong_questions: {
        Row: {
          last_wrong_at: string
          question_id: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          last_wrong_at?: string
          question_id: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          last_wrong_at?: string
          question_id?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dmv_wrong_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "dmv_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dmv_wrong_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          allowed_roles: string[] | null
          city_id: string | null
          description: string | null
          is_enabled: boolean
          key: string
          metadata: Json
          module: string
          name: string
          updated_at: string
          visibility: Database["public"]["Enums"]["feature_visibility"]
        }
        Insert: {
          allowed_roles?: string[] | null
          city_id?: string | null
          description?: string | null
          is_enabled?: boolean
          key: string
          metadata?: Json
          module: string
          name: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feature_visibility"]
        }
        Update: {
          allowed_roles?: string[] | null
          city_id?: string | null
          description?: string | null
          is_enabled?: boolean
          key?: string
          metadata?: Json
          module?: string
          name?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feature_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      home_banners: {
        Row: {
          city_id: string | null
          created_at: string
          ends_at: string | null
          href: string | null
          id: string
          image_asset_id: string | null
          is_active: boolean
          open_mode: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          ends_at?: string | null
          href?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          open_mode?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          ends_at?: string | null
          href?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          open_mode?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_banners_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_banners_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections: {
        Row: {
          config: Json
          description: string | null
          is_visible: boolean
          key: string
          module: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json
          description?: string | null
          is_visible?: boolean
          key: string
          module: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          description?: string | null
          is_visible?: boolean
          key?: string
          module?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      image_assets: {
        Row: {
          bucket: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          entity_id: string | null
          entity_type: string | null
          external_host: string | null
          external_url: string | null
          height: number | null
          id: string
          is_deleted: boolean
          is_public: boolean
          metadata: Json
          mime_type: string | null
          owner_id: string | null
          public_url: string | null
          size_bytes: number | null
          source_type: Database["public"]["Enums"]["image_source_type"]
          path: string | null
          status: string
          storage_path: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          bucket?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          external_host?: string | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean
          metadata?: Json
          mime_type?: string | null
          owner_id?: string | null
          public_url?: string | null
          size_bytes?: number | null
          source_type?: Database["public"]["Enums"]["image_source_type"]
          path?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          bucket?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          external_host?: string | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean
          metadata?: Json
          mime_type?: string | null
          owner_id?: string | null
          public_url?: string | null
          size_bytes?: number | null
          source_type?: Database["public"]["Enums"]["image_source_type"]
          path?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_assets_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_ticker: {
        Row: {
          created_at: string
          ends_at: string | null
          href: string | null
          id: string
          is_enabled: boolean
          metadata: Json
          module: string
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          href?: string | null
          id?: string
          is_enabled?: boolean
          metadata?: Json
          module: string
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          href?: string | null
          id?: string
          is_enabled?: boolean
          metadata?: Json
          module?: string
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      latest_ticker_global_settings: {
        Row: {
          id: number
          interval_seconds: number
          is_enabled: boolean
        }
        Insert: {
          id?: number
          interval_seconds?: number
          is_enabled?: boolean
        }
        Update: {
          id?: number
          interval_seconds?: number
          is_enabled?: boolean
        }
        Relationships: []
      }
      latest_ticker_sections: {
        Row: {
          display_count: number
          is_enabled: boolean
          section_key: string
          section_name: string
          sort_order: number
        }
        Insert: {
          display_count?: number
          is_enabled?: boolean
          section_key: string
          section_name: string
          sort_order?: number
        }
        Update: {
          display_count?: number
          is_enabled?: boolean
          section_key?: string
          section_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      navigation_categories: {
        Row: {
          created_at: string
          description: string | null
          display_limit: number | null
          icon: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_limit?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_limit?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      navigation_links: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          icon: string | null
          icon_image_asset_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          metadata: Json
          open_mode: string
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          icon?: string | null
          icon_image_asset_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          open_mode?: string
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          icon?: string | null
          icon_image_asset_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          open_mode?: string
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "navigation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_links_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_links_icon_image_asset_id_fkey"
            columns: ["icon_image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          author_id: string | null
          body: string
          category_id: string | null
          cover_image_asset_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_error: string | null
          deletion_error_at: string | null
          excerpt: string | null
          id: string
          is_featured: boolean
          is_pinned: boolean
          metadata: Json
          pinned_order: number
          pinned_until: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category_id?: string | null
          cover_image_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_error?: string | null
          deletion_error_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          metadata?: Json
          pinned_order?: number
          pinned_until?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category_id?: string | null
          cover_image_asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_error?: string | null
          deletion_error_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          metadata?: Json
          pinned_order?: number
          pinned_until?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_posts_cover_image_asset_id_fkey"
            columns: ["cover_image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_posts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          metadata: Json
          target_type: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          metadata?: Json
          target_type?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          metadata?: Json
          target_type?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          id: string
          is_read: boolean
          link_url: string | null
          metadata: Json
          read_at: string | null
          target_id: string | null
          target_type: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          metadata?: Json
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          metadata?: Json
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_admin_events: {
        Row: {
          action: string | null
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          body: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          note: string | null
          notification_id: string | null
          post_id: string | null
          status_after: string | null
          status_before: string | null
          template_key: string | null
          title: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          body?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          note?: string | null
          notification_id?: string | null
          post_id?: string | null
          status_after?: string | null
          status_before?: string | null
          template_key?: string | null
          title?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          body?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          note?: string | null
          notification_id?: string | null
          post_id?: string | null
          status_after?: string | null
          status_before?: string | null
          template_key?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_admin_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_admin_events_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_admin_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_contacts: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          phone: string | null
          post_id: string
          preferred_contact_method: string | null
          updated_at: string
          wechat: string | null
          whatsapp: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          phone?: string | null
          post_id: string
          preferred_contact_method?: string | null
          updated_at?: string
          wechat?: string | null
          whatsapp?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          phone?: string | null
          post_id?: string
          preferred_contact_method?: string | null
          updated_at?: string
          wechat?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_contacts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_details_housing: {
        Row: {
          address_area: string | null
          available_date: string | null
          deposit_amount: number | null
          housing_type: string | null
          lease_term: string | null
          listing_type: string | null
          pets_allowed: boolean | null
          post_id: string
          rent_amount: number | null
          transit_nearby: string | null
          utilities_included: boolean | null
        }
        Insert: {
          address_area?: string | null
          available_date?: string | null
          deposit_amount?: number | null
          housing_type?: string | null
          lease_term?: string | null
          listing_type?: string | null
          pets_allowed?: boolean | null
          post_id: string
          rent_amount?: number | null
          transit_nearby?: string | null
          utilities_included?: boolean | null
        }
        Update: {
          address_area?: string | null
          available_date?: string | null
          deposit_amount?: number | null
          housing_type?: string | null
          lease_term?: string | null
          listing_type?: string | null
          pets_allowed?: boolean | null
          post_id?: string
          rent_amount?: number | null
          transit_nearby?: string | null
          utilities_included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "post_details_housing_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_details_jobs: {
        Row: {
          employer_type: string | null
          employment_type: string | null
          experience_requirement: string | null
          includes_housing: boolean | null
          includes_meals: boolean | null
          job_category: string | null
          language_requirement: string | null
          post_id: string
          requires_work_authorization: boolean | null
          wage_max: number | null
          wage_min: number | null
          wage_unit: string | null
          work_area: string | null
        }
        Insert: {
          employer_type?: string | null
          employment_type?: string | null
          experience_requirement?: string | null
          includes_housing?: boolean | null
          includes_meals?: boolean | null
          job_category?: string | null
          language_requirement?: string | null
          post_id: string
          requires_work_authorization?: boolean | null
          wage_max?: number | null
          wage_min?: number | null
          wage_unit?: string | null
          work_area?: string | null
        }
        Update: {
          employer_type?: string | null
          employment_type?: string | null
          experience_requirement?: string | null
          includes_housing?: boolean | null
          includes_meals?: boolean | null
          job_category?: string | null
          language_requirement?: string | null
          post_id?: string
          requires_work_authorization?: boolean | null
          wage_max?: number | null
          wage_min?: number | null
          wage_unit?: string | null
          work_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_details_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_details_marketplace: {
        Row: {
          condition: string | null
          delivery_options: string[] | null
          item_category: string | null
          listing_type: string | null
          negotiable: boolean | null
          post_id: string
          price_amount: number | null
          sold_at: string | null
          trade_area: string | null
        }
        Insert: {
          condition?: string | null
          delivery_options?: string[] | null
          item_category?: string | null
          listing_type?: string | null
          negotiable?: boolean | null
          post_id: string
          price_amount?: number | null
          sold_at?: string | null
          trade_area?: string | null
        }
        Update: {
          condition?: string | null
          delivery_options?: string[] | null
          item_category?: string | null
          listing_type?: string | null
          negotiable?: boolean | null
          post_id?: string
          price_amount?: number | null
          sold_at?: string | null
          trade_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_details_marketplace_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_details_services: {
        Row: {
          business_hours: Json | null
          post_id: string
          price_range: string | null
          service_area: string | null
          service_category: string | null
          service_status: string | null
        }
        Insert: {
          business_hours?: Json | null
          post_id: string
          price_range?: string | null
          service_area?: string | null
          service_category?: string | null
          service_status?: string | null
        }
        Update: {
          business_hours?: Json | null
          post_id?: string
          price_range?: string | null
          service_area?: string | null
          service_category?: string | null
          service_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_details_services_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_asset_id: string | null
          is_cover: boolean
          post_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_asset_id?: string | null
          is_cover?: boolean
          post_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_asset_id?: string | null
          is_cover?: boolean
          post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_images_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          admin_message_editable: string | null
          admin_message_fixed: string | null
          admin_reason: string | null
          contact_info: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          detail: string
          handled_at: string | null
          handled_by: string | null
          handler_id: string | null
          id: string
          notify_author: boolean
          post_action: string | null
          post_id: string
          reason: string
          related_url: string | null
          reporter_id: string | null
          resolved_at: string | null
          status: string
          updated_at: string
          visitor_id: string | null
        }
        Insert: {
          admin_message_editable?: string | null
          admin_message_fixed?: string | null
          admin_reason?: string | null
          contact_info?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          detail: string
          handled_at?: string | null
          handled_by?: string | null
          handler_id?: string | null
          id?: string
          notify_author?: boolean
          post_action?: string | null
          post_id: string
          reason: string
          related_url?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          visitor_id?: string | null
        }
        Update: {
          admin_message_editable?: string | null
          admin_message_fixed?: string | null
          admin_reason?: string | null
          contact_info?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          detail?: string
          handled_at?: string | null
          handled_by?: string | null
          handler_id?: string | null
          id?: string
          notify_author?: boolean
          post_action?: string | null
          post_id?: string
          reason?: string
          related_url?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_stats: {
        Row: {
          favorite_count: number
          post_id: string
          report_count: number
          updated_at: string
          view_count: number
        }
        Insert: {
          favorite_count?: number
          post_id: string
          report_count?: number
          updated_at?: string
          view_count?: number
        }
        Update: {
          favorite_count?: number
          post_id?: string
          report_count?: number
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_stats_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          body: string | null
          category: string | null
          city_id: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_source: string | null
          deletion_source: string | null
          deletion_error: string | null
          deletion_error_at: string | null
          expires_at: string | null
          hidden_at: string | null
          id: string
          last_admin_action: string | null
          last_admin_action_at: string | null
          last_admin_action_by: string | null
          last_admin_action_reason: string | null
          last_admin_action_template_key: string | null
          metadata: Json
          post_type: Database["public"]["Enums"]["post_type"]
          price_amount: number | null
          published_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          subcategory: string | null
          summary: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          city_id?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_source?: string | null
          deletion_source?: string | null
          deletion_error?: string | null
          deletion_error_at?: string | null
          expires_at?: string | null
          hidden_at?: string | null
          id?: string
          last_admin_action?: string | null
          last_admin_action_at?: string | null
          last_admin_action_by?: string | null
          last_admin_action_reason?: string | null
          last_admin_action_template_key?: string | null
          metadata?: Json
          post_type: Database["public"]["Enums"]["post_type"]
          price_amount?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subcategory?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          city_id?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_source?: string | null
          deletion_source?: string | null
          deletion_error?: string | null
          deletion_error_at?: string | null
          expires_at?: string | null
          hidden_at?: string | null
          id?: string
          last_admin_action?: string | null
          last_admin_action_at?: string | null
          last_admin_action_by?: string | null
          last_admin_action_reason?: string | null
          last_admin_action_template_key?: string | null
          metadata?: Json
          post_type?: Database["public"]["Enums"]["post_type"]
          price_amount?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subcategory?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_last_admin_action_by_fkey"
            columns: ["last_admin_action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          city_id: string | null
          created_at: string
          default_publish_contact_name: string | null
          email: string | null
          email_verified: boolean
          id: string
          last_active_at: string | null
          last_login_at: string | null
          location_area: string | null
          nickname: string | null
          phone: string | null
          preferred_contact_method: string | null
          private_metadata: Json
          public_metadata: Json
          publish_email: string | null
          publish_email_mode: string | null
          is_verified_user: boolean
          status: Database["public"]["Enums"]["profile_status"]
          trust_level: number
          updated_at: string
          wechat_id: string | null
          whatsapp: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string
          default_publish_contact_name?: string | null
          email?: string | null
          email_verified?: boolean
          id: string
          last_active_at?: string | null
          last_login_at?: string | null
          location_area?: string | null
          nickname?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          private_metadata?: Json
          public_metadata?: Json
          publish_email?: string | null
          publish_email_mode?: string | null
          is_verified_user?: boolean
          status?: Database["public"]["Enums"]["profile_status"]
          trust_level?: number
          updated_at?: string
          wechat_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          created_at?: string
          default_publish_contact_name?: string | null
          email?: string | null
          email_verified?: boolean
          id?: string
          last_active_at?: string | null
          last_login_at?: string | null
          location_area?: string | null
          nickname?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          private_metadata?: Json
          public_metadata?: Json
          publish_email?: string | null
          publish_email_mode?: string | null
          is_verified_user?: boolean
          status?: Database["public"]["Enums"]["profile_status"]
          trust_level?: number
          updated_at?: string
          wechat_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          actor_id: string
          count: number
          created_at: string
          id: string
          metadata: Json
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          actor_id: string
          count?: number
          created_at?: string
          id?: string
          metadata?: Json
          updated_at?: string
          window_start: string
        }
        Update: {
          action?: string
          actor_id?: string
          count?: number
          created_at?: string
          id?: string
          metadata?: Json
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          query: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          query: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          query?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_by: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_by?: string | null
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_by?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_events: {
        Row: {
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          event_type: string
          id: string
          ticket_id: string
        }
        Insert: {
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          event_type: string
          id?: string
          ticket_id: string
        }
        Update: {
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          event_type?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_note: string | null
          admin_reply: string | null
          closed_at: string | null
          contact_info: string | null
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          priority: string
          related_url: string | null
          source: string
          status: string
          target_id: string | null
          target_type: string | null
          ticket_no: string | null
          type: string
          updated_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          admin_note?: string | null
          admin_reply?: string | null
          closed_at?: string | null
          contact_info?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          priority?: string
          related_url?: string | null
          source?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
          ticket_no?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          admin_note?: string | null
          admin_reply?: string | null
          closed_at?: string | null
          contact_info?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          priority?: string
          related_url?: string | null
          source?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
          ticket_no?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_quick_links: {
        Row: {
          city_id: string | null
          created_at: string
          href: string
          icon: string | null
          id: string
          image_asset_id: string | null
          is_active: boolean
          key: string | null
          metadata: Json
          open_mode: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          href: string
          icon?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          key?: string | null
          metadata?: Json
          open_mode?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          href?: string
          icon?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          key?: string | null
          metadata?: Json
          open_mode?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_quick_links_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "image_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_quick_links_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_auth_identities: {
        Row: {
          created_at: string
          id: string
          provider: string
          provider_metadata: Json
          provider_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          provider_metadata?: Json
          provider_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          provider_metadata?: Json
          provider_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_auth_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted_at: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          id: string
          metadata: Json
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          id?: string
          metadata?: Json
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          consent_type?: Database["public"]["Enums"]["consent_type"]
          id?: string
          metadata?: Json
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          category: string | null
          created_at: string
          id: string
          target_id: string
          target_type: string
          target_url: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          target_url: string
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          target_url?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_navigation_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          open_mode: string
          sort_order: number
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          open_mode?: string
          sort_order?: number
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          open_mode?: string
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_navigation_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_navigation_settings: {
        Row: {
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_navigation_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_exemption: {
        Args: { p_exemption_key: string }
        Returns: boolean
      }
      has_admin_module: { Args: { p_module_key: string }; Returns: boolean }
      has_admin_permission: {
        Args: { p_permission_key: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_owner_super_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      is_public_post: { Args: { p_post_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      record_post_view: {
        Args: {
          p_post_id: string
          p_user_agent?: string
          p_visitor_id?: string
        }
        Returns: number
      }
      refresh_post_stats: { Args: { p_post_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "personal" | "business"
      admin_role: "super_admin" | "admin" | "editor" | "moderator" | "support"
      consent_type: "terms" | "privacy" | "community_guidelines"
      deletion_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "rejected"
      feature_visibility: "public" | "admin_only" | "beta" | "hidden"
      image_source_type: "storage" | "external"
      permission_effect: "allow" | "deny"
      post_status:
        | "draft"
        | "pending_review"
        | "published"
        | "hidden"
        | "rejected"
        | "expired"
        | "deleted"
      post_type: "job" | "housing" | "marketplace" | "service"
      post_visibility: "public" | "private"
      profile_status: "active" | "restricted" | "banned" | "pending"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      account_type: ["personal", "business"],
      admin_role: ["super_admin", "admin", "editor", "moderator", "support"],
      consent_type: ["terms", "privacy", "community_guidelines"],
      deletion_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "rejected",
      ],
      feature_visibility: ["public", "admin_only", "beta", "hidden"],
      image_source_type: ["storage", "external"],
      permission_effect: ["allow", "deny"],
      post_status: [
        "draft",
        "pending_review",
        "published",
        "hidden",
        "rejected",
        "expired",
        "deleted",
      ],
      post_type: ["job", "housing", "marketplace", "service"],
      post_visibility: ["public", "private"],
      profile_status: ["active", "restricted", "banned", "pending"],
    },
  },
} as const
