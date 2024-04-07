import { Card, Stack, Group, Badge, Text, Accordion, Checkbox, CheckboxProps, TextInput, Button, Modal } from '@mantine/core'
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useState, useTransition } from 'react';
import { MdDelete } from 'react-icons/md';
import { TiWarning } from 'react-icons/ti';

import { useCurrentUser } from '~/hooks/use-current-user';
import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_DESKTOP_MEDIUM, BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient, gradientDanger } from '~/lib/utils';
import { deleteContributions } from '~/server/data/contributions';
import type { ContributionWithCoAuthorsAndPoll } from '~/types';

import { ContributionSubmittedItem } from './submitted-item';

import '../submit.scss';

export interface ContributionDraftPanelProps {
	contributions: ContributionWithCoAuthorsAndPoll[];
}

export function ContributionSubmittedPanel({ contributions }: ContributionDraftPanelProps) {
	const [windowWidth, _] = useDeviceSize();
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [isPending, startTransition] = useTransition();
	const [displayedContributions, setDisplayedContributions] = useState<ContributionWithCoAuthorsAndPoll[]>(contributions);
	const [searchedContributions, setSearchedContributions] = useState<ContributionWithCoAuthorsAndPoll[]>(contributions);

	const [deletionMode, setDeletionMode] = useState(false);
	const [deletionList, setDeletionList] = useState<string[]>([]);

	const author = useCurrentUser()!;
	const form = useForm<{ search: string, delete: string }>({
		initialValues: {
			search: '',
			delete: '',
		},
	});

	const CheckboxIcon: CheckboxProps['icon'] = ({ ...others }) => <TiWarning {...others} />;

	const checkDeletionListFor = (id: string) => {
		if (!deletionMode) return;

		if (deletionList.includes(id)) {
			setDeletionList(deletionList.filter((i) => i !== id)); 
			return;
		}

		setDeletionList([...deletionList, id]);
	};

	const deleteDeletionList = () => {
		if (deletionList.length === 0) return;
		startTransition(() => {
			deleteContributions(author.id!, ...deletionList);
			closeModal();
			setDisplayedContributions(displayedContributions.filter((c) => !deletionList.includes(c.id)));
			setDeletionList([]);
			searchContribution(form.values.search); // update displayed contributions
		});
	};

	const searchContribution = (search: string) => {
		if (!displayedContributions) return;

		if (!search || search.length === 0) {
			setSearchedContributions(displayedContributions);
			return;
		}

		const filtered = displayedContributions?.filter((c) => c.filename.toLowerCase().includes(search.toLowerCase()));
		setSearchedContributions(filtered);
	};

	return (
		<Card
			withBorder
			shadow="sm"
			radius="md"
			p={0}
		>
			<Modal
				opened={modalOpened}
				onClose={closeModal}
				centered
				title={'Delete ' + (deletionList.length > 1 ? 'contributions' : 'contribution')}
			>
				<Stack gap="sm">
					<Text fw={700} inherit>Are you sure you want to delete {deletionList.length > 1 ? 'those contributions' : 'this contribution'}?</Text>
					<Text c="red" inherit>{deletionList.length > 1 ? 'Those' : 'It'} will be permanently removed from the database.</Text>
					
					<TextInput
						description={
							<Text component="span">
								To confirm, type &quot;DELETE&quot; in the box below
							</Text>
						}
						placeholder="DELETE" 
						{...form.getInputProps('delete')}
					/>
					<Group justify="flex-end">
						<Button 
							variant="gradient" 
							gradient={gradient}
							loading={isPending}
							disabled={isPending}
							onClick={() => {
								form.values.delete = '';
								closeModal();
							}}
						>
							Cancel
						</Button>
						<Button 
							variant="gradient" 
							gradient={gradientDanger}
							disabled={form.values.delete !== 'DELETE' || isPending}
							loading={isPending}
							onClick={deleteDeletionList}
						>
							Confirm
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Accordion>
				<Accordion.Item value="submitted">
					<Accordion.Control icon={
						<Badge color="teal" variant="filled">{displayedContributions.length}</Badge>
					}>
						<Text size="md" fw={700}>Submitted</Text>
					</Accordion.Control>
					<Accordion.Panel>
						<Stack>
							<Group justify="space-between" align="start" wrap="nowrap">
								<Group className="w-full">
									<TextInput 
										placeholder="Search contribution..." 
										onKeyUp={() => searchContribution(form.values.search)}
										{...form.getInputProps('search')}
										className="contribution-item"
										style={{
											'--contribution-item-count': windowWidth <= BREAKPOINT_MOBILE_LARGE
												? .89
												: windowWidth <= BREAKPOINT_DESKTOP_MEDIUM
													? 1.89
													: 2.89
										}}
									/>
									<Checkbox
										icon={CheckboxIcon}
										checked={deletionMode}
										label="Deletion mode"
										color="orange"
										onChange={(event) => {
											setDeletionMode(event.currentTarget.checked);
											if (!event.currentTarget.checked) setDeletionList([]);
										}}
									/>
								</Group>
								<Button
									variant="gradient"
									gradient={gradientDanger}
									onClick={openModal}
									disabled={deletionList.length === 0 || !deletionMode}
									className={deletionList.length === 0 || !deletionMode ? 'button-disabled-with-bg navbar-icon-fix' : 'navbar-icon-fix'}
								>
									<MdDelete />
								</Button>
							</Group>
							<Stack gap="sm">
								{displayedContributions && displayedContributions.length === 0 && <Text size="sm" c="dimmed">Nothing yet</Text>}
								{displayedContributions && displayedContributions.length > 0 &&
									<>
										<Group>
											{searchedContributions.length > 0 && searchedContributions.map((contribution, index) => 
												<ContributionSubmittedItem
													contribution={contribution}
													key={index}
													className={[
														deletionMode ? 'contribution-item-hover' : '', 
														deletionList.includes(contribution.id) ? 'danger-border' : ''
													]}
													onClick={() => checkDeletionListFor(contribution.id)}
												/>
											)}
											{searchedContributions.length === 0 && 
												<Text size="sm" c="dimmed">No results found</Text>
											}
										</Group>
									</>
								}
							</Stack>
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</Card>
	)
}