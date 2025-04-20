import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createVacancy } from '../../services/api';
import Button from '../Button/Button';
import styles from './VacancyCreatePage.module.css';

const VacancyCreatePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', field: '', experience: '', country: '', description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!projectId) {
      setError("Project ID is missing from URL."); 
      setIsSaving(false);
      return;
    }

    try {
      const newVacancy = await createVacancy(projectId, formData);
      console.log("Vacancy created:", newVacancy);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.message || "Could not create vacancy.");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className={styles.pageContainer}>
        <form onSubmit={handleSubmit} className={styles.vacancyCreateForm}>
           <h4 className={styles.vacancyFormTitle}>Create vacancy</h4> 
          <div className={styles.wrapBg}> 
            <div className={styles.vacancyFormGrid}>
              {/* Name */}
              <div className={styles.formGroup}>
                <label htmlFor={`vacancyName-${projectId}`}>Name</label>
                <input type="text" id={`vacancyName-${projectId}`} name="name" required value={formData.name} onChange={handleChange} disabled={isSaving}/>
              </div>
              {/* Field */}
              <div className={styles.formGroup}>
                <label htmlFor={`vacancyField-${projectId}`}>Field</label>
                <select id={`vacancyField-${projectId}`} name="field" required value={formData.field} onChange={handleChange} disabled={isSaving}>
                    <option value="">Select...</option>
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Marketing">Marketing</option>
                </select>
              </div>
              {/* Experience */}
              <div className={styles.formGroup}>
                <label htmlFor={`vacancyExperience-${projectId}`}>Experience</label>
                <input type="text" id={`vacancyExperience-${projectId}`} name="experience" required value={formData.experience} onChange={handleChange} disabled={isSaving}/>
              </div>
              {/* Country */}
              <div className={styles.formGroup}>
                <label htmlFor={`vacancyCountry-${projectId}`}>Country</label>
                <input type="text" id={`vacancyCountry-${projectId}`} name="country" required value={formData.country} onChange={handleChange} disabled={isSaving}/>
              </div>
               {/* Description */}
              <div className={styles.formGroupFull}>
                <label htmlFor={`vacancyDescription-${projectId}`}>Description</label>
                <textarea id={`vacancyDescription-${projectId}`} name="description" required rows={4} value={formData.description} onChange={handleChange} disabled={isSaving}></textarea>
              </div>
            </div>
            <div className={styles.vacancyFormActions}>
              <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Create vacancy'}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
};

export default VacancyCreatePage;





