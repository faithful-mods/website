'use client';

import { ActionIcon, Avatar, Button, Card, Group, Image, } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TbSettings2 } from 'react-icons/tb';

import { GitHubLogin } from '@/components/auth/github-login';
import { LoggedUser } from '@/components/auth/logged-user';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn, gradient } from '@/lib/utils';

import { ThemeSwitch } from './theme-switch';

export const Navbar = () => {
	const pathname = usePathname();
	const user = useCurrentUser();

	const links = [
		{ href: '/about', label: 'About' },
		{ href: '/modpacks', label: 'Modpacks' },
		{ href: '/mods', label: 'Mods' },
	]

	if (user && user.role === 'ADMIN') links.push({ href: '/dashboard', label: 'Dashboard' });

	return (
		<Card padding="sm" withBorder mb="sm">
			<Group justify="space-between">
				<Group gap="sm">
					<Link href="/" className="navbar-icon-fix">
						<Image src="/icon.png" alt="FM" className="navbar-icon-fix" />
					</Link>
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
					{user && <Link href='/settings/me'>
						<ActionIcon 
							size="lg" 
							variant="outline"
							className="navbar-icon-fix"
						><TbSettings2 className="w-5 h-5"/></ActionIcon>
					</Link>}
					{user && <LoggedUser />}
					{!user && <GitHubLogin />}
				</Group>
			</Group>
		</Card>
	);
};
