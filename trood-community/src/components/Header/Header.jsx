import React from 'react';
import FiBell from './FiBell';
import FiMessageSquare from './FiMessageSquare';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>TROOD COMMUNITY</div>
      <div className={styles.userSection}>
        <FiMessageSquare className={styles.icon} />
        <FiBell className={styles.icon} />
        <div className={styles.avatar}></div> 
        <span className={styles.userName}>Alex Smith</span>
      </div>
    </header>
  );
};

export default Header;