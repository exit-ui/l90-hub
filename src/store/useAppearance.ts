import { create } from 'zustand';
import { loadPhoto, preparePhoto, removePhoto, savePhoto } from '@/lib/media';

/**
 * The look of the hub on this device: the background photo.
 * It is not part of the hub record, so a backup does not hold it.
 */
interface AppearanceState {
  /** An object URL of the stored photo. Null shows the Night city. */
  photoUrl: string | null;
  photoLuminance: number;
  /** The rendered Night city, for the preview in Setup. */
  cityUrl: string | null;
  loaded: boolean;
  setCityUrl: (url: string | null) => void;
  load: () => Promise<void>;
  /** Returns an error text, or null when the photo is stored. */
  choosePhoto: (file: File) => Promise<string | null>;
  clearPhoto: () => Promise<void>;
}

function replaceUrl(previous: string | null, next: string | null): string | null {
  if (previous && previous !== next) {
    URL.revokeObjectURL(previous);
  }
  return next;
}

export const useAppearance = create<AppearanceState>()((set, get) => ({
  photoUrl: null,
  photoLuminance: 0,
  cityUrl: null,
  loaded: false,
  setCityUrl: (url) => set((state) => ({ cityUrl: replaceUrl(state.cityUrl, url) })),
  load: async () => {
    if (get().loaded) {
      return;
    }
    set({ loaded: true });
    const photo = await loadPhoto();
    if (photo) {
      set((state) => ({
        photoUrl: replaceUrl(state.photoUrl, URL.createObjectURL(photo.blob)),
        photoLuminance: photo.luminance,
      }));
    }
  },
  choosePhoto: async (file) => {
    const prepared = await preparePhoto(file);
    if (!prepared.ok) {
      return prepared.error;
    }
    const saved = await savePhoto(prepared.photo);
    set((state) => ({
      photoUrl: replaceUrl(state.photoUrl, URL.createObjectURL(prepared.photo.blob)),
      photoLuminance: prepared.photo.luminance,
    }));
    return saved ? null : 'The photo shows now, but this browser did not store it. It goes after a reload.';
  },
  clearPhoto: async () => {
    await removePhoto();
    set((state) => ({ photoUrl: replaceUrl(state.photoUrl, null), photoLuminance: 0 }));
  },
}));
