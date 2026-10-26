import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

async function backupDatabase() {
  const dbUrl = process.env.DATABASE_URL || './data/careerchecks.sqlite';
  const resolvedDbPath = path.resolve(process.cwd(), dbUrl);

  if (!fs.existsSync(resolvedDbPath)) {
    console.error(`❌ Source database file not found at: ${resolvedDbPath}`);
    process.exit(1);
  }

  const backupDir = path.resolve(process.cwd(), 'data/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `careerchecks-backup-${timestamp}.sqlite`;
  const backupFilePath = path.join(backupDir, backupFilename);

  console.log(`📦 Initiating atomic SQLite backup...`);
  console.log(`   Source: ${resolvedDbPath}`);
  console.log(`   Target: ${backupFilePath}`);

  const sourceDb = new Database(resolvedDbPath);

  try {
    // Uses better-sqlite3 atomic online backup API
    await sourceDb.backup(backupFilePath);

    const stats = fs.statSync(backupFilePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup successfully completed! Size: ${sizeMb} MB`);
    console.log(`   File: ${backupFilePath}`);
  } catch (err) {
    console.error('\n❌ Backup failed:', err);
    process.exit(1);
  } finally {
    sourceDb.close();
  }
}

backupDatabase();
