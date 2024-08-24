'use client';

import { useParams, useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';

import { Button, Text, TextInput, Group, Stack, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useViewportSize } from '@mantine/hooks';
import { UserRole } from '@prisma/client';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

import { Tile } from '~/components/base/tile';
import ForkInfo from '~/components/fork';
import { TextureImage } from '~/components/textures/texture-img';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, GRADIENT, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { deleteFork } from '~/server/actions/octokit';
import { getUserById } from '~/server/data/user';
import { updateUser } from '~/server/data/user';

import type { User } from '@prisma/client';

export default function UserPage() {
	const params = useParams();
	const user = useCurrentUser()!;
	const self = params.userId === 'me';
	const [forkUrl, setForkUrl] = useState<string | null>(null);

	const [displayedUser, setDisplayedUser] = useState<User>();
	const router = useRouter();

	const { update } = useSession();
	const [loading, startTransition] = useTransition();
	const { width } = useViewportSize();

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

			getUserById(userId).then(setDisplayedUser);
		});
	};

	const handleForkDelete = async () => {
		startTransition(async () => {
			await deleteFork();
			setForkUrl(null);
		});
	};

	useEffectOnce(() => {
		reload();
	});

	return (displayedUser && (
		<Stack gap="xl">
			<Group
				wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
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

				<Tile w="100%" p="sm" h={width <= BREAKPOINT_MOBILE_LARGE ? 'auto' : 160}>
					<Group
						h="100%"
						justify="space-between"
						wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
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
								flexDirection: width <= BREAKPOINT_MOBILE_LARGE ? 'column-reverse' : 'column',
							}}
						>
							<Button
								justify={width <= BREAKPOINT_MOBILE_LARGE ? 'center' : 'right'}
								fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
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
								fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
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
				<ForkInfo onUrlUpdate={setForkUrl} forkUrl={forkUrl} />
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
					<Group justify="space-between" style={{ opacity: forkUrl ? 1 : .5 }}>
						<Stack gap={0}>
							<Text>Delete the forked repository</Text>
							<Text c="dimmed" size="xs">This action is irreversible, all contributions will be lost.</Text>
						</Stack>
						<Button
							variant="default"
							style={{ color: 'var(--mantine-color-red-text)' }}
							onClick={handleForkDelete}
							disabled={!forkUrl}
							loading={loading}
							fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
						>
							Delete Fork
						</Button>
					</Group>
				</Tile>
			</Stack>
		</Stack>
	));
};
