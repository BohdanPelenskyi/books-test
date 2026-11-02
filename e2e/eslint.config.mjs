import base from '../eslint.base.mjs';

export default [...base, { ignores: ['playwright-report', 'test-results'] }];
