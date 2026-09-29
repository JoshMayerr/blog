---
name: joshmayer-collections
description: Create ordered reading collections from Josh Mayer's published blog posts, with notes and Markdown or JSON exports.
---

# Josh Mayer Blog Collections

Use this function when the user wants to assemble a reading packet without selecting, reordering, and annotating each post through the browser.

## Find posts

Use list-posts with an optional query and four-digit year. The result contains full slugs such as /posts/aiweb, titles, descriptions, dates, and estimated reading times. An empty object lists the archive. Only published posts are included. The property context is supplied by TollBit; no site URL argument is needed.

## Create a collection

Use create-collection with a title and an ordered items array of 1–20 distinct objects containing slug and optional note. Notes are at most 1,000 characters. Set format to markdown (default) or json; includeText defaults to false. The returned content, filename, and mimeType are ready to save as a file. items and totalMinutes describe the packet. Nothing is saved, published, or downloaded automatically.

## Limits

Reading time uses 225 words per minute. Full text omits images and rich MDX formatting. Comparisons are deterministic text analysis, not semantic interpretation or version history. Shared words occur in every selected post; shared links occur in at least two. No private content or drafts are included. These operations are free but still require TollBit authorization.
