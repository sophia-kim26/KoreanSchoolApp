// migrate-pins.js
import { sql } from '../config/database.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const migrateExistingPins = async () => {
  console.log('🚀 Starting PIN migration for Neon database...');
  console.log('📊 Connecting to database...');
  
  try {
    // Test connection
    const testConnection = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful');
    console.log(`🕐 Database time: ${testConnection[0].now}`);
    
    // Get all TAs
    const allTAs = await sql`SELECT id, ta_code, first_name, last_name FROM ta_list`;
    
    console.log(`\n📋 Found ${allTAs.length} TAs to check\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const ta of allTAs) {
      // Only hash if it looks like a plain 6-digit PIN
      if (/^\d{6}$/.test(ta.ta_code)) {
        console.log(`🔄 Migrating: ${ta.first_name} ${ta.last_name} (ID: ${ta.id})`);
        const hashedPin = await bcrypt.hash(ta.ta_code, SALT_ROUNDS);
        
        await sql`
          UPDATE ta_list 
          SET ta_code = ${hashedPin} 
          WHERE id = ${ta.id}
        `;
        
        console.log(`   ✓ Hashed PIN: ${ta.ta_code} → ${hashedPin.substring(0, 20)}...`);
        migratedCount++;
      } else {
        console.log(`⊘ Skipped: ${ta.first_name} ${ta.last_name} (ID: ${ta.id}) - already hashed or invalid`);
        skippedCount++;
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ Migration complete!');
    console.log(`📈 Migrated: ${migratedCount} PINs`);
    console.log(`⊘ Skipped: ${skippedCount} TAs`);
    console.log('═══════════════════════════════════════\n');
    
    // Close the connection
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    await sql.end();
    process.exit(1);
  }
};

// Run the migration
migrateExistingPins();