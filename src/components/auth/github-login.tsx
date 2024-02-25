'use client';

import { Button, useComputedColorScheme } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FaGithub } from 'react-icons/fa';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export const GitHubLogin = () => {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl');
	const colorScheme = useComputedColorScheme();

	return (
		<Button 
			variant="outline" 
			color={colorScheme === 'dark' ? 'white' : 'black'}
			leftSection={<FaGithub />}
			onClick={() => {
				signIn('github', {
					callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
				});
			}}
		>
      Login
		</Button>
	);
};
