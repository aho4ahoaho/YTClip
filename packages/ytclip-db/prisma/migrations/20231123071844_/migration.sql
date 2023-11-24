/*
  Warnings:

  - You are about to drop the column `title` on the `VideoDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Clip` ADD COLUMN `memo` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT 'No Title';

-- AlterTable
ALTER TABLE `VideoDetail` DROP COLUMN `title`;
