'use client';

import { Button, Text, Card, TextInput, Image, Group, Stack, Badge, Skeleton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { User } from '@prisma/client';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { gradient, notify } from '~/lib/utils';
import { getUserById, updateUser } from '~/server/data/user';

export function UserSettingsPanel() {
	const loggedUser = useCurrentUser();
	const params = useParams();

	const { update } = useSession();
	const [isPending, startTransition] = useTransition();
	const [displayedUser, setDisplayedUser] = useState<User>();

	const form = useForm<{ name: string, image: string }>({
		initialValues: { name: '', image: '' },
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name';
				if (value.length < MIN_NAME_LENGTH) return `Your name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `Your name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
		},
	});

	useEffectOnce(() => {
		const userId = params.userId === 'me' ? loggedUser?.id! : params.userId as string;
		
		getUserById(userId)
			.then((user) => {
				setDisplayedUser(user);
				form.setFieldValue('name', user.name ?? '');
				form.setFieldValue('image', user.image ?? '');
			})
			.catch((err: Error) => {
				notify('Error', err.message, 'red');
			});
	});

	const onSubmit = (values: typeof form.values) => {
		if (!displayedUser) return;

		startTransition(() => {
			updateUser({ ...values, id: displayedUser.id })
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

	return (
		<Card 
			shadow="sm" 
			padding="md" 
			radius="md" 
			withBorder
		>
			<Group align="start">
				{displayedUser?.image && 
					<Image 
						radius="md" 
						src={displayedUser?.image} 
						alt="User avatar" 
						width={100} 
						height={100} 
						className="image-background"
						onError={() => setDisplayedUser({ ...displayedUser, image: null })}
					/>
				}
				{!displayedUser?.image && <Skeleton width={100} height={100} radius="md" animate={false} />}

				<Stack align="start" gap={0}>
					<Text size="md" fw={700}>Profile Settings</Text>
					<Text size="sm">Update {params.userId === 'me' ? 'your profile' : `${displayedUser?.name} profile's` } information</Text>
					<Group gap="sm">
						<Badge mt="sm" color="teal" variant="filled">{displayedUser?.role ?? '???'}</Badge>
					</Group>
				</Stack>
			</Group>

			<TextInput mt="md" label="Name" {...form.getInputProps('name')} />
			<TextInput mt="sm" label="Picture URL" {...form.getInputProps('image')} />

			<Button 
				variant="gradient"
				gradient={gradient}
				onClick={() => onSubmit(form.values)}
				fullWidth 
				disabled={isPending || !form.isValid() || displayedUser === undefined}
				loading={isPending}
				mt="md"
			>
        Save
			</Button>
		</Card>
	);
}