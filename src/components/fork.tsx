import Link from 'next/link';

import { useTransition } from 'react';

import { GoCheckCircle, GoStop } from 'react-icons/go';

import { Button, Group, Image, Text } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, BREAKPOINT_TABLET } from '~/lib/constants';
import { forkRepository, getFork } from '~/server/actions/octokit';

import { Tile } from './base/tile';

interface Props {
	onUrlUpdate: (url: string | null) => void;
	forkUrl: string | null;
	hideIfForked?: boolean;
}

export default function ForkInfo({ onUrlUpdate, forkUrl, hideIfForked }: Props) {
	const { width } = useViewportSize();
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
			<Tile p="xs" color="teal" mih={56}>
				<Group justify="space-between" gap="sm" mt="auto" mb="auto">
					<Group gap="sm">
						<GoCheckCircle size={20} color="white" />
						<Group gap={3}>
							<Text size="sm" c="white">Default textures repository forked: </Text>
							<Text size="sm" c="white">
								<Link href={forkUrl} style={{ color: 'white' }} target="_blank">
									{width <= BREAKPOINT_MOBILE_LARGE ? 'link' : forkUrl}
								</Link>
							</Text>
						</Group>
					</Group>

					{width > BREAKPOINT_TABLET && (
						<Group gap="sm">
							<Button
								variant="outline"
								color="white"
								onClick={() => window.location.href = `x-github-client://openRepo/${forkUrl}`}
								loading={loading}
								fullWidth={width <= BREAKPOINT_TABLET}
								rightSection={<Image src="/gh_desktop.png" alt="" h={20} />}
							>
								{width > BREAKPOINT_TABLET ? 'Open with GitHub Desktop' : 'Open'}
							</Button>
						</Group>
					)}
				</Group>
			</Tile>
		);
	}

	return (
		<Tile p="xs" pl={width <= BREAKPOINT_MOBILE_LARGE ? 'xs' : 'md'} color="yellow">
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
					fullWidth={width <= BREAKPOINT_MOBILE_LARGE}
				>
					Create Fork
				</Button>
			</Group>
		</Tile>
	);
}
