export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          google_review_url: string;
          delay_hours: number;
          brand_logo_url: string | null;
          brand_primary_color: string | null;
          subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
          trial_ends_at: string;
          current_period_end: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          onboarding_completed_at: string | null;
          welcome_email_sent_at: string | null;
          campaign_email_sent_at: string | null;
          trial_ending_email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          google_review_url?: string;
          delay_hours?: number;
          brand_logo_url?: string | null;
          brand_primary_color?: string | null;
        };
        Update: {
          name?: string;
          google_review_url?: string;
          delay_hours?: number;
          brand_logo_url?: string | null;
          brand_primary_color?: string | null;
          subscription_status?: 'trialing' | 'active' | 'past_due' | 'canceled';
          trial_ends_at?: string;
          current_period_end?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          welcome_email_sent_at?: string | null;
          campaign_email_sent_at?: string | null;
          trial_ending_email_sent_at?: string | null;
        };
        Relationships: [];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'staff';
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'staff';
        };
        Update: {
          role?: 'owner' | 'admin' | 'staff';
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          email: string;
          phone: string | null;
          date_of_birth: string | null;
          source: string | null;
          unsubscribed_at: string | null;
          unsubscribed_sms_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          email: string;
          phone?: string | null;
          date_of_birth?: string | null;
          source?: string | null;
          unsubscribed_at?: string | null;
          unsubscribed_sms_at?: string | null;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          date_of_birth?: string | null;
          source?: string | null;
          unsubscribed_at?: string | null;
          unsubscribed_sms_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_tags: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          tag: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          recurrence_interval_days: number | null;
          default_price: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          recurrence_interval_days?: number | null;
          default_price?: number | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          recurrence_interval_days?: number | null;
          default_price?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          service_id: string | null;
          visited_at: string;
          price: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          service_id?: string | null;
          visited_at?: string;
          price?: number | null;
          notes?: string | null;
        };
        Update: {
          service_id?: string | null;
          visited_at?: string;
          price?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          purpose:
            | 'review_request'
            | 'review_reminder'
            | 'rebooking_reminder'
            | 'win_back'
            | 'birthday'
            | 'referral'
            | 'loyalty'
            | 'custom';
          channel: 'email' | 'sms' | 'whatsapp';
          journey_enrollment_id: string | null;
          sequence_step: number;
          status: 'pending' | 'sent' | 'failed' | 'cancelled';
          send_at: string;
          sent_at: string | null;
          attempts: number;
          max_attempts: number;
          next_attempt_at: string | null;
          last_error: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          purpose: string;
          channel?: 'email' | 'sms' | 'whatsapp';
          journey_enrollment_id?: string | null;
          sequence_step?: number;
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          send_at: string;
          sent_at?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          last_error?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          channel?: 'email' | 'sms' | 'whatsapp';
          sent_at?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          last_error?: string | null;
        };
        Relationships: [];
      };
      interaction_events: {
        Row: {
          id: string;
          business_id: string;
          message_id: string | null;
          customer_id: string | null;
          event_type: 'click' | 'review_confirmed' | 'feedback_submitted';
          occurred_at: string;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          business_id: string;
          message_id?: string | null;
          customer_id?: string | null;
          event_type: 'click' | 'review_confirmed' | 'feedback_submitted';
          occurred_at?: string;
          metadata?: Record<string, unknown>;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      private_feedback: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string | null;
          message_id: string | null;
          rating: number | null;
          comment: string;
          status: 'new' | 'acknowledged' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id?: string | null;
          message_id?: string | null;
          rating?: number | null;
          comment: string;
          status?: 'new' | 'acknowledged' | 'resolved';
        };
        Update: {
          status?: 'new' | 'acknowledged' | 'resolved';
        };
        Relationships: [];
      };
      journeys: {
        Row: {
          id: string;
          business_id: string;
          key: 'review_sequence' | 'rebooking_reminder' | 'win_back' | 'birthday';
          name: string;
          is_active: boolean;
          steps: Array<{ wait_hours: number; channel: 'email' | 'sms' | 'whatsapp'; purpose: string }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          key: 'review_sequence' | 'rebooking_reminder' | 'win_back' | 'birthday';
          name: string;
          is_active?: boolean;
          steps?: Array<{ wait_hours: number; channel: 'email' | 'sms' | 'whatsapp'; purpose: string }>;
        };
        Update: {
          name?: string;
          is_active?: boolean;
          steps?: Array<{ wait_hours: number; channel: 'email' | 'sms' | 'whatsapp'; purpose: string }>;
        };
        Relationships: [];
      };
      journey_enrollments: {
        Row: {
          id: string;
          journey_id: string;
          business_id: string;
          customer_id: string;
          current_step: number;
          status: 'active' | 'completed' | 'exited';
          enrolled_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          business_id: string;
          customer_id: string;
          current_step?: number;
          status?: 'active' | 'completed' | 'exited';
        };
        Update: {
          current_step?: number;
          status?: 'active' | 'completed' | 'exited';
        };
        Relationships: [];
      };
      segments: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          rule_definition: Array<{ field: string; operator: string; value: string | number }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          rule_definition?: Array<{ field: string; operator: string; value: string | number }>;
        };
        Update: {
          name?: string;
          rule_definition?: Array<{ field: string; operator: string; value: string | number }>;
        };
        Relationships: [];
      };
      loyalty_programs: {
        Row: {
          id: string;
          business_id: string;
          is_active: boolean;
          points_per_visit: number;
          points_per_referral: number;
          points_per_review: number;
          redemption_points: number;
          redemption_reward_description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          is_active?: boolean;
          points_per_visit?: number;
          points_per_referral?: number;
          points_per_review?: number;
          redemption_points?: number;
          redemption_reward_description?: string;
        };
        Update: {
          is_active?: boolean;
          points_per_visit?: number;
          points_per_referral?: number;
          points_per_review?: number;
          redemption_points?: number;
          redemption_reward_description?: string;
        };
        Relationships: [];
      };
      loyalty_ledger_entries: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          delta: number;
          reason: 'visit' | 'referral' | 'review' | 'redemption' | 'birthday' | 'manual';
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          delta: number;
          reason: 'visit' | 'referral' | 'review' | 'redemption' | 'birthday' | 'manual';
          reference_type?: string | null;
          reference_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          business_id: string;
          referrer_customer_id: string;
          referee_customer_id: string | null;
          code: string;
          status: 'pending' | 'completed';
          reward_granted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          referrer_customer_id: string;
          referee_customer_id?: string | null;
          code: string;
          status?: 'pending' | 'completed';
          reward_granted_at?: string | null;
        };
        Update: {
          referee_customer_id?: string | null;
          status?: 'pending' | 'completed';
          reward_granted_at?: string | null;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          id: string;
          business_id: string;
          total_rows: number;
          success_count: number;
          error_count: number;
          duplicate_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          total_rows?: number;
          success_count?: number;
          error_count?: number;
          duplicate_count?: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      review_requests: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          status: 'pending' | 'sent' | 'failed' | 'cancelled';
          send_at: string;
          sent_at: string | null;
          attempts: number;
          max_attempts: number;
          next_attempt_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          send_at: string;
          sent_at?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          last_error?: string | null;
        };
        Update: {
          status?: 'pending' | 'sent' | 'failed' | 'cancelled';
          sent_at?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          last_error?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'review_requests_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_requests_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      click_events: {
        Row: {
          id: string;
          business_id: string;
          review_request_id: string;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          review_request_id: string;
          clicked_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'click_events_business_id_fkey';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'click_events_review_request_id_fkey';
            columns: ['review_request_id'];
            isOneToOne: false;
            referencedRelation: 'review_requests';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export type Business = Database['public']['Tables']['businesses']['Row'];
export type BusinessMember = Database['public']['Tables']['business_members']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerTag = Database['public']['Tables']['customer_tags']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Visit = Database['public']['Tables']['visits']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type InteractionEvent = Database['public']['Tables']['interaction_events']['Row'];
export type PrivateFeedback = Database['public']['Tables']['private_feedback']['Row'];
export type Journey = Database['public']['Tables']['journeys']['Row'];
export type JourneyEnrollment = Database['public']['Tables']['journey_enrollments']['Row'];
export type Segment = Database['public']['Tables']['segments']['Row'];
export type LoyaltyProgram = Database['public']['Tables']['loyalty_programs']['Row'];
export type LoyaltyLedgerEntry = Database['public']['Tables']['loyalty_ledger_entries']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type ImportJob = Database['public']['Tables']['import_jobs']['Row'];
export type ReviewRequest = Database['public']['Tables']['review_requests']['Row'];
export type ClickEvent = Database['public']['Tables']['click_events']['Row'];
