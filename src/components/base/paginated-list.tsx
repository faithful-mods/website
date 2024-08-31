import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { RefObject } from 'react';

import { Group, Loader, Pagination, Select, Stack, Text, TextInput } from '@mantine/core';
import { usePrevious } from '@mantine/hooks';

import { useEffectOnce } from '~/hooks/use-effect-once';
import { ITEMS_PER_PAGE, ITEMS_PER_ROW } from '~/lib/constants';
import { searchFilter, sortByName } from '~/lib/utils';

interface Props<T> {
	items: T[];
	renderItem: (item: T) => JSX.Element;
	leftFilters?: JSX.Element;
	rightFilters?: JSX.Element;
	onUpdate?: (params: onUpdateParams) => void;
}

interface onUpdateParams {
	itemsPerPage: number;
	itemsPerRow: number;
	activePage: number;
	search: string;
	searchResults: number;
	containerRef: RefObject<HTMLDivElement>;
}

export function PaginatedList<T extends { name: string; id: string | number; }>({ items, leftFilters, rightFilters, renderItem, onUpdate }: Props<T>) {
	const [isLoading, startTransition] = useTransition();

	const [filtered, setFilteredItems] = useState<T[]>([]);
	const [shown, setShownItems] = useState<T[][]>([[]]);

	const [shownPerPage, setShownPerPage] = useState<number>(96);
	const [shownPerRow, setShownPerRow] = useState<number>(12);

	const [activePage, setActivePage] = useState<number>(1);

	const itemsPerPage = useMemo(() => ITEMS_PER_PAGE, []);
	const itemsPerRow = useMemo(() => ITEMS_PER_ROW, []);

	const [search, setSearch] = useState('');
	const prevSearch = usePrevious(search);

	const containerRef = useRef<HTMLDivElement>(null);

	const handleUpdate = () => {
		onUpdate?.({
			itemsPerPage: shownPerPage,
			itemsPerRow: shownPerRow,
			activePage,
			search,
			searchResults: filtered.length,
			containerRef,
		});
	};

	useEffectOnce(() => {
		handleUpdate();
	});

	useEffect(() => {
		if (isLoading) return;
		handleUpdate();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, shownPerPage, shownPerRow]);

	useEffect(() => {
		startTransition(() => {
			const chunks: T[][] = [];

			for (let i = 0; i < filtered.length; i += shownPerPage) {
				chunks.push(filtered.slice(i, i + shownPerPage));
			}

			if (!prevSearch || filtered.length !== prevSearch.length) {
				setActivePage(1);
			}

			setShownItems(chunks);
		});
	}, [filtered, prevSearch, shownPerPage]);

	useEffect(() => {
		startTransition(() => {
			if (!search) {
				setFilteredItems(items);
				return;
			}

			setFilteredItems(
				items
					.filter(searchFilter(search))
					.sort(sortByName)
			);
		});
	}, [items, search]);

	return (
		<Stack>
			<Group w="100%" gap="sm" wrap="nowrap" align="end">
				{leftFilters}

				<Group w="100%" align="center" gap="sm" wrap="nowrap">
					<TextInput
						label="Search"
						placeholder="Search for name, id or aliases..."
						w="calc(100% - (2 * 120px) - (2 * var(--mantine-spacing-sm)))"
						onChange={(e) => setSearch(e.currentTarget.value)}
					/>
					<Select
						label="Items per page"
						data={itemsPerPage}
						value={shownPerPage.toString()}
						onChange={(e) => e ? setShownPerPage(parseInt(e, 10)) : null}
						checkIconPosition="right"
						w="120px"
					/>
					<Select
						label="Items per row"
						data={itemsPerRow}
						value={shownPerRow.toString()}
						onChange={(e) => e ? setShownPerRow(parseInt(e, 10)) : null}
						checkIconPosition="right"
						w="120px"
					/>
				</Group>

				{rightFilters}
			</Group>

			<Group
				w="100%"
				gap={10}
				ref={containerRef}
			>
				{isLoading && (
					<Group
						align="center"
						justify="center"
						w="100%"
						h="calc(81% - (2 * var(--mantine-spacing-sm) - 62px))"
					>
						<Loader color="blue" mt={5} />
					</Group>
				)}

				{!isLoading && search === '' && items.length === 0 && (
					<Group
						align="center"
						justify="center"
						w="100%"
						gap="md"
						h="calc(81% - (2 * var(--mantine-spacing-sm) - 62px))"
					>
						<Text c="dimmed">Nothing yet!</Text>
					</Group>
				)}

				{!isLoading && search !== '' && filtered.length === 0 && (
					<Group
						align="center"
						justify="center"
						w="100%"
						gap="md"
						h="calc(81% - (2 * var(--mantine-spacing-sm) - 62px))"
					>
						<Text c="dimmed">No results for &quot;{search}&quot;</Text>
					</Group>
				)}

				{!isLoading && shown[activePage - 1] && shown[activePage - 1]?.map((t) => renderItem(t))}
			</Group>

			{!isLoading && (
				<Group mt="md" mb="sm" justify="center">
					<Pagination total={shown.length} value={activePage} onChange={setActivePage} />
				</Group>
			)}
		</Stack>
	);
}
