import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from '../Header/Header';
import MainContent from '../MainContent/MainContent';
import ProjectCreatePage from '../ProjectCreatePage/ProjectCreatePage';
import ProjectDetailPage from '../ProjectDetailPage/ProjectDetailPage';
import ProjectEditPage from '../ProjectEditPage/ProjectEditPage';
import Sidebar from '../Sidebar/Sidebar';
import VacancyCreatePage from '../VacancyCreatePage/VacancyCreatePage';
import VacancyEditPage from '../VacancyEditPage/VacancyEditPage';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.contentWrapper}>
        <Sidebar />
        <main className={styles.mainContentArea}>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/projects/new" element={<ProjectCreatePage />} />
            <Route path="/projects/:projectId/edit" element={<ProjectEditPage />} />
            <Route path="/projects/:projectId/vacancies/new" element={<VacancyCreatePage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route
              path="/projects/:projectId/vacancies/:vacancyId/edit"
              element={<VacancyEditPage />}
            />

            <Route path="*" element={<div>Страница не найдена (404)</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;



