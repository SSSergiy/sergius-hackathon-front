import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteVacancy, getVacancyById, updateVacancy } from '../../services/api';
import Button from '../Button/Button';
import styles from './VacancyEditPage.module.css';

const API_EXPECTED_FIELDS = ['name', 'field', 'experience', 'country', 'description'];

const VacancyEditPage = () => {
  const { state } = useLocation();
  const { formattedDeadline: deadlineFromState } = state || {};

  const displayDeadline = (deadlineFromState ?? '').replace(/-/g, '.');

  const { projectId, vacancyId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    field: '',
    experience: '',
    country: '',
    description: '',
  });
  const [displayDeadlineState, setDisplayDeadlineState] = useState(displayDeadline);

  const [originalVacancy, setOriginalVacancy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedStatus, setLastSavedStatus] = useState('');
  const debounceTimeoutRef = useRef(null);
  const lastSavedTimerRef = useRef(null);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchVacancy = async () => {
      if (!vacancyId) {
        console.error("Vacancy ID is missing in URL params.");
        setError("Vacancy ID not found in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSaveError(null);
      setLastSavedStatus('');

      try {
        console.log(`[VacancyEditPage fetchVacancy] Fetching vacancy ID: ${vacancyId}`);
        const data = await getVacancyById(vacancyId);
        console.log(`[VacancyEditPage fetchVacancy] Fetched data:`, data);

        const initialFormData = {};
        API_EXPECTED_FIELDS.forEach(field => {
          if (data && data.hasOwnProperty(field)) {
            initialFormData[field] = data[field] || '';
          } else {
            initialFormData[field] = '';
          }
        });
        console.log(`[VacancyEditPage fetchVacancy] Prepared initial form data:`, initialFormData);

        setFormData(initialFormData);
        setOriginalVacancy(data);

        const deadlineToDisplay = (deadlineFromState ?? data?.deadline ?? '').replace(/-/g, '.');
        console.log(`[VacancyEditPage fetchVacancy] Setting display deadline to:`, deadlineToDisplay);
        setDisplayDeadlineState(deadlineToDisplay || ''); // Устанавливаем состояние дедлайна


      } catch (err) {
        console.error('[VacancyEditPage fetchVacancy] Error fetching vacancy:', err);
        setError(err.message || "Failed to load vacancy details.");
        setFormData({ name: '', field: '', experience: '', country: '', description: '' });
        setOriginalVacancy(null);
        setDisplayDeadlineState('');

      } finally {
        setIsLoading(false);
        console.log(`[VacancyEditPage fetchVacancy] Fetch finished. isLoading: false`);
      }
    };

    fetchVacancy();

    return () => {
      console.log("[VacancyEditPage cleanup] Clearing timers.");
      if (debounceTimeoutRef.current) { clearTimeout(debounceTimeoutRef.current); }
      if (lastSavedTimerRef.current) { clearTimeout(lastSavedTimerRef.current); }
    };
  }, [vacancyId, deadlineFromState]);


  const saveChanges = useCallback(async (dataToSave) => {
    if (!vacancyId || isLoading || isSaving) return;
    if (lastSavedTimerRef.current) { clearTimeout(lastSavedTimerRef.current); }

    console.log('[VacancyEditPage saveChanges] Data from form state:', dataToSave);
    setIsSaving(true); setSaveError(null); setLastSavedStatus('');

    const dataForApi = {};
    API_EXPECTED_FIELDS.forEach(field => {
      if (dataToSave.hasOwnProperty(field)) {
        dataForApi[field] = dataToSave[field];
      }
    });
    console.log('[VacancyEditPage saveChanges] Attempting to save (filtered data):', vacancyId, dataForApi);


    try {
      await updateVacancy(vacancyId, dataForApi);
      console.log('[VacancyEditPage saveChanges] Successfully saved.');
      setLastSavedStatus(`Saved at ${new Date().toLocaleTimeString()}`);
      setOriginalVacancy(prev => ({ ...prev, ...dataForApi }));
      lastSavedTimerRef.current = setTimeout(() => setLastSavedStatus(''), 2000);
    } catch (err) {
      console.error('[VacancyEditPage saveChanges] Save error:', err);
      setSaveError(err.message || "Could not save changes.");
      setLastSavedStatus('');
    } finally {
      setIsSaving(false);
    }
  }, [vacancyId, isLoading, isSaving]);

  const handleChange = useCallback((e) => {
    if (isLoading) return;
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (debounceTimeoutRef.current) { clearTimeout(debounceTimeoutRef.current); }
      if (lastSavedTimerRef.current) { clearTimeout(lastSavedTimerRef.current); }
      setLastSavedStatus('');

      debounceTimeoutRef.current = setTimeout(() => {
        saveChanges(updated);
      }, 1500);

      return updated;
    });
    setSaveError(null);
  }, [isLoading, saveChanges]);

  const handleDelete = useCallback(async () => {
    if (debounceTimeoutRef.current) { clearTimeout(debounceTimeoutRef.current); }
    if (isSaving || isDeleting) return;

    setIsDeleting(true); setError(null); setSaveError(null);
    try {
      await deleteVacancy(vacancyId);
      console.log("Vacancy deleted:", vacancyId);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.message || "Could not delete vacancy.");
      setIsDeleting(false);
    }

  }, [vacancyId, projectId, navigate, isSaving, isDeleting]);
  if (isLoading) {
    return <div className={styles.pageContainer}>Loading vacancy data...</div>;
  }
  if (error && !originalVacancy) {
    return <div className={styles.pageContainer} role="alert">Error: {error}</div>;
  }


  return (
    <div className={styles.pageContainer}>
      <div className={styles.wrapBtnTitle}>
        <h2 className={styles.title}>{formData.field}</h2>
        <div className={styles.saveStatus}>
          {isSaving && <span>Saving...</span>}
          {saveError && <span style={{ color: 'red' }}>Error: {saveError}</span>}
          {!isSaving && !saveError && lastSavedStatus && <span style={{ color: 'green' }}>{lastSavedStatus}</span>}
        </div>
        <Button
          className={styles.deleteButton}
          onClick={handleDelete}
          disabled={isDeleting || isSaving}
        >
          {isDeleting ? 'Deleting...' : 'Delete Vacancy'}
        </Button>
      </div>

      {error && <p className={styles.errorMessage}>Error: {error}</p>}

      <div className={styles.vacancyEditForm}>
        <div className={styles.selectWrap}>

          <div className={styles.selectWrapper}>
            <label htmlFor="field" className={styles.formLabel}>Field</label>
            <select
              id="field"
              name="field"
              className={styles.formInput}
              value={formData.field}
              onChange={handleChange}
              disabled={isLoading || isSaving}
            >
              <option value="">Select Field...</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="experience" className={styles.formLabel}>Experience</label>
            <input
              type="text"
              id="experience"
              name="experience"
              className={styles.formInput}
              value={formData.experience}
              onChange={handleChange}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="displayDeadline" className={styles.formLabel}>Deadline</label>
            <input type="text"
              id="displayDeadline"
              name="displayDeadline"
              readOnly
              className={styles.formInput + ' ' + styles.readOnly}
              value={displayDeadlineState}
            />
          </div>
        </div>
        <div className={styles.formFullwidth}>
          <label htmlFor="description" className={styles.formLabel}>Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className={styles.formTextarea}
            value={formData.description}
            onChange={handleChange}
            disabled={isLoading || isSaving}
          ></textarea>
        </div>

      </div>
    </div>
  );
};

export default VacancyEditPage;
