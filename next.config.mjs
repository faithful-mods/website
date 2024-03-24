import { next as MillionLint } from '@million/lint';

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
};

const million = {
	rsc: true
}

export default MillionLint(million)(nextConfig);
