'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LoggedUser } from '@/src/components/auth/logged-user';
import { GitHubLogin } from '@/src/components/auth/github-login';

import { useCurrentUser } from '@/src/hooks/use-current-user';
import { Button, Card, Group, } from '@mantine/core';
import { ThemeSwitch } from './theme-switch';

export const Navbar = () => {
	const pathname = usePathname();
	const user = useCurrentUser();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/about', label: 'About' },
		{ href: '/modpacks', label: 'Modpacks' },
		{ href: '/mods', label: 'Mods' },
	]

	if (user) links.push({ href: '/settings', label: 'Settings' });
	if (user && user.role === 'ADMIN') links.push({ href: '/admin', label: 'Dashboard' });

	return (
		<Card padding="sm" withBorder mb="sm">
			<Group justify="space-between">
				<Group gap="sm">
					{links.map((link, index) => (
						<Link href={link.href} key={index}>
							<Button
								autoContrast
								variant={pathname === link.href ? 'gradient' : 'transparent'}
								gradient={{ from: 'cyan', to: 'teal', deg: 90 }}
								color="teal"
							>
								{link.label}
							</Button>
						</Link>
					))}
				</Group>
				<Group gap="sm">
					<ThemeSwitch />
					{user && <LoggedUser />}
					{!user && <GitHubLogin />}
				</Group>
			</Group>
		</Card>
	);
};
