import React from 'react';
import styles from './VacancyCard.module.css';

const VacancyCard = ({  vacancy, onClick, onDelete, formattedDeadline   }) => {
  console.log(formattedDeadline)


  if (!vacancy) {
    return null;
  }

  const { id, name, field, experience, country, description } = vacancy;

  return (
    <li className={styles.vacancyCard} onClick={onClick}>
      <div className={styles.vacancyInfo}>
        <div className={styles.items}>
          <p className={styles.field}>{field}</p>
          <span>{name}</span>
        </div>
        <div className={styles.experience}>{experience}</div>
        <div className={styles.country}> {country}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </li>
  );
};

export default VacancyCard;