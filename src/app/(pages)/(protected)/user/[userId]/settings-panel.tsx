'use client';

import { Button, Text, Card, TextInput, Image, Group, Stack, Badge, Skeleton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { User, UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '~/lib/constants';
import { gradient, notify } from '~/lib/utils';
import { updateUser } from '~/server/data/user';

export function UserSettingsPanel({ user, self }: { user: User, self: boolean }) {
	const { update } = useSession();
	const [isPending, startTransition] = useTransition();
	const [windowWidth, _] = useDeviceSize();

	let pictureWidth = windowWidth <= BREAKPOINT_MOBILE_LARGE ? `calc(${windowWidth} - (2 * var(--mantine-spacing-md)))` : '120px';

	const form = useForm<Pick<User, 'name' | 'image'>>({
		initialValues: { name: user.name, image: user.image },
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name';
				if (value.length < MIN_NAME_LENGTH) return `Your name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `Your name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
		},
		onValuesChange: () => {
			form.validate();
		},
	});

	const onSubmit = (values: typeof form.values) => {
		if (!user) return;

		startTransition(() => {
			updateUser({ ...values, id: user.id })
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
			mb="sm"
			radius="md"
			withBorder
		>
			<Group>
				{form.values['image'] &&
					<Image
						radius="md"
						src={form.values['image']}
						alt="User avatar"
						width={pictureWidth}
						height={pictureWidth}
						className="image-background"
						onError={() => form.setFieldValue('image', '')}
					/>
				}
				{!form.values['image'] && <Skeleton width={pictureWidth} height={pictureWidth} radius="md" animate={false} />}

				<Stack
					justify="space-between"
					style={{ width: `calc(100% - var(--mantine-spacing-md) - ${pictureWidth})`, height: `${pictureWidth}` }}
				>
					<Group
						gap="sm"
						align="flex-start"
						justify="space-between"
					>
						<Stack gap={0}>
							<Text size="md" fw={700}>Profile Settings</Text>
							<Text size="sm">Update {self ? 'your profile' : `${user?.name} profile's` } information</Text>
						</Stack>
						<Badge color={user?.role === UserRole.BANNED ? 'red' : 'teal'} variant="filled">{user?.role ?? '?'}</Badge>
					</Group>

					<Group gap="sm">
						<TextInput
							label="Name"
							required
							style={{ width: windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - var(--mantine-spacing-sm)) * .3)' }}
							{...form.getInputProps('name')}
						/>
						<TextInput
							label="Picture URL"
							style={{ width: windowWidth <= BREAKPOINT_MOBILE_LARGE ? '100%' : 'calc((100% - var(--mantine-spacing-sm)) * .7)' }}
							{...form.getInputProps('image')}
						/>
					</Group>
				</Stack>
			</Group>

			<Button
				variant="gradient"
				gradient={gradient}
				onClick={() => onSubmit(form.values)}
				disabled={isPending || !form.isValid() || user === undefined}
				loading={isPending}
				mt="md"
			>
        Save
			</Button>
		</Card>
	);
}
