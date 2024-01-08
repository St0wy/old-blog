import Datetime from "./Datetime";
import type { BlogFrontmatter } from "@content/_schemas";

export interface Props {
	href?: string;
	frontmatter: BlogFrontmatter;
	secHeading?: boolean;
}

export default function Card({ href, frontmatter }: Props) {
	const { title, pubDatetime, description } = frontmatter;
	return (
		<li className="my-6">
			<a
				href={href}
				className="inline-block text-lg font-medium font-sans text-skin-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
			>
				<h3 className="text-lg font-medium decoration-dashed hover:underline">
					{title}
				</h3>
			</a>
			<Datetime datetime={pubDatetime} />
			<p>{description}</p>
		</li>
	);
}
