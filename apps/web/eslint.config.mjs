import nextConfig from 'eslint-config-next';
import base from '../../eslint.base.mjs';

const config = [...base, ...nextConfig];

export default config;
