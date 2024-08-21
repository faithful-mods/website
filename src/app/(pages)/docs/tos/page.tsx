'use client';

import { List, Text } from '@mantine/core';

import { Tile } from '~/components/base/tile';

export default function RulesPage() {

	const mantineTextWidthFix = {
		width: 'calc(100% - var(--mantine-spacing-lg))',
	};

	return (
		<Tile mb="sm">
			<Text size="md" fw={700}>Terms of Service (ToS)</Text>
			<Text size="sm">
				As a contributor of this platform, you are expected to respect the following terms:<br/>
				<Text component="span" fs="italic" c="dimmed">
					Failure to do so may result in your contributions being rejected or/and your account being banned.
				</Text>
			</Text>

			<List mt="sm" spacing="md">
				<List.Item>
					<Text size="sm" fw={700}>No hate speech</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains hate speech, or any other form of discrimination.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No spam</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit the same contribution multiple times. If it was rejected, please fix the issues and resubmit it.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No NSFW</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains nudity, sexual content, or any other NSFW content.
						Minecraft is a game for all ages, so keep it family-friendly.
						<Text component="span" fw={700}>This will result in an immediate ban.</Text>
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No malicious content</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains malicious content, such as viruses, malware, or any other harmful content.
						<Text component="span" fw={700}>This will result in an immediate ban.</Text>
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No illegal content</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains illegal content, such as pirated content, or any other illegal content.
						<Text component="span" fw={700}>This will result in an immediate ban.</Text>
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No impersonation</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not impersonate other users, or any other person or entity.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No plagiarism</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains content that you do not own, or that you do not have the right to use.
						If you are using someone else&apos;s content, make sure to credit them properly.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No self-promotion</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that contains self-promotion, such as links to your own website, or any other self-promotion.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No off-topic content</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that is off-topic, or that does not belong in the current category.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No low-effort content</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that is low-effort, such as spam, or any other low-effort content.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No trolling</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any contribution that is intended to provoke, or that is intended to cause disruption.
					</Text>
				</List.Item>

				<List.Item>
					<Text size="sm" fw={700}>No false reports</Text>
					<Text size="sm" style={mantineTextWidthFix}>
						Do not submit any false reports, or any other false information. If your not sure, please specify it in the report.
					</Text>
				</List.Item>
			</List>

			<Text mt="md" size="sm" c="red">Those rules may be updated at any time without notice, so please check them regularly.</Text>
		</Tile>
	);
}
