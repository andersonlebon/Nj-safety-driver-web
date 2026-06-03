-- Passport / travel ID uploads for border transit (front + back verification)

ALTER TYPE "public"."document_type" ADD VALUE IF NOT EXISTS 'passport';
