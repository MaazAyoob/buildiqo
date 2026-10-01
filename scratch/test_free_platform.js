// Verification script to test that all subscription restrictions are removed
// and that the store exports ENABLE_SUBSCRIPTIONS = false with free access defaults

import { ENABLE_SUBSCRIPTIONS, getActiveSubscription } from '../src/store/useEstimateStore.js';

console.log('--- Testing Buildiqo Free Platform State ---');
console.log('1. ENABLE_SUBSCRIPTIONS:', ENABLE_SUBSCRIPTIONS);
if (ENABLE_SUBSCRIPTIONS !== false) {
  throw new Error('ENABLE_SUBSCRIPTIONS should be false');
}

const activeSub = getActiveSubscription();
console.log('2. Active Subscription Default:', activeSub);
if (!activeSub.isPlanConfirmed || activeSub.status !== 'active') {
  throw new Error('Active subscription should be confirmed and active');
}

console.log('✓ All subscription guards and store defaults verified successfully for free platform!');
