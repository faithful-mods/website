import { useState } from 'react';

import { Avatar, Group, MultiSelect, Text } from '@mantine/core';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { notify } from '~/lib/utils';
import { getPublicUsers } from '~/server/data/user';

import type { MultiSelectProps } from '@mantine/core';
import type { useCurrentUser } from '~/hooks/use-current-user';
import type { PublicUser } from '~/types';

/**
 * Select co-authors for a contribution.
 * The current user is excluded from the list of selectable co-authors.
 */
export interface CoAuthorsSelectorProps extends MultiSelectProps {
	author: NonNullable<ReturnType<typeof useCurrentUser>>;
	onCoAuthorsSelect: (coAuthors: PublicUser[]) => void;
}

export function CoAuthorsSelector({ author, onCoAuthorsSelect, ...props }: CoAuthorsSelectorProps) {
	const [users, setUsers] = useState<PublicUser[]>([]);

	useEffectOnce(() => {
		getPublicUsers()
			.then(setUsers)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch users', 'red');
			});
	});

	const renderMultiSelectOption: MultiSelectProps['renderOption'] = ({ option }) => {
		const user = users.find((u) => u.id === option.value)!;

		return (
			<Group gap="sm" wrap="nowrap">
				<Avatar src={user.image} size={30} radius="xl" />
				<div>
					<Text size="sm">{option.label}</Text>
					{option.disabled && <Text size="xs" c="dimmed">That&apos;s you!</Text>}
				</div>
			</Group>
		);
	};

	return (
		<MultiSelect
			limit={10}
			label="Co-authors"
			placeholder="Select or search co-authors..."
			data={users.map((u) => ({ value: u.id, label: u.name ?? 'Unknown', disabled: u.id === author.id }))}
			renderOption={renderMultiSelectOption}
			defaultValue={[]}
			onChange={(userIds: string[]) => onCoAuthorsSelect(userIds.map((u) => users.find((user) => user.id === u)!))}
			hidePickedOptions
			searchable
			clearable
			{...props}
		/>
	);
}
