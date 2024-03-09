'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, Badge, Card, Code, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { User, UserRole } from '@prisma/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TbExternalLink } from 'react-icons/tb';

import { notify } from '@/lib/utils';
import { getUsers, updateUserRole } from '@/server/actions/admin';

export function UsersPanel() {
	const [users, setUsers] = useState<User[] | undefined>();
	const [filteredUsers, setFilteredUsers] = useState<User[] | undefined>();

	const form = useForm({
		initialValues: {
			search: '',
		},
	});

	const sortUsers = (a: User, b: User) => a.name?.localeCompare(b.name ?? '') || 0;

	const filterUsers = () => {
		const search = form.values['search'];
		if (!search || search.length === 0 || !users) {
			setFilteredUsers(users?.sort(sortUsers));
			return;
		}

		const filtered = users.filter((user) => user.name?.toLowerCase().includes(search.toLowerCase()));
		setFilteredUsers(filtered.sort(sortUsers));
	}

	useEffect(() => {
		getUsers()
			.then((data) => {
				if (!data.success) return notify('Error', data.error, 'red');

				setUsers(data.result.users.sort(sortUsers));
				setFilteredUsers(data.result.users.sort(sortUsers));
			})
			.catch((err) => {
				console.error(err);
				notify('Error', 'Something went wrong', 'red');
			});
	}, []);

	return (
		<Card 
			shadow="sm" 
			padding="md" 
			radius="md" 
			withBorder
		>
			<Group justify="space-between">
				<Text size="md" fw={700}>Users</Text>
				<Badge color="teal" variant="filled">{users?.length ?? '?'}</Badge>
			</Group>
			<TextInput 
				placeholder="Search for a user" 
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
								<Avatar variant="outline" src={user?.image}>
									{ (user.name ?? '?')[0] }
								</Avatar>
								<Text>{user.name ?? 'Unknown User'}</Text>
							</Group>
							<Group gap="sm">
								<Select 
									className="w-[120px]" 
									value={user.role} 
									data={Object.keys(UserRole)}
									allowDeselect={false}
									checkIconPosition="right"
									onChange={(role) => {
										setFilteredUsers(filteredUsers.map((u) => u.id === user.id ? { ...u, role: role as UserRole } : u));
										setUsers(users?.map((u) => u.id === user.id ? { ...u, role: role as UserRole } : u));
										updateUserRole({ id: user.id, role: (role as UserRole) ?? 'USER' });
										// TODO: refresh logged in user if it's the same user
									}}
								/>
								<Link href={'/settings/' + user.id} style={{ height: '22px' }}>
									<TbExternalLink />	
								</Link>
							</Group>
						</Group>
					))}
				</Stack>
			)}
		</Card>
	);
}