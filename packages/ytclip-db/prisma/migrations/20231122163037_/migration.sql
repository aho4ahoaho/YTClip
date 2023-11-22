/*
  Warnings:

  - Made the column `videoDataId` on table `Clip` required. This step will fail if there are existing NULL values in that column.
  - Made the column `videoDetailId` on table `Thumbnail` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Clip` DROP FOREIGN KEY `Clip_videoDataId_fkey`;

-- DropForeignKey
ALTER TABLE `Thumbnail` DROP FOREIGN KEY `Thumbnail_videoDetailId_fkey`;

-- AlterTable
ALTER TABLE `Clip` MODIFY `videoDataId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Thumbnail` MODIFY `videoDetailId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Clip` ADD CONSTRAINT `Clip_videoDataId_fkey` FOREIGN KEY (`videoDataId`) REFERENCES `Video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Thumbnail` ADD CONSTRAINT `Thumbnail_videoDetailId_fkey` FOREIGN KEY (`videoDetailId`) REFERENCES `VideoDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
