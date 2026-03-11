-- AlterTable
ALTER TABLE "Team"
ADD COLUMN "sharePin" TEXT,
ADD COLUMN "enabledProducts" TEXT[] NOT NULL DEFAULT ARRAY['jersey','trousers','shorts','jacket','hoodie','travelPolo']::TEXT[];

-- AlterTable
ALTER TABLE "Player"
ADD COLUMN "trousersSizeUS" TEXT,
ADD COLUMN "shortsSizeUS" TEXT,
ADD COLUMN "jacketSizeUS" TEXT,
ADD COLUMN "hoodieSizeUS" TEXT,
ADD COLUMN "travelPoloSizeUS" TEXT;

-- CreateTable
CREATE TABLE "AdminOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminOtp_emailNormalized_expiresAt_idx" ON "AdminOtp"("emailNormalized", "expiresAt");
