/*
  Warnings:

  - The primary key for the `contacts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `linked_id` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_linked_id_fkey";

-- AlterTable
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "linked_id",
ADD COLUMN     "linked_id" INTEGER,
ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_linked_id_fkey" FOREIGN KEY ("linked_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
