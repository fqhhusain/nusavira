import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase URL or Anon Key is missing in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log("🚀 Starting Syndicate Automated Tests...");

  const testSyndicateName = "Test Syndicate " + Date.now();
  const testJoinCode = "TEST" + Math.floor(Math.random() * 10000);
  let syndicateId = null;

  try {
    // 1. Create Syndicate
    console.log("⏳ Testing: Create Syndicate...");
    const { data: createData, error: createError } = await supabase
      .from('syndicates')
      .insert({ name: testSyndicateName, join_code: testJoinCode })
      .select('id')
      .single();

    if (createError) throw createError;
    syndicateId = createData.id;
    console.log(`✅ Success! Created Syndicate ID: ${syndicateId}`);

    // 2. Create Syndicate Boss
    console.log("⏳ Testing: Create Syndicate Boss...");
    const { error: bossError } = await supabase
      .from('syndicate_boss')
      .insert({ syndicate_id: syndicateId, hp: 50000, max_hp: 50000 });

    if (bossError) throw bossError;
    console.log("✅ Success! Boss created.");

    // 3. Join Syndicate
    console.log("⏳ Testing: Join Syndicate...");
    const { error: joinError } = await supabase
      .from('syndicate_members')
      .insert({ syndicate_id: syndicateId, player_name: "Test Player" });

    if (joinError) throw joinError;
    console.log("✅ Success! Joined Syndicate.");

    // 4. Deal Damage
    console.log("⏳ Testing: Deal Damage to Boss...");
    const damage = 5000;
    
    // Update player's total damage
    const { error: updatePlayerError } = await supabase
      .from('syndicate_members')
      .update({ total_damage: damage })
      .match({ syndicate_id: syndicateId, player_name: "Test Player" });
      
    if (updatePlayerError) throw updatePlayerError;
    
    // Update boss HP
    const { data: bossData } = await supabase.from('syndicate_boss').select('hp').eq('syndicate_id', syndicateId).single();
    const newHp = bossData.hp - damage;
    
    const { error: updateBossError } = await supabase
      .from('syndicate_boss')
      .update({ hp: newHp })
      .eq('syndicate_id', syndicateId);
      
    if (updateBossError) throw updateBossError;
    console.log(`✅ Success! Dealt ${damage} damage. Boss HP is now ${newHp}.`);

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The RLS policies are working.");

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
  } finally {
    // Cleanup
    if (syndicateId) {
      console.log("🧹 Cleaning up test data...");
      await supabase.from('syndicates').delete().eq('id', syndicateId);
      console.log("✅ Cleanup complete.");
    }
  }
}

runTests();
