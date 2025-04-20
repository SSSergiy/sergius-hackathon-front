import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../services/api';
import Button from '../Button/Button';
import styles from './ProjectCreatePage.module.css';

const ProjectCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    field: '', 
    experience: '',
    deadline: '', 
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value, 
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); 
    setIsLoading(true);
    setError(null);

    const projectData = {
      name: formData.name,
      description: formData.description,
      experience: formData.experience,
      deadline: formData.deadline,
    };
    console.log('Отправка данных проекта:', projectData);

    try {
      const newProject = await createProject(projectData);
      console.log('Проект успешно создан:', newProject);
      navigate('/'); 
    } catch (err) {
      console.error('Ошибка при создании проекта:', err);
      setError(err.message || 'Не удалось создать проект. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.mainContent}>
      <h2 className={styles.title}>Creating project</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div>
            <label htmlFor="projectName" className={styles.formLabel}>Name</label>
            <input
              type="text"
              id="projectName" 
              name="name" 
              className={styles.formInput}
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className={styles.selectWrapper}>
            <label htmlFor="projectField" className={styles.formLabel}>Field</label>
            <select
              id="projectField"
              name="field"
              className={styles.formInput}
              value={formData.field} 
              onChange={handleChange} 
            >
              <option value="">Select a field</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
          <div>
            <label htmlFor="projectExperience" className={styles.formLabel}>Experience</label>
            <input
              type="text"
              id="projectExperience"
              name="experience" 
              className={styles.formInput}
              value={formData.experience} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label htmlFor="projectDeadline" className={styles.formLabel}>Deadline</label>
            <input
              type="date" 
              id="projectDeadline"
              name="deadline" 
              className={styles.formInput}
              value={formData.deadline} 
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formFullwidth}>
            <label htmlFor="projectDescription" className={styles.formLabel}>Description</label>
            <textarea
              id="projectDescription"
              name="description" 
              className={styles.formTextarea}
              value={formData.description} 
              onChange={handleChange} 
              rows={5} 
            ></textarea>
          </div>
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create project'}
        </Button>
      </form>
    </div>
  );
};

export default ProjectCreatePage; 