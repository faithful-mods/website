'use client';

import Link from 'next/link';

import { useState } from 'react';

import { FaArrowRight } from 'react-icons/fa';

import { Avatar, Badge, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { UserRole } from '@prisma/client';

import { Tile } from '~/components/tile';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { GRADIENT, MINIMUM_CARD_WIDTH } from '~/lib/constants';
import { notify } from '~/lib/utils';
import { getUsers, updateUserRole } from '~/server/data/user';

import type { UserWithReports } from '~/types';

const UsersPanel = () => {
	const [users, setUsers] = useState<UserWithReports[] | undefined>();
	const [filteredUsers, setFilteredUsers] = useState<UserWithReports[] | undefined>();
	const loggedUser = useCurrentUser()!;

	const form = useForm({
		initialValues: {
			search: '',
		},
	});

	const sortUsers = (a: UserWithReports, b: UserWithReports) => a.name?.localeCompare(b.name ?? '') || 0;

	const filterUsers = () => {
		const search = form.values['search'];
		if (!search || search.length === 0 || !users) {
			setFilteredUsers(users?.sort(sortUsers));
			return;
		}

		const filtered = users.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setFilteredUsers(filtered.sort(sortUsers));
	};

	useEffectOnce(() => {
		getUsers()
			.then((users) => {
				setUsers(users.sort(sortUsers));
				setFilteredUsers(users.sort(sortUsers));
			})
			.catch((err) => {
				console.error(err);
				notify('Error', err.message, 'red');
			});
	});

	return (
		<Tile style={{ minWidth: MINIMUM_CARD_WIDTH }}>
			<Group justify="space-between">
				<Text size="md" fw={700}>Users</Text>
				<Badge color="teal" variant="filled">{users?.length ?? '?'}</Badge>
			</Group>
			<TextInput
				placeholder="Search users..."
				onKeyUp={filterUsers}
				{...form.getInputProps('search')}
				mt="md"
			/>

			{!users && (<Text mt="sm">Loading...</Text>)}
			{filteredUsers && filteredUsers.length === 0 && (<Text mt="sm">No users found</Text>)}
			{filteredUsers && (
				<Stack gap="md" mt="sm">
					{filteredUsers.map((user, index) => (
						<Group key={index} justify="space-between" align="center">
							<Group gap="sm">
								<Avatar
									className="navbar-icon-fix solid-background"
									variant="outline"
									radius={4}
									src={user?.image}
									onError={() => setUsers(users?.map((u) => u.id === user.id ? { ...u, image: null } : u))}
								>
									{ (user?.name ?? '?')[0] }
								</Avatar>
								<Stack gap="0">
									<Text>{user.name ?? 'Unknown User'}</Text>
									{user.reports.length > 0 && <Text c="orange" size="xs">Report(s): {user.reports.length}</Text>}
								</Stack>
							</Group>
							<Group gap="sm">
								{user.id !== loggedUser.id && (
									<Select
										className="w-[120px]"
										value={user.role}
										data={Object.keys(UserRole)}
										allowDeselect={false}
										checkIconPosition="right"
										onChange={(role) => {
											setFilteredUsers(filteredUsers.map((u) => u.id === user.id ? { ...u, role: role as UserRole } : u));
											setUsers(users?.map((u) => u.id === user.id ? { ...u, role: role as UserRole } : u));
											updateUserRole(user.id, role as UserRole ?? 'USER');
										}}
									/>
								)}
								<Link href={'/user/' + user.id}>
									<Button
										variant='gradient'
										gradient={GRADIENT}
										className="navbar-icon-fix"
									>
										<FaArrowRight />
									</Button>
								</Link>
							</Group>
						</Group>
					))}
				</Stack>
			)}
		</Tile>
	);
};

export default UsersPanel;
