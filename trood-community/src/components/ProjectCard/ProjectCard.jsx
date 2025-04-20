import React from 'react';
import { Link } from 'react-router-dom';
import FiBell from './FiBell';
import FiMessageSquare from './FiMessageSquare';
import FiUser from './FiUser';
import styles from './ProjectCard.module.css';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    return dateString;
  }
};


const ProjectCard = ({ project,isActive }) => {
  if (!project || typeof project.id === 'undefined') {
    console.error("ProjectCard received invalid project data:", project);
    return <div className={styles.cardError}>Invalid project data</div>;
  }

  const hasNotification = false;

  return (
    <Link to={`/projects/${project.id}`} className={styles.cardLink}>
      <div className={styles.card}>

        {isActive
        }
        <h3 className={styles.title}>
          {project.name || 'Unnamed Project'}
        </h3>
        { isActive &&<p className={styles.description}>
          {project.description || 'No description provided.'}
        </p>}
        {isActive &&<div className={styles.details}>
          <p>
            <strong>Experience:</strong> {project.experience || 'Not specified'}
          </p>
          <p>
            <strong>Deadline:</strong> {formatDate(project.deadline)}
          </p>
        </div>}

        <div className={styles.footer}>
          <div className={styles.userPlaceholder}>
            <FiUser/>
          Anna Lenram
          </div>
          <div className={styles.icons}>
            <FiMessageSquare className={styles.icon} />
            <div className={styles.bellContainer}>
              <FiBell className={styles.icon} />
              {hasNotification && <div className={styles.notificationDot}></div>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
