import { useEffect } from 'react';
import { getFolders } from '../api/folders';
import { getTags } from '../api/tags';
import { useNoteStore } from '../store/noteStore';
import { useAuthStore } from '../store/authStore';

export const useInitApp = () => {
  const { isAuthenticated } = useAuthStore();
  const { setFolders, setTags } = useNoteStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        const [foldersData, tagsData] = await Promise.all([
          getFolders(),
          getTags(),
        ]);
        setFolders(foldersData);
        setTags(tagsData);
      } catch {
        // silently fail
      }
    };

    init();
  }, [isAuthenticated]);
};
