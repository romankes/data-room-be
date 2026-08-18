BEGIN;

-- Preserve existing authorized recipients while making registration optional.
ALTER TABLE "ShareRecipient" ADD COLUMN "email" TEXT;

UPDATE "ShareRecipient" AS recipient
SET "email" = "User"."email"
FROM "User"
WHERE recipient."userId" = "User"."id";

ALTER TABLE "ShareRecipient" ALTER COLUMN "email" SET NOT NULL;

ALTER TABLE "ShareRecipient"
DROP CONSTRAINT "ShareRecipient_pkey",
DROP CONSTRAINT "ShareRecipient_userId_fkey",
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "ShareRecipient"
ADD CONSTRAINT "ShareRecipient_pkey" PRIMARY KEY ("shareId", "email"),
ADD CONSTRAINT "ShareRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ShareRecipient_email_revokedAt_idx"
ON "ShareRecipient"("email", "revokedAt");

COMMIT;
