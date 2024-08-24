'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useState } from 'react';

import { FaHome } from 'react-icons/fa';
import { GoLaw } from 'react-icons/go';
import { HiOutlineMenu } from 'react-icons/hi';
import { IoMdCloudUpload } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { MdDashboard } from 'react-icons/md';
import { TbPackage, TbPackages } from 'react-icons/tb';

import { ActionIcon, Avatar, Badge, Button, Divider, Group, Image, Menu } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { UserRole } from '@prisma/client';
import { signOut } from 'next-auth/react';

import { GitHubLogin } from '~/components/github-login';
import { useCurrentUser } from '~/hooks/use-current-user';
import { BREAKPOINT_TABLET, GRADIENT } from '~/lib/constants';

import { ThemeSwitch } from './base/theme-switch';
import { Tile } from './base/tile';

export const Navbar = () => {
	const pathname = usePathname();
	const user = useCurrentUser();
	const { width } = useViewportSize();
	const [userPicture, setUserPicture] = useState<string | undefined>(user?.image ?? undefined);

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
	];

	if (user) links.push({
		href: '/contribute',
		label: 'Contribute',
		disabled: user.role === 'BANNED',
		icon: <IoMdCloudUpload />,
	});

	if (width < BREAKPOINT_TABLET) links.unshift({
		href: '/',
		label: 'Home',
		disabled: false,
		icon: <FaHome />,
	});

	return (
		<Group gap="sm" mb="sm" mt="sm" wrap="nowrap" align="center" justify="center">
			{width >= BREAKPOINT_TABLET && (
				<>
					<Tile padding="sm" radius="md" shadowless transparent style={{ minWidth: '62px' }}>
						<Link href="/" className="navbar-icon-fix">
							<Image src="/icon.png" alt="FM" className="navbar-icon-fix" />
						</Link>
					</Tile>
					<Divider orientation='vertical' h="32" mt="auto" mb="auto" />
				</>
			)}
			<Tile padding="sm" radius="md" className="w-full" shadowless transparent>
				<Group justify="space-between" wrap={width >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
					<Group gap="sm" wrap={width >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
						{width < BREAKPOINT_TABLET &&
							<Menu
								shadow="md"
								position="bottom-start"
								width={`calc(${width}px - (2 * var(--mantine-spacing-sm))`}
							>
								<Menu.Target>
									<Button
										variant="transparent"
										color="blue"
										className="navbar-icon-fix"
									>
										<HiOutlineMenu className="w-5 h-5" />
									</Button>
								</Menu.Target>

								<Menu.Dropdown style={
									{
										left: 'var(--mantine-spacing-sm)',
										top: 'calc(60px + 24px)', // 60px is the height of the navbar and 24px is its margin
									}
								}>
									{links.map((link, i) => (
										<Menu.Item
											key={i}
											component="a"
											href={link.href}
											disabled={link.disabled}
											leftSection={link.icon}
											c={(pathname.startsWith(link.href) && link.href !== '/') || link.href === pathname ? 'blue' : undefined}
										>
											{link.label}
										</Menu.Item>
									))}
								</Menu.Dropdown>
							</Menu>
						}
						{user && user.role === UserRole.BANNED && width < BREAKPOINT_TABLET &&
							<Badge color="red" variant="light">banned</Badge>
						}
						{width >= BREAKPOINT_TABLET && links.map((link, index) => (
							<Link href={link.href} key={index}>
								<Button
									autoContrast
									variant={pathname.startsWith(link.href) ? 'gradient' : 'transparent'}
									gradient={GRADIENT}
									color="blue"
									disabled={link.disabled}
									className={link.disabled ? 'button-disabled' : ''}
								>
									{link.label}
								</Button>
							</Link>
						))}
					</Group>
					<Group gap="sm" wrap={width >= BREAKPOINT_TABLET ? 'wrap' : 'nowrap'}>
						{user && user.role === UserRole.BANNED && width >= BREAKPOINT_TABLET &&
							<Badge color="red" variant="light">banned</Badge>
						}

						<ThemeSwitch />

						{!user && <GitHubLogin />}

						{user && (user.role === UserRole.COUNCIL || user.role === UserRole.ADMIN) &&
							<Link href='/council/submissions'>
								<ActionIcon
									size="lg"
									variant="transparent"
									className="navbar-icon-fix"
								><GoLaw className="w-5 h-5"/></ActionIcon>
							</Link>
						}

						{user && user.role === 'ADMIN' &&
							<Link href='/dashboard/users'>
								<ActionIcon
									size="lg"
									variant="transparent"
									className="navbar-icon-fix"
								><MdDashboard className="w-5 h-5"/></ActionIcon>
							</Link>
						}

						{user && user.role !== UserRole.BANNED &&
							<Link href='/user/me'>
								<ActionIcon
									size="lg"
									variant="transparent"
									className="navbar-icon-fix"
								>
									<Avatar
										className="cursor-pointer solid-background"
										radius={4}
										src={userPicture}
										onError={() => setUserPicture(undefined)}
									>
										{ (user?.name ?? '?')[0] }
									</Avatar>
								</ActionIcon>
							</Link>
						}
						{user && user.role === UserRole.BANNED &&
							<Button
								variant="transparent"
								color="blue"
								onClick={() => signOut({ callbackUrl: '/' })}
								className="navbar-icon-fix"
							>
								<IoLogOut className="w-5 h-5" />
							</Button>
						}
					</Group>
				</Group>
			</Tile>
		</Group>
	);
};
