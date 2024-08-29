'use client';

import { useParams, useRouter } from 'next/navigation';

import { useState, useTransition } from 'react';

import { Group, Image, Stack, Divider, Text, TextInput, Button, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { getUserById } from '~/server/data/user';
import { updateUser } from '~/server/data/user';

import type { User } from '@prisma/client';

export default function UserPage() {
	const params = useParams();
	const user = useCurrentUser()!;
	const self = params.userId === 'me';

	const [displayedUser, setDisplayedUser] = useState<User>();
	const router = useRouter();

	const { update } = useSession();
	const [loading, startTransition] = useTransition();

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

	useEffectOnce(() => {
		reload();
	});

	return (displayedUser && (
		<Group w="100%" wrap="nowrap" align="start" gap="xl">
			<Stack
				align="center"
				w={'calc(100% - 200px - (2 * var(--mantine-spacing-xl) - 1px))'}
			>
				<Text w="100%" fw={700}>Profile Information</Text>
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
				<Button
					mt={25}
					w={200}
					variant="gradient"
					gradient={GRADIENT}
					onClick={() => onSubmit(form.values)}
					disabled={loading || !form.isValid() || user === undefined}
					loading={loading}
				>
					Save
				</Button>
			</Stack>
			<Divider orientation="vertical" />
			<Stack w={200} align="center">
				<Image
					src={form.values['image'] ?? ''}
					alt="User avatar"
					w={200}
				/>
				<Badge
					color={user?.role === UserRole.BANNED ? 'red' : 'teal'}
					variant="filled"
				>
					{user?.role ?? '?'}
				</Badge>
			</Stack>
		</Group>

	/*
			<Stack gap="xl">
			 <Button
				variant="gradient"
				gradient={GRADIENT_DANGER}
				justify={width <= BREAKPOINT_MOBILE_LARGE ? 'center' : 'right'}
				fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
				onClick={() => signOut({ callbackUrl: '/' })}
			>
				Sign out
			</Button>

			<Group
				wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
				gap="xs"
				align="start"
				justify="center"
			>
				<Stack w={220} align="center" gap="xs">

				</Stack>

				<Group
					wrap={width <= BREAKPOINT_MOBILE_LARGE ? 'wrap' : 'nowrap'}
					h={width <= BREAKPOINT_MOBILE_LARGE ? 'auto' : 220}
					align="center"
					w="100%"
				>

				</Group>
			</Group>
		</Stack>*/
	));
};
