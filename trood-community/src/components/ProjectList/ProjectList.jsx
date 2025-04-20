import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button/Button';
import ProjectCard from '../ProjectCard/ProjectCard';
import styles from './ProjectList.module.css';

const ProjectList = ({ title, projects }) => {
  const isActive = title === "Active projects";

  return (
    <section className={styles.projectListSection}>
      <div className={styles.wrapBtnTitle}>
        <h2 className={styles.title}>{title}</h2>
        {isActive && (
          <Link to="/projects/new" className={styles.createProjectLink}> 
            <Button>Create project</Button>
          </Link>
        )}
      </div>

      <div className={styles.cardsContainer}>
        {Array.isArray(projects) && projects.map((project) => (
          <ProjectCard key={project.id} project={project} isActive={isActive} />
        ))}
        {Array.isArray(projects) && projects.length === 0 && (
          <p className={styles.emptyListMessage}>No projects in this category.</p>
        )}
      </div>
    </section>
  );
};

export default ProjectList;