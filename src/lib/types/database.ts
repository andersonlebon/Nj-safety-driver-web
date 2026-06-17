export type UserRole = "driver" | "agent" | "admin";
export type PaymentStatus = "unpaid" | "paid" | "pending";
export type TransactionStatus = "initialized" | "unpaid" | "paid" | "pending";
export type VerificationStatus =
  | "pending_documents"
  | "pending_review"
  | "active"
  | "rejected";
export type TrackingEventType =
  | "infraction"
  | "agent_checkin"
  | "registration"
  | "verification"
  | "note";
export type AgentApplicationStatus = "pending" | "approved" | "rejected";
export type DocumentType =
  | "identity"
  | "driver_license"
  | "insurance"
  | "technical_inspection"
  | "vehicle_photo"
  | "vehicle_registration"
  | "passport"
  | "other";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          national_id: string | null;
          driver_license: string | null;
          address: string | null;
          email: string | null;
          onboarded_at: string | null;
          verification_status: VerificationStatus;
          admin_message: string | null;
          agent_application_status: AgentApplicationStatus | null;
          agent_badge_id: string | null;
          agent_application_note: string | null;
          nationality_country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          national_id?: string | null;
          driver_license?: string | null;
          address?: string | null;
          email?: string | null;
          onboarded_at?: string | null;
          verification_status?: VerificationStatus;
          admin_message?: string | null;
          agent_application_status?: AgentApplicationStatus | null;
          agent_badge_id?: string | null;
          agent_application_note?: string | null;
          nationality_country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          national_id?: string | null;
          driver_license?: string | null;
          address?: string | null;
          email?: string | null;
          onboarded_at?: string | null;
          verification_status?: VerificationStatus;
          admin_message?: string | null;
          agent_application_status?: AgentApplicationStatus | null;
          agent_badge_id?: string | null;
          agent_application_note?: string | null;
          nationality_country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_profiles: {
        Row: {
          profile_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_profiles: {
        Row: {
          profile_id: string;
          badge_id: string | null;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          badge_id?: string | null;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          badge_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          profile_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profile_links: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          profile_type: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          profile_type: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string;
          profile_type?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string | null;
          plate_number: string;
          registration_country: string;
          is_foreign: boolean;
          is_border_transit: boolean;
          border_checkpoint: string | null;
          border_entry_at: string | null;
          transit_driver_name: string | null;
          transit_driver_phone: string | null;
          transit_passport_id: string | null;
          foreign_notes: string | null;
          brand: string | null;
          model: string | null;
          color: string | null;
          year: number | null;
          insurance_status: boolean;
          inspection_status: boolean;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          plate_number: string;
          registration_country?: string;
          is_foreign?: boolean;
          is_border_transit?: boolean;
          border_checkpoint?: string | null;
          border_entry_at?: string | null;
          transit_driver_name?: string | null;
          transit_driver_phone?: string | null;
          transit_passport_id?: string | null;
          foreign_notes?: string | null;
          brand?: string | null;
          model?: string | null;
          color?: string | null;
          year?: number | null;
          insurance_status?: boolean;
          inspection_status?: boolean;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          plate_number?: string;
          registration_country?: string;
          is_foreign?: boolean;
          is_border_transit?: boolean;
          border_checkpoint?: string | null;
          border_entry_at?: string | null;
          transit_driver_name?: string | null;
          transit_driver_phone?: string | null;
          transit_passport_id?: string | null;
          foreign_notes?: string | null;
          brand?: string | null;
          model?: string | null;
          color?: string | null;
          year?: number | null;
          insurance_status?: boolean;
          inspection_status?: boolean;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          vehicle_id: string | null;
          group_id: string | null;
          doc_type: DocumentType;
          label: string | null;
          file_path: string;
          file_name: string | null;
          file_hash: string | null;
          expires_at: string | null;
          verification_status: VerificationStatus;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          vehicle_id?: string | null;
          group_id?: string | null;
          doc_type: DocumentType;
          label?: string | null;
          file_path: string;
          file_name?: string | null;
          file_hash?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          vehicle_id?: string | null;
          group_id?: string | null;
          doc_type?: DocumentType;
          label?: string | null;
          file_path?: string;
          file_name?: string | null;
          file_hash?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      document_groups: {
        Row: {
          id: string;
          owner_id: string;
          vehicle_id: string | null;
          doc_type: DocumentType;
          issued_at: string | null;
          expires_at: string | null;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          vehicle_id?: string | null;
          doc_type: DocumentType;
          issued_at?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          vehicle_id?: string | null;
          doc_type?: DocumentType;
          issued_at?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicle_tracking_events: {
        Row: {
          id: string;
          vehicle_id: string | null;
          plate_number: string;
          registration_country: string | null;
          event_type: TrackingEventType;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          recorded_by: string | null;
          infraction_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id?: string | null;
          plate_number: string;
          registration_country?: string | null;
          event_type: TrackingEventType;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          recorded_by?: string | null;
          infraction_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string | null;
          plate_number?: string;
          registration_country?: string | null;
          event_type?: TrackingEventType;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          recorded_by?: string | null;
          infraction_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      infractions: {
        Row: {
          id: string;
          plate_number: string;
          registration_country: string | null;
          vehicle_id: string | null;
          driver_id: string | null;
          agent_id: string | null;
          infraction_type: string;
          description: string | null;
          location: string | null;
          fine_amount: number;
          status: PaymentStatus;
          evidence_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plate_number: string;
          registration_country?: string | null;
          vehicle_id?: string | null;
          driver_id?: string | null;
          agent_id?: string | null;
          infraction_type: string;
          description?: string | null;
          location?: string | null;
          fine_amount?: number;
          status?: PaymentStatus;
          evidence_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plate_number?: string;
          registration_country?: string | null;
          vehicle_id?: string | null;
          driver_id?: string | null;
          agent_id?: string | null;
          infraction_type?: string;
          description?: string | null;
          location?: string | null;
          fine_amount?: number;
          status?: PaymentStatus;
          evidence_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          infraction_id: string;
          amount: number;
          status: TransactionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          infraction_id: string;
          amount?: number;
          status?: TransactionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          infraction_id?: string;
          amount?: number;
          status?: TransactionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      infraction_templates: {
        Row: {
          id: string;
          code: string;
          label: string;
          amount: number;
          points: number;
          category: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          amount?: number;
          points?: number;
          category?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          amount?: number;
          points?: number;
          category?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_messages: {
        Row: {
          id: string;
          driver_id: string;
          sender_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          sender_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          sender_id?: string | null;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      payment_status: PaymentStatus;
      transaction_status: TransactionStatus;
      document_type: DocumentType;
      verification_status: VerificationStatus;
      tracking_event_type: TrackingEventType;
      agent_application_status: AgentApplicationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
