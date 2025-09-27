import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function monitorDatabase() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('📊 Database Monitoring Report');
    console.log('============================\n');
    
    // Basic connection info
    console.log('🔗 Connection Information:');
    const versionResult = await client.query('SELECT version()');
    console.log(`  PostgreSQL Version: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log(`  Current Time: ${timeResult.rows[0].current_time}`);
    
    // Database size
    console.log('\n💾 Database Size:');
    const sizeResult = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_database_size(current_database()) as size_bytes
    `);
    console.log(`  Database Size: ${sizeResult.rows[0].database_size}`);
    
    // Table statistics
    console.log('\n📋 Table Statistics:');
    const tableStats = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
    `);
    
    if (tableStats.rows.length > 0) {
      console.log('  Table Name          | Live Tuples | Inserts | Updates | Deletes');
      console.log('  --------------------|-------------|---------|---------|--------');
      tableStats.rows.forEach(row => {
        console.log(`  ${row.tablename.padEnd(19)} | ${String(row.live_tuples).padEnd(11)} | ${String(row.inserts).padEnd(7)} | ${String(row.updates).padEnd(7)} | ${row.deletes}`);
      });
    } else {
      console.log('  No table statistics available');
    }
    
    // Connection info
    console.log('\n🔌 Connection Information:');
    const connectionInfo = await client.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    const conn = connectionInfo.rows[0];
    console.log(`  Total Connections: ${conn.total_connections}`);
    console.log(`  Active Connections: ${conn.active_connections}`);
    console.log(`  Idle Connections: ${conn.idle_connections}`);
    
    // Index usage
    console.log('\n📇 Index Usage:');
    const indexUsage = await client.query(`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC
      LIMIT 10
    `);
    
    if (indexUsage.rows.length > 0) {
      console.log('  Table Name          | Index Name           | Scans | Tuples Read');
      console.log('  --------------------|----------------------|-------|-------------');
      indexUsage.rows.forEach(row => {
        console.log(`  ${row.tablename.padEnd(19)} | ${row.indexname.padEnd(20)} | ${String(row.index_scans).padEnd(5)} | ${row.tuples_read}`);
      });
    } else {
      console.log('  No index usage statistics available');
    }
    
    // Recent activity
    console.log('\n🕐 Recent Activity:');
    const recentActivity = await client.query(`
      SELECT 
        query,
        state,
        query_start,
        now() - query_start as duration
      FROM pg_stat_activity 
      WHERE datname = current_database() 
        AND state != 'idle'
        AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY query_start DESC
      LIMIT 5
    `);
    
    if (recentActivity.rows.length > 0) {
      recentActivity.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.state} - ${row.duration}`);
        console.log(`     Query: ${row.query.substring(0, 80)}${row.query.length > 80 ? '...' : ''}`);
      });
    } else {
      console.log('  No recent activity');
    }
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    // Check for missing indexes
    const missingIndexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
        AND n_distinct > 100
        AND correlation < 0.1
      ORDER BY n_distinct DESC
      LIMIT 5
    `);
    
    if (missingIndexes.rows.length > 0) {
      console.log('  Consider adding indexes on:');
      missingIndexes.rows.forEach(row => {
        console.log(`    - ${row.tablename}.${row.column_name} (${row.n_distinct} distinct values)`);
      });
    } else {
      console.log('  No obvious missing indexes detected');
    }
    
    // Check for long-running queries
    const longQueries = await client.query(`
      SELECT 
        query,
        state,
        now() - query_start as duration
      FROM pg_stat_activity 
      WHERE datname = current_database() 
        AND state = 'active'
        AND now() - query_start > interval '1 minute'
      ORDER BY duration DESC
    `);
    
    if (longQueries.rows.length > 0) {
      console.log('  Long-running queries detected:');
      longQueries.rows.forEach((row, index) => {
        console.log(`    ${index + 1}. ${row.duration} - ${row.query.substring(0, 60)}...`);
      });
    } else {
      console.log('  No long-running queries detected');
    }
    
    console.log('\n✅ Database monitoring completed');
    
  } catch (error) {
    console.error('❌ Database monitoring failed:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

monitorDatabase();
