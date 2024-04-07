'use client';

import { Avatar, Button, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { TbLogout } from 'react-icons/tb';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_TABLET } from '~/lib/constants';
import { gradientDanger } from '~/lib/utils';
import { logout } from '~/server/actions/logout';

export const LoggedUser = () => {
	const user = useCurrentUser();
	const [windowWidth, _] = useDeviceSize();
	const [userPicture, setUserPicture] = useState<string | undefined>(undefined);

	useEffectOnce(() => {
		if (user) setUserPicture(user.image ?? undefined);
	});

	return (
		<Tooltip 
			label={<span className="text-white">Logout</span>}
			position="left"
			className="border shadow-md"
			style={{ background: 'linear-gradient(69deg, var(--mantine-color-red-filled) 0%, var(--mantine-color-pink-filled) 100%)' }}
		>
			<Button 
				className="navbar-icon-fix" 
				variant="transparent"
				color={windowWidth >= BREAKPOINT_TABLET ? 'var(--mantine-color-dark-7)' : gradientDanger.from}
				onClick={() => logout()}
				p={0}
			>
				{windowWidth >= BREAKPOINT_TABLET && 
					<Avatar 
						className="cursor-pointer image-background"
						radius={4}
						src={userPicture}
						onError={() => setUserPicture(undefined)}
					>
						{ (user?.name ?? '?')[0] }
					</Avatar>
				}
				{windowWidth < BREAKPOINT_TABLET && <TbLogout className="cursor-pointer w-5 h-5" />}
			</Button>
		</Tooltip>
	);
};
