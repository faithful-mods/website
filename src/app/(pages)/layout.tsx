
import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SessionProvider } from 'next-auth/react';

import { auth } from '~/auth';
import { Navbar } from '~/components/navbar';
import { BREAKPOINT_DESKTOP_LARGE } from '~/lib/constants';

import type { Metadata } from 'next';

// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '../globals.scss';

import '~/lib/polyfills';

export const metadata: Metadata = {
	title: 'Faithful Mods',
};

const theme = createTheme({
	cursorType: 'pointer',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	return (
		<html lang='en'>
			<head>
				<ColorSchemeScript />
			</head>
			<body style={{ maxWidth: BREAKPOINT_DESKTOP_LARGE, padding: '0 var(--mantine-spacing-sm)' }}>
				<SessionProvider session={session}>
					<MantineProvider theme={theme}>
						<Navbar />
						{children}
						<Notifications w='fit-content' className='absolute' left={20} bottom={20} />
					</MantineProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
