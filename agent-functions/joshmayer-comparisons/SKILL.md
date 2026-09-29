---
name: joshmayer-comparisons
description: Compare two to four of Josh Mayer's published blog posts by metadata, exact shared words, shared references, or full text.
---

# Josh Mayer Blog Comparisons

Use this function when the user wants to compare posts without selecting them and configuring each comparison section through the browser.

## Find posts

Use list-posts with an optional query and four-digit year. The result contains full slugs such as /posts/aiweb, titles, descriptions, dates, and estimated reading times. An empty object lists the archive. Only published posts are included. The property context is supplied by TollBit; no site URL argument is needed.

## Compare posts

Use compare-posts with 2–4 distinct slugs in column order. Choose dimensions from overview, terms, links, and text; the default is overview, terms, and links. posts contains the selected metadata/text, sharedTerms contains exact word counts by column, and sharedLinks identifies URLs and the posts that cite them. Empty shared lists mean no matches.

## Limits

Reading time uses 225 words per minute. Full text omits images and rich MDX formatting. Comparisons are deterministic text analysis, not semantic interpretation or version history. Shared words occur in every selected post; shared links occur in at least two. No private content or drafts are included. These operations are free but still require TollBit authorization.
