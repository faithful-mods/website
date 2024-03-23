'use client';

import { ActionIcon, Avatar, Button, Card, Group, Image, Select, } from '@mantine/core';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TbSettings2 } from 'react-icons/tb';

import { GitHubLogin } from '~/components/auth/github-login';
import { LoggedUser } from '~/components/auth/logged-user';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_MEDIUM, BREAKPOINT_TABLET } from '~/lib/constants';
import { gradient } from '~/lib/utils';

import { ThemeSwitch } from './theme-switch';

export const Navbar = () => {
	const pathname = usePathname();
	const router = useRouter();
	const user = useCurrentUser();
	const [windowWidth, _] = useDeviceSize();

	const links = [
		{ href: '/about', label: 'About' },
		{ href: '/modpacks', label: 'Modpacks' },
		{ href: '/mods', label: 'Mods' },
	]

	if (user && user.role === 'ADMIN') links.push({ href: '/dashboard', label: 'Dashboard' });
	if (windowWidth < BREAKPOINT_TABLET) links.push({ href: '/', label: 'Home' });

	return (
		<Card padding="sm" withBorder mb="sm" mt="sm">
			<Group justify="space-between" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
				<Group gap="sm" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
					{windowWidth >= BREAKPOINT_MOBILE_MEDIUM && 
						<Link href="/" className="navbar-icon-fix">
							<Image src="/icon.png" alt="FM" className="navbar-icon-fix" />
						</Link>
					}
					{windowWidth < BREAKPOINT_TABLET && 
						<Select 
							data={links.map(link => link.label).sort()}
							value={links.find(link => link.href === pathname)?.label}
							onChange={(value) => router.push(links.find(link => link.label === value)?.href ?? '/')}
							
							variant="filled"
							color={gradient.to}
							className="w-100"
						/>
					}
					{windowWidth >= BREAKPOINT_TABLET && links.map((link, index) => (
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
				<Group gap="sm" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
					{!user && <GitHubLogin />}
					<ThemeSwitch />
					{user && <Link href='/settings/me'>
						<ActionIcon 
							size="lg" 
							variant="outline"
							className="navbar-icon-fix"
						><TbSettings2 className="w-5 h-5"/></ActionIcon>
					</Link>}
					{user && <LoggedUser />}
				</Group>
			</Group>
		</Card>
	);
};
