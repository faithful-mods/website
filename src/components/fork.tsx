import Link from 'next/link';

import { useTransition } from 'react';

import { GoCheckCircle, GoStop } from 'react-icons/go';

import { Button, Group, Text } from '@mantine/core';

import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { forkRepository, getFork } from '~/server/actions/octokit';

import { Tile } from './tile';

interface Props {
	onUrlUpdate: (url: string | null) => void;
	forkUrl: string | null;
	hideIfForked?: boolean;
}

export default function ForkInfo({ onUrlUpdate, forkUrl, hideIfForked }: Props) {
	const [windowWidth] = useDeviceSize();
	const [loading, startTransition] = useTransition();

	const handleSetupForkedRepository = async () => {
		startTransition(async () => {
			await forkRepository();
			const res = await getFork();
			onUrlUpdate(res);
		});
	};

	useEffectOnce(() => {
		startTransition(() => {
			getFork().then(onUrlUpdate);
		});
	});

	if (forkUrl && hideIfForked) return null;

	if (forkUrl) {
		return (
			<Tile p="xs" pl={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'xs' : 'md'} color="teal" mih={56}>
				<Group gap="sm" mt="auto" mb="auto">
					<GoCheckCircle size={20} color="white" />
					<Group gap={3}>
						<Text size="sm" c="white">Default textures repository forked: </Text>
						<Text size="sm" c="white">
							<Link href={forkUrl} style={{ color: 'white' }} target="_blank">
								{windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'link' : forkUrl}
							</Link>
						</Text>
					</Group>
				</Group>
			</Tile>
		);
	}

	return (
		<Tile p="xs" pl={windowWidth <= BREAKPOINT_MOBILE_LARGE ? 'xs' : 'md'} color="yellow">
			<Group justify="space-between" gap="xs">
				<Group gap="sm">
					<GoStop color="black" size={20} />
					<Group gap="xs">
						<Text size="sm" c="black">Default textures repository not forked</Text>
					</Group>
				</Group>

				<Button
					variant="outline"
					color="black"
					onClick={handleSetupForkedRepository}
					disabled={!!forkUrl}
					loading={loading}
					fullWidth={windowWidth <= BREAKPOINT_MOBILE_LARGE}
				>
					Create Fork
				</Button>
			</Group>
		</Tile>
	);
}
