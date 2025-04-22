import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectById, updateProject } from '../../services/api';
import { parseAndFormatDate_DDMMYYYY_to_YYYYMMDD } from '../../utils/dateUtils';
import Button from '../Button/Button';
import styles from './ProjectEditPage.module.css';

const ProjectEditPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    experience: '',
    deadline: '', 
    description: '',
  });

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) {
        setLoadingError("Project ID not found in URL.");
        setIsLoadingData(false);
        return;
      }
      setIsLoadingData(true);
      setLoadingError(null);
      setSaveError(null);
      try {
        console.log('[ProjectEditPage useEffect] Fetching data for ID:', projectId);
        const projectData = await getProjectById(projectId);
        console.log('[ProjectEditPage useEffect] Fetched projectData:', projectData);

        const rawDeadline = projectData?.deadline;
        console.log(`[ProjectEditPage useEffect] Raw deadline from API:`, rawDeadline);
        const formattedDeadlineForInput = parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(rawDeadline);
        console.log(`[ProjectEditPage useEffect] Formatted deadline:`, formattedDeadlineForInput);

        setFormData({
          name: projectData?.name || '',
          experience: projectData?.experience || '',
          deadline: formattedDeadlineForInput,
          description: projectData?.description || '',
        });

      } catch (err) {
        console.error('Error loading data for editing:', err);
        setLoadingError(err.message || 'Failed to load project data.');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchProjectData();
  }, [projectId]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    if (saveError) {
      setSaveError(null);
    }
  }, [saveError]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const projectDataToUpdate = {
      name: formData.name,
      description: formData.description,
      experience: formData.experience,
      deadline: formData.deadline,
    };

    console.log('Updating project data:', projectId, projectDataToUpdate);

    try {
      await updateProject(projectId, projectDataToUpdate);
      console.log('Project successfully updated');
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error updating project:', err);
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, formData, navigate]);


  if (isLoadingData) {
    return <div className={styles?.loadingMessage || ''}>loading data for editing...</div>;
  }

  if (loadingError && !formData.name) {
    return <div className={styles?.errorMessage || ''} role="alert">Loading Error: {loadingError}</div>;
  }

  return (
    <div className={styles?.mainContent || ''}>
      <h2 className={styles?.title || ''}>Edit Project: {formData.name || `ID ${projectId}`}</h2>
      {loadingError && formData.name && <p className={styles?.errorMessage || ''} role="alert">Loading Warning: {loadingError}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles?.formGrid || ''}>
          <div>
            <label htmlFor="projectName" className={styles?.formLabel || ''}>Name</label>
            <input
              type="text" id="projectName" name="name"
              className={styles?.formInput || ''} value={formData.name}
              onChange={handleChange} required
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="projectExperience" className={styles?.formLabel || ''}>Experience</label>
            <input
              type="text" id="projectExperience" name="experience"
              className={styles?.formInput || ''} value={formData.experience}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="projectDeadline" className={styles?.formLabel || ''}>Deadline</label>
            <input
              type="date" id="projectDeadline"
              name="deadline"
              className={styles?.formInput || ''}
              value={formData.deadline}
              onChange={handleChange} required
              disabled={isSaving}
            />
          </div>
          <div className={styles?.formFullwidth || ''}>
            <label htmlFor="projectDescription" className={styles?.formLabel || ''}>Description</label>
            <textarea
              id="projectDescription" name="description"
              className={styles?.formTextarea || ''} value={formData.description}
              onChange={handleChange} rows={5}
              disabled={isSaving}
            ></textarea>
          </div>
        </div>

        {saveError && <p className={styles?.errorMessage || ''} role="alert">Save Error: {saveError}</p>}

        <div className={styles?.formActions || ''}>
          <Button type="submit" disabled={isSaving || isLoadingData}> {/* Блокируем и при загрузке */}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className={styles?.cancelButton || ''}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEditPage;






// import React, { useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { getProjectById, updateProject } from '../../services/api';
// import { parseAndFormatDate_DDMMYYYY_to_YYYYMMDD } from '../../utils/dateUtils';
// import Button from '../Button/Button';
// import styles from './ProjectEditPage.module.css';

// const ProjectEditPage = () => {
//   const { projectId } = useParams();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     name: '',
//     experience: '',
//     deadline: '',
//     description: '',
//   });
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProjectData = async () => {
//       if (!projectId) return;
//       setIsLoadingData(true);
//       setError(null);
//       try {
//         console.log('[ProjectEditPage useEffect] Fetching data for ID:', projectId);
//         const projectData = await getProjectById(projectId);
//         console.log('[ProjectEditPage useEffect] Fetched projectData:', projectData);

//         const rawDeadline = projectData?.deadline;
//         console.log(`[ProjectEditPage useEffect] Raw deadline from API:`, rawDeadline, `(Type: ${typeof rawDeadline})`);

//         const formattedDeadlineForInput = parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(rawDeadline);
//         console.log(`[ProjectEditPage useEffect] Formatted deadline (YYYY-MM-DD):`, formattedDeadlineForInput, `(Type: ${typeof formattedDeadlineForInput})`);

//         const dataToSet = {
//           name: projectData?.name || '',
//           experience: projectData?.experience || '',
//           deadline: formattedDeadlineForInput,
//           description: projectData?.description || '',
//         };
//         console.log('[ProjectEditPage useEffect] Data prepared for setFormData:', dataToSet);

//         setFormData(dataToSet);

//       } catch (err) {
//         console.error('Error loading data for editing:', err);
//         setError(err.message || 'Failed to load project data.');
//       } finally {
//         setIsLoadingData(false);
//       }
//     };
//     fetchProjectData();
//   }, [projectId]);

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setIsSaving(true);
//     setError(null);

//     const projectDataToUpdate = {
//       name: formData.name,
//       description: formData.description,
//       experience: formData.experience,
//       deadline: formData.deadline,
//     };


//     try {
//       await updateProject(projectId, projectDataToUpdate);
//       console.log('the project has been updated successfully');
//       navigate(`/projects/${projectId}`);
//     } catch (err) {
//       console.error('error updating project:', err);
//       setError(err.message || 'failed to save changes.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoadingData) {
//     return <div className={styles.loadingMessage}>loading data for editing...</div>;
//   }

//   if (error && !isSaving) {
//     return <div className={styles.errorMessage}>loading error: {error}</div>;
//   }

//   return (
//     <div className={styles.mainContent}>
//       <h2 className={styles.title}>Edit Project: {formData.name || ''}</h2>
//       <form onSubmit={handleSubmit}>
//         <div className={styles.formGrid}>
//           <div>
//             <label htmlFor="projectName" className={styles.formLabel}>Name</label>
//             <input
//               type="text" id="projectName" name="name"
//               className={styles.formInput} value={formData.name}
//               onChange={handleChange} required
//             />
//           </div>
//           <div>
//             <label htmlFor="projectExperience" className={styles.formLabel}>Experience</label>
//             <input
//               type="text" id="projectExperience" name="experience"
//               className={styles.formInput} value={formData.experience}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <label htmlFor="projectDeadline"
//               className={styles.formLabel}>Deadline</label>
//             <input
//               type="date" id="projectDeadline"
//               name="deadline"
//               className={styles.formInput}
//               value={formData.deadline}
//               onChange={handleChange} required
//             />
//           </div>
//           <div className={styles.formFullwidth}>
//             <label htmlFor="projectDescription" className={styles.formLabel}>Description</label>
//             <textarea
//               id="projectDescription" name="description"
//               className={styles.formTextarea} value={formData.description}
//               onChange={handleChange} rows={5}
//             ></textarea>
//           </div>
//         </div>

//         {error && isSaving && <p className={styles.errorMessage}>save error: {error}</p>}

//         <div className={styles.formActions}>
//           <Button type="submit" disabled={isSaving}>
//             {isSaving ? 'Saving...' : 'Save Changes'}
//           </Button>
//           <Button
//             type="button"
//             onClick={() => navigate(`/projects/${projectId}`)}
//             className={styles.cancelButton}
//             disabled={isSaving}
//           >
//             Cancel
//           </Button>
//         </div>

//       </form>
//     </div>
//   );
// };

// export default ProjectEditPage;