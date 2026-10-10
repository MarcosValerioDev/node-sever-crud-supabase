-- Rename table (preserves data)
ALTER TABLE "User" RENAME TO "app_users";

-- Rename primary key constraint
ALTER TABLE "app_users" RENAME CONSTRAINT "User_pkey" TO "app_users_pkey";

-- Rename unique index
ALTER INDEX "User_email_key" RENAME TO "app_users_email_key";
