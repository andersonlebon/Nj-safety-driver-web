export type UserRole = "driver" | "agent" | "admin";
export type PaymentStatus = "unpaid" | "paid" | "pending";
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
          doc_type: DocumentType;
          label: string | null;
          file_path: string;
          file_name: string | null;
          expires_at: string | null;
          verification_status: VerificationStatus;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          vehicle_id?: string | null;
          doc_type: DocumentType;
          label?: string | null;
          file_path: string;
          file_name?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          vehicle_id?: string | null;
          doc_type?: DocumentType;
          label?: string | null;
          file_path?: string;
          file_name?: string | null;
          expires_at?: string | null;
          verification_status?: VerificationStatus;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      vehicle_tracking_events: {
        Row: {
          id: string;
          vehicle_id: string | null;
          plate_number: string;
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
