'use client';

import { Avatar, Tooltip } from '@mantine/core';
import { useState } from 'react';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { logout } from '~/server/actions/logout';

export const LoggedUser = () => {
	const user = useCurrentUser();
	const [userPicture, setUserPicture] = useState<string | undefined>(undefined);

	useEffectOnce(() => {
		if (user) setUserPicture(user.image ?? undefined);
	})

	return (
		<Tooltip 
			label={<span className="text-white">Logout</span>}
			position="left"
			className="border shadow-md"
			style={{ background: 'linear-gradient(69deg, var(--mantine-color-red-filled) 0%, var(--mantine-color-pink-filled) 100%)' }}
		>
			<Avatar 
				className="cursor-pointer navbar-icon-fix image-background"
				variant="outline"
				radius={4}
				src={userPicture}
				onError={() => setUserPicture(undefined)}
				onClick={() => logout()}
			>
				{ (user?.name ?? '?')[0] }
			</Avatar>
		</Tooltip>
	);
};
