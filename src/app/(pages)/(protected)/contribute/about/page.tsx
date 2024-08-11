'use client';

import { useEffect, useState } from 'react';

import { Button, Badge, Text, Checkbox } from '@mantine/core';

import { Tile } from '~/components/tile';
import { useDeviceSize } from '~/hooks/use-device-size';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { BREAKPOINT_MOBILE_LARGE, COLORS } from '~/lib/constants';

const ContributeAboutPage = () => {
	const [windowWidth] = useDeviceSize();

	const [checked, setChecked] = useState<boolean | null>(null);

	useEffect(() => {
		if (checked === null) return;
		localStorage.setItem('faithful-mods-contribute-about', JSON.stringify(checked));
	}, [checked]);

	useEffectOnce(() => {
		try {
			const value: boolean = JSON.parse(localStorage.getItem('faithful-mods-contribute-about') ?? 'false');
			setChecked(value);
		} catch (e) {
			setChecked(false);
		}
	});

	return (
		<Tile>
			{windowWidth > BREAKPOINT_MOBILE_LARGE && <Button pos="absolute" right="var(--mantine-spacing-md)" disabled>Apply for Council</Button>}
			<Text size="md" fw={700} mb="sm">Submission Process</Text>
			<Text size="sm">
				Once submitted, your submissions are subject to a voting process by the council and their decision is final.<br />
				When all counselors have voted, the following will happen:
			</Text>
			<ul>
				<Text size="sm" component="li">
					If the contribution has more upvotes than downvotes, it will be <Badge component="span" color="teal">accepted</Badge>
				</Text>
				<Text size="sm" component="li">
					If there is more downvotes or the same amount of upvotes and downvotes, it will be <Badge component="span" color={COLORS.REJECTED}>rejected</Badge> and deleted after a 6-month period.
				</Text>
			</ul>
			<Text size="sm">
				When your submissions are in <Badge component="span" color={COLORS.DRAFT}>draft</Badge> or <Badge component="span" color={COLORS.PENDING}>pending</Badge> status,
				you can edit them as many times as you like. <br/> Note that if you edit your contribution (even when rejected), its status will be reset to <Badge component="span" color={COLORS.DRAFT}>draft</Badge> and will need to be re-submitted and re-voted on.
			</Text>
			{windowWidth <= BREAKPOINT_MOBILE_LARGE && <Button mt="sm" disabled>Apply for Council</Button>}

			<Checkbox
				mt="md"
				checked={checked ?? false}
				onChange={(e) => setChecked(e.target.checked)}
				label={<Text size="sm" c="dimmed">I have read and understood the submission process, don&apos;t show this page again</Text>}
			/>
		</Tile>
	);
};

export default ContributeAboutPage;
