/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '100mb',
		},
	},
	webpack: (config, { webpack }) => {
		// Manual fix for https://github.com/ZJONSSON/node-unzipper/issues/330
		return {
			...config,
			plugins: [
				...config.plugins,
				new webpack.IgnorePlugin({ resourceRegExp: /^@aws-sdk\/client-s3$/ }),
			],
		};
	},
};

export default nextConfig;
