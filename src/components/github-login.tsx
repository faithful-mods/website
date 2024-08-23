'use client';

import { useSearchParams } from 'next/navigation';

import { FaGithub } from 'react-icons/fa';

import { Button } from '@mantine/core';
import { signIn } from 'next-auth/react';

import { DEFAULT_LOGIN_REDIRECT } from '~/routes';

export const GitHubLogin = () => {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl');

	return (
		<Button 
			variant="outline" 
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
