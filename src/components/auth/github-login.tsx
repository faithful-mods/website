'use client';

import { signIn } from 'next-auth/react';
import { Button, useComputedColorScheme } from '@mantine/core';
import { FaGithub } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';

import { DEFAULT_LOGIN_REDIRECT } from '@/src/routes';

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
