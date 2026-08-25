-- Enable Row-Level Security on every public table.
-- This app never talks to Supabase's client-side/PostgREST API (anon/authenticated
-- roles) — the Fastify backend connects with the postgres role via Prisma, which
-- owns these tables and bypasses RLS automatically. Enabling RLS with no policies
-- blocks the auto-generated public REST API (which respects RLS) while leaving the
-- backend fully functional. This closes the Supabase Security Advisor findings
-- "rls_disabled_in_public" and "sensitive_columns_exposed" for this project.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadReminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Banner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AmbassadorApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
