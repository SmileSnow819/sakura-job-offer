import assert from 'node:assert/strict';
import { getIntroReplayMode } from '../src/utils/introMode.ts';

assert.equal(getIntroReplayMode('?debug=-1'), 'initial');
assert.equal(getIntroReplayMode('?debug=-2'), 'autumn');
assert.equal(getIntroReplayMode('?debug=-3'), 'sequence');
assert.equal(getIntroReplayMode('?debug=0'), null);
assert.equal(getIntroReplayMode(''), null);
console.log('intro debug mode contract is present');
