# Moderation (v1)

Release comments have an optional `isHidden` boolean field. There is no report queue or admin UI for v1 — to hide a comment, open the Firebase console → Firestore → `releases/{releaseId}/comments/{commentId}` and set `isHidden: true`. `subscribeToReleaseComments` filters hidden comments out client-side before rendering. Users can delete their own comments from within the app (the "Delete" action on a comment they authored), which covers most self-serve cases; the console is the tool for everything else.
