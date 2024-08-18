'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';

import { GoCheckCircle, GoStop } from 'react-icons/go';

import { Button, Text, TextInput, Group, Stack, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { UserRole } from '@prisma/client';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

import { TextureImage } from '~/components/texture-img';
import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { deleteFork, forkRepository, getFork } from '~/server/actions/git';
import { getUserById } from '~/server/data/user';
import { updateUser } from '~/server/data/user';

import type { User } from '@prisma/client';

const UserPage = () => {
	const params = useParams();
	const user = useCurrentUser()!;
	const self = params.userId === 'me';

	const [displayedUser, setDisplayedUser] = useState<User>();
	const router = useRouter();

	const { update } = useSession();
	const [loading, startTransition] = useTransition();
	const [windowWidth] = useDeviceSize();

	const [hasFork, setHasFork] = useState<string | null>(null);

	const form = useForm<Pick<User, 'name' | 'image'>>({
		initialValues: { name: user.name!, image: user.image! },
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name';
				if (value.length < MIN_NAME_LENGTH) return `Your name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `Your name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
			image: (value) => {
				if (!value) return null;
				if (!value?.startsWith('https://')) return 'Your personal picture should be a HTTPS URL';
			},
		},
		onValuesChange: () => {
			form.validate();
		},
	});

	const onSubmit = (values: typeof form.values) => {
		if (!user) return;

		startTransition(() => {
			updateUser({ ...values, id: user.id! })
				.then((user) => {
					update(user);
					notify('Success', 'Profile updated', 'teal');
				})
				.catch((err) => {
					console.error(err);
					notify('Error', err.message, 'red');
				});
		});
	};

	const reload = async () => {
		startTransition(async () => {
			// Avoid logged users to access their own page with their id
			if (params.userId === user?.id) router.push('/user/me');
			const userId = self ? user?.id! : params.userId as string;

			getFork().then(setHasFork);
			getUserById(userId).then(setDisplayedUser);
		});
	};

	const handleForkDelete = async () => {
		startTransition(async () => {
			await deleteFork();
			await reload();
		});
	};

	useEffectOnce(() => {
		reload();
	});

	const handleSetupForkedRepository = async () => {
		startTransition(async () => {
			await forkRepository();
			await reload();
		});
	};

	const forkedInfo = () => {
		if (hasFork) {
			return (
				<Tile p="xs" pl={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'xs' : 'md'} color="teal">
					<Group gap="sm">
						<GoCheckCircle size={20} color="white" />
						<Group gap={3}>
							<Text size="sm" c="white">Default textures repository forked: </Text>
							<Text size="sm" c="white">
								<Link href={hasFork} style={{ color: 'white' }}>
									{windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'link' : hasFork}
								</Link>
							</Text>
						</Group>
					</Group>
				</Tile>
			);
		}

		return (
			<Tile p="xs" pl={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'xs' : 'md'} color="yellow">
				<Group justify="space-between" gap="xs">
					<Group gap="sm">
						<GoStop color="black" size={20} />
						<Group gap="xs">
							<Text size="sm" c="black">Default textures repository not forked</Text>
						</Group>
					</Group>

					<Button
						variant="outline"
						color="black"
						onClick={handleSetupForkedRepository}
						disabled={!!hasFork}
						loading={loading}
						fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
					>
						Create Fork
					</Button>
				</Group>
			</Tile>
		);
	};

	return (displayedUser && (
		<Stack gap="xl">
			<Group
				wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
				gap="xs"
				align="start"
				justify="center"
			>
				<Stack w={160} align="center" gap="xs">
					<TextureImage
						src={form.values['image'] ?? ''}
						alt="User avatar"
						styles={{
							borderRadius: 'var(--mantine-radius-default)',
						}}
						size={160}
					/>

					<Badge
						color={user?.role === UserRole.BANNED ? 'red' : 'teal'}
						variant="filled"
					>
						{user?.role ?? '?'}
					</Badge>
				</Stack>

				<Tile w="100%" p="sm" h={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'auto' : 160}>
					<Group
						h="100%"
						justify="space-between"
						wrap={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
					>
						<Stack
							h="100%"
							w="100%"
							justify="space-between"
						>
							<TextInput
								label="Name"
								required
								w="100%"
								{...form.getInputProps('name')}
							/>
							<TextInput
								label="Picture URL"
								w="100%"
								{...form.getInputProps('image')}
							/>
						</Stack>

						<Stack
							h="100%"
							w="100%"
							justify="space-between"
							align="flex-end"
							style={{
								flexDirection: windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'column-reverse' : 'column',
							}}
						>
							<Button
								justify={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'center' : 'right'}
								variant="transparent"
								color="red"
								onClick={() => signOut({ callbackUrl: '/' })}
							>
								Sign out
							</Button>
							<Button
								variant="gradient"
								gradient={GRADIENT}
								onClick={() => onSubmit(form.values)}
								disabled={loading || !form.isValid() || user === undefined}
								loading={loading}
							>
								Save
							</Button>
						</Stack>
					</Group>
				</Tile>
			</Group>

			<Stack gap="xs">
				<Text fw={700}>Contributions Repository</Text>
				{forkedInfo()}
			</Stack>

			<Stack gap="xs" mb="sm">
				<Text fw={700}>Danger Zone</Text>
				<Tile
					p="xs"
					pl="md"
					withBorder
					style={{
						backgroundColor: 'transparent',
						borderColor: 'var(--mantine-color-red-filled)',
					}}
				>
					<Group justify="space-between">
						<Stack gap={0}>
							<Text>Delete the forked repository</Text>
							<Text c="dimmed" size="xs">This action is irreversible, all contributions will be lost.</Text>
						</Stack>
						<Button
							variant="default"
							style={{ color: 'var(--mantine-color-red-text)' }}
							onClick={handleForkDelete}
							disabled={!hasFork}
							loading={loading}
							fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
						>
							Delete Fork
						</Button>
					</Group>
				</Tile>
			</Stack>
		</Stack>
	));
};

export default UserPage;
