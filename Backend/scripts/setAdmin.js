require('dotenv').config({
    path: require('path').join(__dirname, '..', '.env'),
});

const { auth } = require('../services/firebase');

async function main() {
    const arg = process.argv[2];
    const revoke = process.argv.includes('--revoke');

    if (!arg) {
        console.error('Usage: node scripts/setAdmin.js <email|uid> [--revoke]');
        process.exit(1);
    }

    let userRecord;
    try {
        userRecord = arg.includes('@')
            ? await auth.getUserByEmail(arg)
            : await auth.getUser(arg);
    } catch (err) {
        console.error(`❌ User not found (${arg}):`, err.message);
        process.exit(1);
    }

    const currentClaims = userRecord.customClaims || {};
    const newClaims = { ...currentClaims, admin: revoke ? undefined : true };

    if (newClaims.admin === undefined) delete newClaims.admin;

    await auth.setCustomUserClaims(userRecord.uid, newClaims);

    console.log('─────────────────────────────────────────────');
    console.log(`✅ ${revoke ? 'REVOKED' : 'GRANTED'} admin`);
    console.log(`   Email : ${userRecord.email || '(none)'}`);
    console.log(`   UID   : ${userRecord.uid}`);
    console.log(`   Claims: ${JSON.stringify(newClaims)}`);
    console.log('');
    console.log('   The user must refresh their ID token for the change');
    console.log('   to take effect (logout + login, or ~1 hour).');
    console.log('─────────────────────────────────────────────');

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ setAdmin failed:', err);
    process.exit(1);
});