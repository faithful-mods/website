const MillionLint = require('@million/lint');

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
};

module.exports = MillionLint.next({
	rsc: true
})(nextConfig);