import { useEffect } from 'react';
import { getFolders } from '../api/folders';
import { getTags } from '../api/tags';
import { useNoteStore } from '../store/noteStore';
import { useAuthStore } from '../store/authStore';

export const useInitApp = () => {
  const { isAuthenticated } = useAuthStore();
  const { setFolders, setTags, isStale, setLastFetched } = useNoteStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      try {
        const promises = [];
        if (isStale('folders')) {
          promises.push(
            getFolders().then(data => {
              setFolders(data);
              setLastFetched('folders');
            })
          );
        }
        if (isStale('tags')) {
          promises.push(
            getTags().then(data => {
              setTags(data);
              setLastFetched('tags');
            })
          );
        }
        await Promise.all(promises);
      } catch {}
    };

    init();
  }, [isAuthenticated]);
};
