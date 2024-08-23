'use server';
import 'server-only';

import { Octokit } from '@octokit/rest';
import { Resolution } from '@prisma/client';

import { auth } from '~/auth';
import { gitRawUrl, GITHUB_DEFAULT_REPO_NAME, GITHUB_ORG_NAME } from '~/lib/constants';
import { db } from '~/lib/db';

import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { RawUrl } from '~/lib/constants';

/**
 * Get an authenticated Octokit instance
 */
export async function getOctokit(): Promise<Octokit> {
	const session = await auth();
	const user = session?.user;

	if (!user) throw new Error('No user logged in');
	const userAccount = await db.account.findFirstOrThrow({ where: { userId: user.id }, select: { access_token: true } });

	const octokit = new Octokit({
		auth: userAccount.access_token,
	});

	return octokit;
}

/**
 * Get the URL of the forked repository from the logged user's account or null if it doesn't exist
 */
export async function getFork() {
	const octokit = await getOctokit();
	const username = await getUserGitHubUsername(octokit);

	let fork: RestEndpointMethodTypes['repos']['get']['response'];
	try {
		fork = await octokit.repos.get({
			owner: username,
			repo: GITHUB_DEFAULT_REPO_NAME,
		});
	} catch {
		return null;
	}

	return fork.data.html_url;
}

/**
 * Delete the forked repository from the logged user's account
 */
export async function deleteFork() {
	const octokit = await getOctokit();
	const username = await getUserGitHubUsername(octokit);

	await octokit.repos.delete({
		owner: username,
		repo: GITHUB_DEFAULT_REPO_NAME,
	});
}

/**
 * Fork the default textures repository to the user's account,
 * create empty branches for each resolution and set x32 as the default branch
 */
export async function forkRepository() {
	const octokit = await getOctokit();

	// Fork the repository
	await octokit.repos.createFork({
		owner: GITHUB_ORG_NAME,
		repo: GITHUB_DEFAULT_REPO_NAME,
	});

	let forkReady = false;
	const username = await getUserGitHubUsername(octokit);

	// wait for the fork to be ready before doing anything else
	while (!forkReady) {
		const fork = await octokit.repos.get({
			owner: username,
			repo: GITHUB_DEFAULT_REPO_NAME,
		});

		if (fork.status === 200) forkReady = true;

		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	// create empty branches for each resolution
	const resolutions = Object.keys(Resolution) as Resolution[];
	const SHA1_EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'; // see https://github.com/orgs/community/discussions/24699

	const res = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
		owner: username,
		repo: GITHUB_DEFAULT_REPO_NAME,
		message: 'initial commit',
		tree: SHA1_EMPTY_TREE,
		parents: [],
	});

	for (const resolution of resolutions) {
		await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
			owner: username,
			repo: GITHUB_DEFAULT_REPO_NAME,
			ref: `refs/heads/${resolution}`,
			sha: res.data.sha,
		});
	}

	// set x32 as default branch and delete main (x16) as it's not needed
	await octokit.repos.update({
		owner: username,
		repo: GITHUB_DEFAULT_REPO_NAME,
		default_branch: 'x32',
	});

	// delete main branch (x16 resolution) from the fork
	await octokit.git.deleteRef({
		owner: username,
		repo:GITHUB_DEFAULT_REPO_NAME,
		ref: 'heads/main',
	});
}

export interface GitFile {
	url: RawUrl;
	path: string;
	mode: string;
	type: string;
	sha: string;
	size: number;
}

/**
 * Retrieve the list of files in the forked repository for a specific resolution (branch)
 */
export async function getContributionsOfFork(resolution: Resolution): Promise<GitFile[]> {
	const octokit = await getOctokit();
	const username = await getUserGitHubUsername(octokit);
	const files = await listFilesInBranch(username, GITHUB_DEFAULT_REPO_NAME, resolution);

	return files as GitFile[];
}

/**
 * Get the list of files in a branch
 */
async function listFilesInBranch(owner: string, repo: string, branch: string) {
	const octokit = await getOctokit();
	const { data } = await octokit.git.getRef({
		owner,
		repo,
		ref: `heads/${branch}`,
	});

	const commitSha = data.object.sha;

	// Get the tree structure of the commit
	try {
		const treeResponse = await octokit.git.getTree({
			owner,
			repo,
			tree_sha: commitSha,
			recursive: 'true', // Set to "true" to list all files recursively
		});

		return treeResponse.data.tree
			.filter((item) => item.type === 'blob')
			.map((item) => ({
				...item,
				url: gitRawUrl({ orgOrUser: owner, repository: repo, branchOrCommit: commitSha, path: item.path }),
			}));
	}
	catch {
		return [];
	}

}

/**
 * Get the GitHub username of the currently logged user
 */
export async function getUserGitHubUsername(octokit: Octokit) {
	const { data } = await octokit.users.getAuthenticated();
	return data.login;
}
