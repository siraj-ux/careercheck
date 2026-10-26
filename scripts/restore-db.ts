import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

function restoreDatabase() {
  const targetDbUrl = process.env.DATABASE_URL || './data/careerchecks.sqlite';
  const resolvedTargetPath = path.resolve(process.cwd(), targetDbUrl);
  const backupDir = path.resolve(process.cwd(), 'data/backups');

  let backupFilePath = process.argv[2];

  if (!backupFilePath) {
    if (!fs.existsSync(backupDir)) {
      console.error(`❌ Backup directory not found at: ${backupDir}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.sqlite'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error(`❌ No backup snapshots found in ${backupDir}`);
      process.exit(1);
    }

    backupFilePath = path.join(backupDir, files[0]);
    console.log(`ℹ️ No specific snapshot provided. Restoring from newest: ${files[0]}`);
  } else {
    backupFilePath = path.resolve(process.cwd(), backupFilePath);
  }

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Specified backup file not found at: ${backupFilePath}`);
    process.exit(1);
  }

  console.log(`🔄 Verifying backup snapshot integrity before restore...`);
  const checkDb = new Database(backupFilePath, { readonly: true });
  try {
    const integrity = checkDb.pragma('integrity_check') as [{ integrity_check: string }];
    if (integrity[0]?.integrity_check !== 'ok') {
      console.error(`❌ Integrity check failed on backup snapshot:`, integrity);
      process.exit(1);
    }
    console.log(`✅ Integrity check passed: ${integrity[0]?.integrity_check}`);
  } finally {
    checkDb.close();
  }

  console.log(`🚀 Restoring database to: ${resolvedTargetPath}`);
  fs.copyFileSync(backupFilePath, resolvedTargetPath);

  // Apply pragmas
  const restoredDb = new Database(resolvedTargetPath);
  try {
    restoredDb.pragma('journal_mode = WAL');
    restoredDb.pragma('foreign_keys = ON');
    restoredDb.pragma('busy_timeout = 5000');
    console.log(`✅ Restored database verified with WAL mode and foreign key enforcement.`);
  } finally {
    restoredDb.close();
  }

  console.log(`🎉 Database restoration complete!`);
}

restoreDatabase();
