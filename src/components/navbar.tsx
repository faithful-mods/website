'use client';

import { ActionIcon, Button, Card, Combobox, Group, Image, useCombobox, } from '@mantine/core';
import { UserRole } from '@prisma/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiOutlineMenu } from 'react-icons/hi';
import { IoMdSettings } from 'react-icons/io';
import { MdDashboard } from 'react-icons/md';

import { GitHubLogin } from '~/components/auth/github-login';
import { LoggedUser } from '~/components/auth/logged-user';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_TABLET } from '~/lib/constants';
import { gradient } from '~/lib/utils';

import { ThemeSwitch } from './theme-switch';

export const Navbar = () => {
	const pathname = usePathname();
	const router = useRouter();
	const user = useCurrentUser();
	const combobox = useCombobox();
	const [windowWidth, _] = useDeviceSize();

	const links = [
		{ href: '/modpacks', label: 'Modpacks', disabled: false },
		{ href: '/mods', label: 'Mods', disabled: false },
		{ href: '/gallery', label: 'Gallery', disabled: false },
	]

	if (windowWidth < BREAKPOINT_TABLET) links.push({ href: '/', label: 'Home', disabled: false });

	return (
		<Group gap="sm" mb="sm" mt="sm" wrap="nowrap">
			{windowWidth >= BREAKPOINT_TABLET && 
				<Card padding="sm" radius="md" withBorder shadow="sm" style={{ minWidth: '62px' }}>
					<Link href="/" className="navbar-icon-fix">
						<Image src="/icon.png" alt="FM" className="navbar-icon-fix" />
					</Link>
				</Card>
			}
			<Card padding="sm" radius="md" withBorder className="w-full" shadow="sm">
				<Group justify="space-between" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
					<Group gap="sm" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
						{windowWidth < BREAKPOINT_TABLET && 
							<Combobox
								store={combobox}
								width={250}
								position="bottom-start"
								withArrow
								onOptionSubmit={(value) => {
									router.push(links.find(link => link.label === value)?.href ?? '/');
									combobox.closeDropdown();
								}}
							>
								<Combobox.Target>
									<Button 
										onClick={() => combobox.toggleDropdown()}
										variant="transparent"
										color={gradient.to}
										className="navbar-icon-fix"
									>
										<HiOutlineMenu className="w-5 h-5" />
									</Button>
								</Combobox.Target>

								<Combobox.Dropdown>
									<Combobox.Options>
										{links.filter((l) => !l.disabled).map(link => link.label).sort().map((item) => (
											<Combobox.Option value={item} key={item}>
												{item}
											</Combobox.Option>
										))}
									</Combobox.Options>
								</Combobox.Dropdown>
							</Combobox>
						}
						{windowWidth >= BREAKPOINT_TABLET && links.map((link, index) => (
							<Link href={link.href} key={index}>
								<Button
									autoContrast
									variant={pathname === link.href ? 'gradient' : 'transparent'}
									gradient={gradient}
									color={gradient.to}
									disabled={link.disabled}
									className={link.disabled ? 'button-disabled' : ''}
								>
									{link.label}
								</Button>
							</Link>
						))}
					</Group>
					<Group gap="sm" wrap={windowWidth >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
						<ThemeSwitch />
						
						{!user && <GitHubLogin />}
						
						{user && user.role === 'ADMIN' && 
							<Link href='/dashboard'>
								<ActionIcon 
									size="lg" 
									variant="transparent"
									className="navbar-icon-fix"
								><MdDashboard className="w-5 h-5"/></ActionIcon>
							</Link>
						}
						
						{user && 
							<Link href='/settings/me'>
								<ActionIcon 
									size="lg" 
									variant="transparent"
									disabled={user.role === UserRole.BANNED}
									className={user.role === UserRole.BANNED ? 'navbar-icon-fix button-disabled' : 'navbar-icon-fix'}
								><IoMdSettings className="w-5 h-5"/></ActionIcon>
							</Link>
						}

						{user && <LoggedUser />}
					</Group>
				</Group>
			</Card>
		</Group>
	);
};
