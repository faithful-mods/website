'use client';

import { ActionIcon, Badge, Button, Card, Group, Image, Menu } from '@mantine/core';
import { UserRole } from '@prisma/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome } from 'react-icons/fa';
import { GoLaw } from 'react-icons/go';
import { GrGallery } from 'react-icons/gr';
import { HiOutlineMenu } from 'react-icons/hi';
import { IoMdCloudUpload, IoMdSettings } from 'react-icons/io';
import { MdDashboard } from 'react-icons/md';
import { TbPackage, TbPackages } from 'react-icons/tb';

import { GitHubLogin } from '~/components/auth/github-login';
import { LoggedUser } from '~/components/auth/logged-user';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_TABLET } from '~/lib/constants';
import { gradient } from '~/lib/utils';

import { ThemeSwitch } from './theme-switch';

export const Navbar = () => {
	const pathname = usePathname();
	const user = useCurrentUser();
	const [windowWidth, _] = useDeviceSize();

	const links = [
		{
			href: '/modpacks',
			label: 'Modpacks',
			disabled: false,
			icon: <TbPackages />,
		},
		{
			href: '/mods',
			label: 'Mods',
			disabled: false,
			icon: <TbPackage />,
		},
		{
			href: '/gallery',
			label: 'Gallery',
			disabled: false,
			icon: <GrGallery />,
		},

	];

	if (user) links.push({
		href: '/contribute',
		label: 'Contribute',
		disabled: user.role === 'BANNED',
		icon: <IoMdCloudUpload />,
	});

	if (windowWidth < BREAKPOINT_TABLET) links.unshift({
		href: '/',
		label: 'Home',
		disabled: false,
		icon: <FaHome />,
	});

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
							<Menu
								shadow="md"
								position="bottom-start"
								width={`calc(${windowWidth}px - (2 * var(--mantine-spacing-sm))`}
							>
								<Menu.Target>
									<Button
										variant="transparent"
										color={gradient.to}
										className="navbar-icon-fix"
									>
										<HiOutlineMenu className="w-5 h-5" />
									</Button>
								</Menu.Target>

								<Menu.Dropdown style={
									{
										left: 'var(--mantine-spacing-sm)',
										top: 'calc(62px + (2 * var(--mantine-spacing-sm)))',
									}
								}>
									{links.map((link, i) => (
										<Menu.Item
											key={i}
											component="a"
											href={link.href}
											disabled={link.disabled}
											leftSection={link.icon}
											c={pathname === link.href ? gradient.to : undefined}
										>
											{link.label}
										</Menu.Item>
									))}
								</Menu.Dropdown>
							</Menu>
						}
						{user && user.role === UserRole.BANNED && windowWidth < BREAKPOINT_TABLET &&
							<Badge color="red" variant="light">banned</Badge>
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
						{user && user.role === UserRole.BANNED && windowWidth >= BREAKPOINT_TABLET &&
							<Badge color="red" variant="light">banned</Badge>
						}

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

						{user && user.role === UserRole.COUNCIL &&
							<Link href='/council'>
								<ActionIcon
									size="lg"
									variant="transparent"
									className="navbar-icon-fix"
								><GoLaw className="w-5 h-5"/></ActionIcon>
							</Link>
						}

						{user && (user.role !== UserRole.BANNED || windowWidth !== BREAKPOINT_TABLET) &&
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
