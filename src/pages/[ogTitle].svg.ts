import { getCollection } from "astro:content";
import generateOgImage from "@utils/generateOgImage";
import type { APIRoute } from "astro";
import type { APIContext } from 'astro';

const postImportResult = await getCollection("blog", ({ data }) => !data.draft);
const posts = Object.values(postImportResult);

export const get: APIRoute = async (context: APIContext) => ({
  body: await generateOgImage(context.params.ogTitle),
});

export function getStaticPaths() {
  return posts
    .filter(({ data }) => !data.ogImage)
    .map(({ data }) => ({
      params: {
        ogTitle: data.postSlug,
      },
    }));
}
