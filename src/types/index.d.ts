type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type UpdateObject<T extends { id: string }> = Prettify<
	Partial<T> & Required<Pick<T, 'id'>>
>;

export type CreateObject<T extends { id: string }, K extends keyof T = 'id'> = 
	Prettify<Omit<T, 'id' | 'createdAt' | 'updatedAt' | K>>;
