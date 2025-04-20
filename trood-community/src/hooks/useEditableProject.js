import { useCallback, useEffect, useRef, useState } from 'react';
import { getProjectById, updateProject } from '../services/api';

export function useEditableProject(projectId) {
  const [project, setProject] = useState(null); 
  const [editableProject, setEditableProject] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [isSaving, setIsSaving] = useState(false); 
  const [saveError, setSaveError] = useState(null); 
  const [lastSavedStatus, setLastSavedStatus] = useState(''); 
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true; 
    const fetchProject = async () => {
      if (!projectId) {
        if (isMounted) { 
          setIsLoading(false);
          setError("Project ID not provided.");
        }
        return;
      }
      if (isMounted) {
        setIsLoading(true);
        setError(null);
        setSaveError(null);
        setLastSavedStatus('');
      }

      try {
        console.log(`[useEditableProject useEffect] Fetching project ID: ${projectId}`);
        const data = await getProjectById(projectId);
        console.log(`[useEditableProject useEffect] Fetched data for ID ${projectId}:`, data);

        if (isMounted) {
          setProject(data); 

          const initialEditableData = {
            ...data,
            deadline: data?.deadline || '',
          };
          console.log('[useEditableProject useEffect] Prepared initialEditableData:', initialEditableData);
          setEditableProject(initialEditableData); 
        }
      } catch (err) {
        console.error(`[useEditableProject useEffect] Error fetching project ID ${projectId}:`, err);
        if (isMounted) setError(err.message || 'Failed to load project details.');
      } finally {
        if (isMounted) {
          setIsLoading(false); 
        }
      }
    };

    fetchProject();

    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [projectId]); 


  const saveChanges = useCallback(async (dataToSave) => {
    if (!projectId || !dataToSave || isLoading) return;

    console.log('[useEditableProject saveChanges] Attempting to save project ID:', projectId, dataToSave);
    setIsSaving(true); setSaveError(null); setLastSavedStatus('');

    const { field, ...apiData } = dataToSave;

    try {
      const updatedProjectData = await updateProject(projectId, apiData);
      console.log('[useEditableProject saveChanges] Project auto-saved successfully:', updatedProjectData);

      setProject(updatedProjectData);
      const updatedEditableData = {
        ...updatedProjectData,
        deadline: updatedProjectData?.deadline || '',
      };
      console.log('[useEditableProject saveChanges] Updating editable state after save:', updatedEditableData);
      setEditableProject(updatedEditableData); 
      setLastSavedStatus(`Saved at ${new Date().toLocaleTimeString()}`);

    } catch (err) {
      console.error('[useEditableProject saveChanges] Auto-save error:', err);
      setSaveError(err.message || 'Failed to auto-save changes.');
      setLastSavedStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, isLoading]); 
  const handleChange = useCallback((e) => {
    if (isLoading) return;

    const { name, value } = e.target;
    setEditableProject(prev => {
      if (!prev) return null; 
      const updated = { ...prev, [name]: value };
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        saveChanges(updated); 
      }, 1500); 

      return updated; 
    });
    if (!isSaving) {
      setSaveError(null);
      setLastSavedStatus('');
    }
  }, [saveChanges, isLoading, isSaving]);
  return {
    project, 
    editableProject,
    isLoading,
    error,
    isSaving,
    saveError,
    lastSavedStatus,
    handleChange,
    setEditableProject 
  };
}