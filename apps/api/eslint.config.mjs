import globals from 'globals';
import base from '../../eslint.base.mjs';

export default [...base, { languageOptions: { globals: { ...globals.node, ...globals.jest } } }];
