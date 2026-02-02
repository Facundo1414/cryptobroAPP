const fs = require('fs');
const path = require('path');

const defaultEnvPath = path.join(__dirname, 'backend', 'src', 'config', 'default-env.ts');

console.log('🔍 Checking for credentials...\n');

if (!fs.existsSync(defaultEnvPath)) {
  console.error('❌ ERROR: default-env.ts not found!');
  console.error('\n📝 To compile the installer with embedded credentials:');
  console.error('   1. Copy backend/src/config/default-env.example.ts to default-env.ts');
  console.error('   2. Replace all placeholder values with your real Supabase credentials');
  console.error('   3. Run: npm run dist:safe\n');
  console.error('💡 The default-env.ts file is git-ignored to protect your credentials.');
  console.error('   It will only exist locally and be embedded in the compiled installer.\n');
  process.exit(1);
}

// Check if it's still the example file
const content = fs.readFileSync(defaultEnvPath, 'utf8');
if (content.includes('YOUR_PROJECT') || content.includes('YOUR_PASSWORD')) {
  console.error('❌ ERROR: default-env.ts contains placeholder values!');
  console.error('\n📝 Please replace all "YOUR_*" placeholders with real credentials.\n');
  process.exit(1);
}

console.log('✅ Credentials found and validated!');
console.log('🔒 These will be embedded in the installer (not in git)\n');
