import React, { useEffect, useMemo, useState } from 'react';
import { getProjects } from '../../services/api';
import ProjectList from '../ProjectList/ProjectList';
import styles from './MainContent.module.css';

const MainContent = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjects();
        console.log("API response for /projects:", data);
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError(err.message || 'Could not load projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []); 

  const { activeProjects, passedProjects } = useMemo(() => {
    console.log('Filtering projects...'); 

    const now = new Date(); 
    const active = [];
    const passed = [];

    projects.forEach(project => {
      if (project.deadline) {
        try {
          const deadlineDate = new Date(project.deadline);

          if (!isNaN(deadlineDate.getTime()) && deadlineDate < now) {
            passed.push(project);
          } else {

            active.push(project);
          }
        } catch (e) {
          console.warn(`Error parsing deadline for project ${project.id}: ${project.deadline}. Treating as active.`);
          active.push(project);
        }
      } else {
        active.push(project);
      }
    });

    return { activeProjects: active, passedProjects: passed };

  }, [projects]); 

  if (isLoading) {
    return <div className={styles.loadingMessage}>Loading projects...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>Error: {error}</div>;
  }

  return (
    <div className={styles.mainContent}>
      <ProjectList title="Active projects" projects={activeProjects} />
      <ProjectList title="Passed projects" projects={passedProjects} />
    </div>
  );
};

export default MainContent;