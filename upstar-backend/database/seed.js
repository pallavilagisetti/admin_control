require('dotenv').config({ path: './env.local' });
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

class SeederManager {
  constructor() {
    this.seedsPath = path.join(__dirname, 'seeds');
  }

  async init() {
    // Create seeds table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getExecutedSeeds() {
    const result = await query('SELECT filename FROM seeds ORDER BY id');
    return result.rows.map(row => row.filename);
  }

  async getPendingSeeds() {
    const executedSeeds = await this.getExecutedSeeds();
    const seedFiles = fs.readdirSync(this.seedsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return seedFiles.filter(file => !executedSeeds.includes(file));
  }

  async executeSeed(filename) {
    const filePath = path.join(this.seedsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Executing seed: ${filename}`);
    
    try {
      await query(sql);
      await query('INSERT INTO seeds (filename) VALUES ($1)', [filename]);
      console.log(`✅ Seed ${filename} executed successfully`);
    } catch (error) {
      console.error(`❌ Seed ${filename} failed:`, error.message);
      throw error;
    }
  }

  async runSeeds() {
    await this.init();
    
    const pendingSeeds = await this.getPendingSeeds();
    
    if (pendingSeeds.length === 0) {
      console.log('✅ No pending seeds');
      return;
    }

    console.log(`Found ${pendingSeeds.length} pending seeds:`);
    pendingSeeds.forEach(seed => console.log(`  - ${seed}`));

    for (const seed of pendingSeeds) {
      await this.executeSeed(seed);
    }

    console.log('🎉 All seeds completed successfully');
  }

  async rollbackSeed(filename) {
    console.log(`Rolling back seed: ${filename}`);
    
    try {
      // Remove from seeds table
      await query('DELETE FROM seeds WHERE filename = $1', [filename]);
      console.log(`✅ Seed ${filename} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Rollback of ${filename} failed:`, error.message);
      throw error;
    }
  }

  async getSeedStatus() {
    await this.init();
    
    const executedSeeds = await this.getExecutedSeeds();
    const allSeeds = fs.readdirSync(this.seedsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const status = [];
    for (const filename of allSeeds) {
      const executed = executedSeeds.includes(filename);
      let executedAt = null;
      
      if (executed) {
        const result = await query('SELECT executed_at FROM seeds WHERE filename = $1', [filename]);
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

  async resetDatabase() {
    console.log('⚠️  WARNING: This will delete all data in the database!');
    console.log('This action cannot be undone.');
    
    // In a real application, you would want additional confirmation
    const confirmReset = process.argv.includes('--confirm');
    
    if (!confirmReset) {
      console.log('Use --confirm flag to proceed with database reset');
      return;
    }

    console.log('🗑️  Resetting database...');
    
    // Get all table names
    const tablesResult = await query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('migrations', 'seeds')
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    
    // Drop all tables
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`Dropped table: ${table}`);
    }
    
    // Clear seeds table
    await query('DELETE FROM seeds');
    
    console.log('✅ Database reset completed');
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const seederManager = new SeederManager();

  try {
    switch (command) {
      case 'run':
        await seederManager.runSeeds();
        break;
      
      case 'status':
        const status = await seederManager.getSeedStatus();
        console.log('\nSeed Status:');
        console.log('============');
        status.forEach(seed => {
          const status = seed.executed ? '✅' : '⏳';
          const date = seed.executedAt ? 
            new Date(seed.executedAt).toLocaleString() : 'Not executed';
          console.log(`${status} ${seed.filename} - ${date}`);
        });
        break;
      
      case 'rollback':
        const filename = process.argv[3];
        if (!filename) {
          console.error('❌ Please specify seed filename to rollback');
          process.exit(1);
        }
        await seederManager.rollbackSeed(filename);
        break;
      
      case 'reset':
        await seederManager.resetDatabase();
        break;
      
      default:
        console.log('Usage:');
        console.log('  node seed.js run                    - Run pending seeds');
        console.log('  node seed.js status                - Show seed status');
        console.log('  node seed.js rollback <filename>   - Rollback specific seed');
        console.log('  node seed.js reset --confirm       - Reset database (DANGEROUS)');
        break;
    }
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SeederManager;



