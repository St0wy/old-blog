import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";
import type { APIContext } from 'astro';

const postImportResult = await getCollection("blog", ({ data }) => !data.draft);
const posts = Object.values(postImportResult);

export const GET: APIRoute = async (context: APIContext): Promise<Response> => {
	console.log(context.params.ogTitle);
	const post = posts.find((elem) => elem.data.postSlug === context.params.ogTitle);
	if (!post) {
		throw new Error("Could not find correct post");
	}

	let body = await generateOgImage(post.data.title, post.data.postSlug);
	return new Response(body);
};

export function getStaticPaths() {
	return posts
		.map(({ data }) => ({
			params: {
				ogTitle: data.postSlug,
			},
		}));
}
