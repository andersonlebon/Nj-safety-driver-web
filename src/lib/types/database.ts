export type UserRole = "driver" | "agent" | "admin";
export type PaymentStatus = "unpaid" | "paid" | "pending";
export type DocumentType =
  | "identity"
  | "driver_license"
  | "insurance"
  | "technical_inspection"
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string;
          plate_number: string;
          brand: string | null;
          model: string | null;
          color: string | null;
          year: number | null;
          insurance_status: boolean;
          inspection_status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          plate_number: string;
          brand?: string | null;
          model?: string | null;
          color?: string | null;
          year?: number | null;
          insurance_status?: boolean;
          inspection_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          plate_number?: string;
          brand?: string | null;
          model?: string | null;
          color?: string | null;
          year?: number | null;
          insurance_status?: boolean;
          inspection_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          doc_type: DocumentType;
          file_path: string;
          file_name: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          doc_type: DocumentType;
          file_path: string;
          file_name?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          doc_type?: DocumentType;
          file_path?: string;
          file_name?: string | null;
          uploaded_at?: string;
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
