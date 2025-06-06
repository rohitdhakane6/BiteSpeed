-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "linked_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_linked_id_fkey" FOREIGN KEY ("linked_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
