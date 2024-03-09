import { Group, Image, Text, Stack, Badge, TextInput, Button, FileInput, Skeleton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Modpack } from '@prisma/client';
import { useState, useTransition } from 'react';
import { z } from 'zod';

import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@/lib/constants';
import { gradient, notify, toBase64 } from '@/lib/utils';
import { UpdateOrCreateModpackSchema } from '@/schemas';
import { updateOrCreateModpack } from '@/server/actions/admin';

export function ModpackModal({ modpack, onClose }: { modpack?: Modpack | undefined, onClose: () => void }) {
	const [isPending, startTransition] = useTransition();
	const [previewImg, setPreviewImg] = useState<string>(modpack?.image ?? '');

	const form = useForm<z.infer<typeof UpdateOrCreateModpackSchema>>({
		initialValues: {
			id: modpack?.id || '',
			name: modpack?.name || '',
			image: undefined,
		},
		validateInputOnBlur: true,
		validateInputOnChange: true,
		validate: {
			name: (value) => {
				if (!value) return 'You must provide a name for the modpack';
				if (value.length < MIN_NAME_LENGTH) return `The modpack name should be at least ${MIN_NAME_LENGTH} characters long`;
				if (value.length > MAX_NAME_LENGTH) return `The modpack name should be less than ${MAX_NAME_LENGTH} characters long`;
			},
			image: (value) => {
				if (!value) return 'You must provide an image for the modpack';
			}
		},
		onValuesChange: (value) => setPreviewImg(value.image ? URL.createObjectURL(value.image) : modpack?.image || ''),
	});

	const onSubmit = (values: z.infer<typeof UpdateOrCreateModpackSchema>) => {
		startTransition(() => {
			console.log(values)

			toBase64(values.image!).then((base64) => {
				updateOrCreateModpack({ ...values, image: base64  })
					.then((data) => {
						if (!data.success) return notify('Error', data.error, 'red');
	
						notify('Success', 'Profile updated', 'teal');
						onClose();
					})
					.catch((err) => {
						console.error(err);
						notify('Error', 'Something went wrong', 'red')
					});
			});
		})
	}

	return (
		<>
			<Group gap="md" align="start" mt="md">
				{previewImg !== '' && <Image radius="md" src={previewImg} alt="Modpack image" width={200} height={200} fit="contain" />}
				{previewImg === '' && <Skeleton width={200} height={200} radius="md" animate={false} />}

				<Stack w="calc(100% - 200px - var(--mantine-spacing-md))" gap="sm">
					<FileInput 
						label="Picture" {...form.getInputProps('image')}
						accept="image/*" 
						placeholder={modpack?.image}
					/>
					<TextInput label="Name" {...form.getInputProps('name')} />

					{modpack && <Group gap="sm">
						<Badge mt="sm" color="teal" variant="filled">Created: {modpack.createdAt.toLocaleString()}</Badge>
						<Badge mt="sm" color="teal" variant="filled">Updated: {modpack.updatedAt.toLocaleString()}</Badge>
					</Group>}
				</Stack>

			</Group>


			
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
		</>)
}