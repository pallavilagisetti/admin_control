require('dotenv').config({ path: './env.local' });
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async init() {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getExecutedMigrations() {
    const result = await query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  }

  async getPendingMigrations() {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return migrationFiles.filter(file => !executedMigrations.includes(file));
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Executing migration: ${filename}`);
    
    try {
      await query(sql);
      await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
      console.log(`✅ Migration ${filename} executed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message);
      throw error;
    }
  }

  async runMigrations() {
    await this.init();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => console.log(`  - ${migration}`));

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    console.log('🎉 All migrations completed successfully');
  }

  async rollbackMigration(filename) {
    console.log(`Rolling back migration: ${filename}`);
    
    try {
      // Remove from migrations table
      await query('DELETE FROM migrations WHERE filename = $1', [filename]);
      console.log(`✅ Migration ${filename} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Rollback of ${filename} failed:`, error.message);
      throw error;
    }
  }

  async getMigrationStatus() {
    await this.init();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const status = [];
    for (const filename of allMigrations) {
      const executed = executedMigrations.includes(filename);
      let executedAt = null;
      
      if (executed) {
        const result = await query('SELECT executed_at FROM migrations WHERE filename = $1', [filename]);
        executedAt = result.rows[0]?.executed_at;
      }
      
      status.push({
        filename,
        executed,
        executedAt
      });
    }

    return status;
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case 'up':
        await migrationManager.runMigrations();
        break;
      
      case 'status':
        const status = await migrationManager.getMigrationStatus();
        console.log('\nMigration Status:');
        console.log('================');
        status.forEach(migration => {
          const status = migration.executed ? '✅' : '⏳';
          const date = migration.executedAt ? 
            new Date(migration.executedAt).toLocaleString() : 'Not executed';
          console.log(`${status} ${migration.filename} - ${date}`);
        });
        break;
      
      case 'rollback':
        const filename = process.argv[3];
        if (!filename) {
          console.error('❌ Please specify migration filename to rollback');
          process.exit(1);
        }
        await migrationManager.rollbackMigration(filename);
        break;
      
      default:
        console.log('Usage:');
        console.log('  node migrate.js up        - Run pending migrations');
        console.log('  node migrate.js status   - Show migration status');
        console.log('  node migrate.js rollback <filename> - Rollback specific migration');
        break;
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager;



