import React, { useState } from 'react';
import styles from './Sidebar.module.css';

const SidebarItem = ({ label, active, onClick }) => (
  <div
    className={`${styles.sidebarItem} ${active ? styles.active : ''}`}
    onClick={onClick}
  >
    {label}
  </div>
);

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('Projects');

  const menuItems = ['Main page', 'Projects', 'Vacancies', 'People', 'Tests', 'Settings'];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navigation}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item}
            label={item}
            active={activeItem === item}
            onClick={() => setActiveItem(item)}
          />
        ))}
      </nav>
      <div className={styles.logout}>
        Log out
      </div>
    </aside>
  );
};

export default Sidebar;