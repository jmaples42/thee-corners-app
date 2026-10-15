// Is this URL an invitation link? Matches the universal link and the custom scheme
// (the landing page's "Open Corners" button uses the scheme as a fallback).
const INVITE_LINK = /^(?:https:\/\/corners\.thefanlab\.com|com\.theecorners\.app:\/\/)\/?invite(?:[/?#]|$)/i;

export function isInviteLink(url: string | null | undefined): boolean {
  return !!url && INVITE_LINK.test(url.trim());
}
