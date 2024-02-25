"use client";

import * as z from "zod";
import { useTransition, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, FormErrors } from '@mantine/form';

import { UserSettingsSchema } from "@/src/schemas";
import { updateUser } from "@/src/server/actions/settings";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { Button, Text, Card, TextInput } from "@mantine/core";
import { capitalize, notify } from "@/src/lib/utils";
import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from "@/src/lib/constants";

export function UserSettingsPanel() {
  const user = useCurrentUser();

  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof UserSettingsSchema>>({
    initialValues: {
      name: user?.name || '',
      role: capitalize(user?.role || 'USER') as z.infer<typeof UserSettingsSchema>['role']
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    validate: {
      name: (value) => {
        if (!value) return 'You must provide a name';
        if (value.length < MIN_USERNAME_LENGTH) return `Your name should be at least ${MIN_USERNAME_LENGTH} characters long`;
        if (value.length > MAX_USERNAME_LENGTH) return `Your name should be less than ${MAX_USERNAME_LENGTH} characters long`;
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
      <Text fw={500}>Profile Settings</Text>

      <TextInput label="Name" {...form.getInputProps('name')} mt="md" />
      <TextInput label="Status" {...form.getInputProps('role')} mt="sm" disabled />

      <Button 
        variant="gradient"
        gradient={{ from: 'cyan', to: 'teal', deg: 90 }}
        onClick={() => onSubmit(form.values)}
        fullWidth 
        loading={isPending}
        mt="md"
      >
        Save
      </Button>
    </Card>
	)
}