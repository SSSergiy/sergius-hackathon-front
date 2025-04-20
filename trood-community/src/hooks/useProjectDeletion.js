import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../services/api';

export function useProjectDeletion(projectId) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = useCallback(async (projectName = `Project ID ${projectId}`) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(projectId);
      console.log('Project deleted successfully');
      navigate('/'); 
    } catch (err) {
      console.error('Deletion error:', err);
      setDeleteError(err.message || 'Failed to delete the project.');
    } finally {
      setIsDeleting(false);
    }
  }, [projectId, navigate]); 

  return {
    isDeleting,
    deleteError,
    handleDelete,
  };
}