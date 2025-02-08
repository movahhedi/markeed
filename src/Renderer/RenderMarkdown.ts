import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItFrontMatter from "markdown-it-front-matter";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
import { Marked } from "marked";
import MarkedAlert from "marked-alert";
import * as Sass from "sass";

import ArticleStyles from "./styles/article.scss?inline";
//@ts-expect-error
import MarkedBidi from "marked-bidi";
import { gfmHeadingId } from "marked-gfm-heading-id";

//@ts-expect-error
export const articleCss = await Sass.compileStringAsync(ArticleStyles);

export const markdownIt = MarkdownIt({
	breaks: true,
	linkify: true,
	html: true,
	xhtmlOut: true,
})
	.use(MarkdownItAnchor)
	.use(MarkdownItFrontMatter)
	.use(MarkdownItGitHubAlerts);

export const marked = new Marked({
	pedantic: false,
	gfm: true,
	breaks: true,
}).use(
	MarkedBidi(),
	MarkedAlert(),
	// markedEmoji({}),
	gfmHeadingId(),
	// markedHighlight({
	// 	 highlight:
	// }),
);

export async function MarkdownToHtmlDataUri(contentRaw: string) {
	// remove front matter
	const contentWithoutFrontmatter = contentRaw.replace(
		/^---\n([\s\S\r\n]*?)\n---[\r?\n?]/,
		"",
	);

	const content = markdownIt.render(contentWithoutFrontmatter, {
		pedantic: false,
		gfm: true,
		breaks: true,
	});

	let cleanContent = DOMPurify.sanitize(content, {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		FORCE_BODY: true,
	});

	// add a `dir="auto"` attribute to `ul` and `ol` elements
	const regex = /<(ul|ol|table)([^>]*)>/g;
	cleanContent = cleanContent.replace(regex, `<$1 dir="auto" $2>`);

	// previewContentRef.current!.innerHTML = cleanContent;

	const contentWithStyle = `${cleanContent}<style>${articleCss.css}</style>`;

	const contentWithPostMessageScript = `${contentWithStyle}<script>
		window.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'scroll') {
				window.scrollTo(0, data.scrollPercent * document.body.scrollHeight);
			}
		});

		window.addEventListener('scroll', () => {
			const scrollPercent = window.scrollY / document.body.scrollHeight;

			window.parent.postMessage(JSON.stringify({
				type: 'scroll',
				scrollPercent,
			}), '*');
		});
	</script>`;

	const dataUri =
		"data:text/html;charset=utf-8," +
		encodeURIComponent(contentWithPostMessageScript);

	return dataUri;
}

export async function MarkdownToHtmlDataUri2(contentRaw: string) {
	// remove front matter
	const contentWithoutFrontmatter = contentRaw.replace(
		/^---\n([\s\S\r\n]*?)\n---[\r?\n?]/,
		"",
	);

	const content = await marked.parse(contentWithoutFrontmatter, {
		pedantic: false,
		gfm: true,
		breaks: true,
	});

	const cleanContent = DOMPurify.sanitize(content, {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		FORCE_BODY: true,
	});

	// previewContentRef.current!.innerHTML = cleanContent;

	const contentWithStyle = `${cleanContent}<style>${articleCss.css}</style>`;

	const dataUri =
		"data:text/html;charset=utf-8," + encodeURIComponent(contentWithStyle);

	return dataUri;
}
