import type { Metadata } from 'next'

import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'
import { Navbar } from '@/components/navbar';

// Import styles of packages that you"ve installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import './globals.scss'

export const metadata: Metadata = {
	title: 'Faithful Mods',
}

const theme = createTheme({
	/** Put your mantine theme override here */
});

export default async function RootLayout({children}: { children: React.ReactNode }) {
	const session = await auth();

	return (
		<html lang='en'>
			<Head>
				<ColorSchemeScript />
			</Head>
			<body>
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
