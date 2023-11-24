-- AlterTable
ALTER TABLE `Clip` MODIFY `processed` ENUM('Processed', 'Processing', 'NoProcessed', 'Error') NOT NULL DEFAULT 'NoProcessed';

-- AlterTable
ALTER TABLE `Video` MODIFY `processed` ENUM('Processed', 'Processing', 'NoProcessed', 'Error') NOT NULL DEFAULT 'NoProcessed';
