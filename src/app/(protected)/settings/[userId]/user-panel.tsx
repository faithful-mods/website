'use client';

import { Button, Text, Card, TextInput, Image, Group, Stack, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import * as z from 'zod';

import { useCurrentUser } from '@/hooks/use-current-user';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@/lib/constants';
import { capitalize, gradient, notify } from '@/lib/utils';
import { UserSettingsSchema } from '@/schemas';
import { updateUser } from '@/server/actions/settings';


export function UserSettingsPanel() {
	const user = useCurrentUser();

	const { update } = useSession();
	const [isPending, startTransition] = useTransition();

	const form = useForm<z.infer<typeof UserSettingsSchema>>({
		initialValues: {
			name: user?.name || '',
			image: user?.image || '',
		},
		validateInputOnBlur: true,
		validateInputOnChange: true,
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name';
				if (value.length < MIN_NAME_LENGTH) return `Your name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `Your name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
		}
	});

	const onSubmit = (values: z.infer<typeof UserSettingsSchema>) => {
		startTransition(() => {
			updateUser(values)
				.then((data) => {
					if (!data.success) return notify('Error', data.error, 'red');

					update();
					notify('Success', 'Profile updated', 'teal');
				})
				.catch((err) => {
					console.error(err);
					notify('Error', 'Something went wrong', 'red')
				});
		});
	}

	return (
		<Card 
			className="w-[500px]"
			shadow="sm" 
			padding="md" 
			radius="md" 
			withBorder
		>
			<Group align="start">
				<Image radius="md" src={user?.image || ''} alt="User avatar" width={100} height={100} />
				<Stack align="start" gap={0}>
					<Text size="md" fw={700}>Profile Settings</Text>
					<Text size="sm">Update your profile information</Text>
					<Group gap="sm">
						<Badge mt="sm" color="teal" variant="filled">{user?.role}</Badge>
					</Group>
				</Stack>
			</Group>

			<TextInput label="Name" {...form.getInputProps('name')} mt="md" />
			<TextInput label="Picture URL" {...form.getInputProps('image')} mt="sm" />

			<Button 
				variant="gradient"
				gradient={gradient}
				onClick={() => onSubmit(form.values)}
				fullWidth 
				disabled={isPending || !form.isValid()}
				loading={isPending}
				mt="md"
			>
        Save
			</Button>
		</Card>
	)
}