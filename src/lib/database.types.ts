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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          google_review_url?: string;
          delay_hours?: number;
        };
        Update: {
          name?: string;
          google_review_url?: string;
          delay_hours?: number;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          email: string;
        };
        Update: {
          name?: string;
          email?: string;
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
      review_requests: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          status: 'pending' | 'sent' | 'failed';
          send_at: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          status?: 'pending' | 'sent' | 'failed';
          send_at: string;
          sent_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
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
export type Customer = Database['public']['Tables']['customers']['Row'];
export type ReviewRequest = Database['public']['Tables']['review_requests']['Row'];
export type ClickEvent = Database['public']['Tables']['click_events']['Row'];
