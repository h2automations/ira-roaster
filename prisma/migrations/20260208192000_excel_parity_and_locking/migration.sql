-- Alter Team with template
ALTER TABLE "Team"
ADD COLUMN IF NOT EXISTS "rosterTemplate" TEXT NOT NULL DEFAULT 'sublimation';

ALTER TABLE "Team"
ALTER COLUMN "enabledProducts" SET DEFAULT ARRAY[
  'playingTShirt',
  'trousers',
  'trainingTShirt',
  'shorts',
  'travelJacket',
  'travelTrousers',
  'sleevelessJacket',
  'travelPolo',
  'hat',
  'cap'
]::TEXT[];

-- Alter Player with excel parity fields
ALTER TABLE "Player"
ADD COLUMN IF NOT EXISTS "gender" TEXT NOT NULL DEFAULT 'MEN',
ADD COLUMN IF NOT EXISTS "sleeveType" TEXT NOT NULL DEFAULT 'HALF',
ADD COLUMN IF NOT EXISTS "playingTShirtQty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "trousersQty" INTEGER,
ADD COLUMN IF NOT EXISTS "trainingTShirtSizeUS" TEXT,
ADD COLUMN IF NOT EXISTS "trainingTShirtQty" INTEGER,
ADD COLUMN IF NOT EXISTS "shortsQty" INTEGER,
ADD COLUMN IF NOT EXISTS "jacketQty" INTEGER,
ADD COLUMN IF NOT EXISTS "travelTrousersSizeUS" TEXT,
ADD COLUMN IF NOT EXISTS "travelTrousersQty" INTEGER,
ADD COLUMN IF NOT EXISTS "sleevelessJacketSizeUS" TEXT,
ADD COLUMN IF NOT EXISTS "sleevelessJacketQty" INTEGER,
ADD COLUMN IF NOT EXISTS "hoodieQty" INTEGER,
ADD COLUMN IF NOT EXISTS "travelPoloQty" INTEGER,
ADD COLUMN IF NOT EXISTS "hatQty" INTEGER,
ADD COLUMN IF NOT EXISTS "capQty" INTEGER;
