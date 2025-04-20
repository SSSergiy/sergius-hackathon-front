import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditableProject } from '../../hooks/useEditableProject';
import { useProjectDeletion } from '../../hooks/useProjectDeletion';

import { getVacanciesForProject } from '../../services/api';


import Button from '../Button/Button';
import VacancyCard from '../VacancyCard/VacancyCard';
import styles from './ProjectDetailPage.module.css';

const ProjectDetailPage = () => {

  const { projectId } = useParams();
  const navigate = useNavigate();

  const handleNavigateToVacancyEdit = (vacancyId, formattedDeadline) => {
    console.log(`Navigating to edit vacancy: ${vacancyId} for project ${projectId}`);
    navigate(`/projects/${projectId}/vacancies/${vacancyId}/edit`, {
      state: { formattedDeadline }
    });
  };


  const {
    editableProject,
    handleChange,
    isLoading,
    error,
    isSaving,
    saveError,
    lastSavedStatus
  } = useEditableProject(projectId);

  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [vacanciesError, setVacanciesError] = useState(null);

  useEffect(() => {
    const fetchVacancies = async () => {
      if (!projectId) return;
      setVacanciesLoading(true);
      setVacanciesError(null);
      try {
        const data = await getVacanciesForProject(projectId);
        setVacancies(Array.isArray(data) ? data : []); 
      } catch (err) {
        setVacanciesError(err.message || "Failed to load vacancies.");
      } finally {
        setVacanciesLoading(false);
      }
    };

    fetchVacancies();
  }, [projectId]); 

  const {
    isDeleting,
    deleteError,
    handleDelete
  } = useProjectDeletion(projectId);

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading project details...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>Error loading project: {error}</div>;
  }

  if (!editableProject) {
    return <div className={styles.notFoundMessage}>Project not found or could not be loaded.</div>;
  }


  return (
    <div className={styles.mainContent}>
      <div className={styles.wrapBtnTitle}>
        <h2 className={styles.title}>{editableProject.name}</h2>
        <Button
          className={styles.deleteButton}
          onClick={() => editableProject && handleDelete(editableProject.name)}
          disabled={isDeleting || isSaving || !editableProject}
        >
          {isDeleting ? 'Deleting...' : 'Delete project'}
        </Button>
      </div>
      {deleteError && <p className={styles.errorMessage}>Deletion Error: {deleteError}</p>}
      {saveError && <p className={styles.errorMessage}>Save Error: {saveError}</p>}
      {isSaving && <p className={styles.savingMessage}>Saving...</p>}
      {!isSaving && lastSavedStatus && <p className={styles.savedMessage}>{lastSavedStatus}</p>}


      <div className={styles.editFormContainer}>
        <div className={styles.selectWrap}>
          <div className={styles.selectWrapper}>
            <label htmlFor="projectField" 
            className={styles.formLabel}>Field</label>
            <select
              id="projectField"
              name="field"
              className={styles.formInput}
              value={editableProject?.field || ''}
              onChange={handleChange}
              disabled={isSaving || isDeleting}
            >
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
          <div>
            <label htmlFor="projectExperience" className={styles.formLabel}>Experience</label>
            <input type="text" id="projectExperience" name="experience" className={styles.formInput}
              value={editableProject?.experience || ''} onChange={handleChange} disabled={isSaving || isDeleting} />
          </div>
          <div>
            <label htmlFor="projectDeadline" className={styles.formLabel}>Deadline</label>
            <input type="date" id="projectDeadline" name="deadline" className={styles.formInput}
              value={editableProject?.deadline || ''}
              onChange={handleChange} />
          </div>
        </div>
        <div className={styles.formFullwidth}>
          <label htmlFor="projectDescription" className={styles.formLabel}>Description</label>
          <textarea id="projectDescription" name="description" className={styles.formTextarea} rows={5}
            value={editableProject?.description || ''} onChange={handleChange} disabled={isSaving || isDeleting}></textarea>
        </div>

        <Button
          type="button"
          className={styles.addVacancyButton}
          onClick={() => navigate(`/projects/${projectId}/vacancies/new`)}
          disabled={isDeleting || isSaving}
        >
          Add vacancy
        </Button>
        <div className={styles.vacanciesListSection}>
          {vacancies &&
            <h3 className={styles.sectionTitle}>Hired people</h3>
          }

          {vacanciesLoading && <p>Loading vacancies...</p>}
          {vacanciesError && <p className={styles.errorMessage}>Error: {vacanciesError}</p>}

          {!vacanciesLoading && !vacanciesError && (
            vacancies.length === 0 ? (
              <p>No vacancies found for this project.</p>
            ) : (
              <ul className={styles.vacanciesList}>
                {vacancies.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    onClick={() => handleNavigateToVacancyEdit(vacancy.id, editableProject?.deadline)}
                    onDelete={() => handleDeleteVacancy(vacancy.id)}
                    formattedDeadline={editableProject?.deadline}
                  />
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
