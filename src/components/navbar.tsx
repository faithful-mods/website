'use client';

import { Button, Card, Group, } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GitHubLogin } from '@/components/auth/github-login';
import { LoggedUser } from '@/components/auth/logged-user';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn, gradient } from '@/lib/utils';

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
								gradient={gradient}
								color={gradient.to}
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
