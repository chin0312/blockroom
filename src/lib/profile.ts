export const avatarVariants = ["violet", "cobalt", "mint", "ember", "silver", "midnight"] as const;
export type AvatarVariant = (typeof avatarVariants)[number];

export const PROFILE_UPDATED_EVENT = "blockroom:profile-updated";

function profileKey(address: string) {
  return `blockroom:profile:${address.toLowerCase()}`;
}

export function getAvatarVariant(address?: string): AvatarVariant {
  if (!address || typeof window === "undefined") return "violet";
  const stored = window.localStorage.getItem(profileKey(address));
  return avatarVariants.includes(stored as AvatarVariant)
    ? (stored as AvatarVariant)
    : "violet";
}

export function setAvatarVariant(address: string, avatar: AvatarVariant) {
  window.localStorage.setItem(profileKey(address), avatar);
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: { address, avatar } }));
}
