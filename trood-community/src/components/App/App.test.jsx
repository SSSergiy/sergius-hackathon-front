
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('../Header/Header', () => ({ default: () => <header data-testid="header">Header Mock</header> }));
vi.mock('../Sidebar/Sidebar', () => ({ default: () => <aside data-testid="sidebar">Sidebar Mock</aside> }));
vi.mock('../MainContent/MainContent', () => ({ default: () => <div data-testid="main-content">Main Content Mock</div> }));
vi.mock('../ProjectCreatePage/ProjectCreatePage', () => ({ default: () => <div data-testid="project-create-page">Project Create Mock</div> }));
vi.mock('../ProjectDetailPage/ProjectDetailPage', () => ({ default: () => <div data-testid="project-detail-page">Project Detail Mock</div> }));
vi.mock('../ProjectEditPage/ProjectEditPage', () => ({ default: () => <div data-testid="project-edit-page">Project Edit Mock</div> }));
vi.mock('../VacancyCreatePage/VacancyCreatePage', () => ({ default: () => <div data-testid="vacancy-create-page">Vacancy Create Mock</div> }));
vi.mock('../VacancyEditPage/VacancyEditPage', () => ({ default: () => <div data-testid="vacancy-edit-page">Vacancy Edit Mock</div> }));


describe('App Component Routing', () => {

	const renderApp = (initialRoute = '/') => {
		return render(
			<MemoryRouter initialEntries={[initialRoute]}>
				<App />
			</MemoryRouter>
		);
	};

	it('should render Header and Sidebar always', () => {
		renderApp();
		expect(screen.getByTestId('header')).toBeInTheDocument();
		expect(screen.getByTestId('sidebar')).toBeInTheDocument();
	});

	it('should render MainContent on "/" route', () => {
		renderApp('/');
		expect(screen.getByTestId('main-content')).toBeInTheDocument();
	});

	it('should render ProjectCreatePage on "/projects/new" route', () => {
		renderApp('/projects/new');
		expect(screen.getByTestId('project-create-page')).toBeInTheDocument();
	});

	it('should render ProjectDetailPage on "/projects/:projectId" route', () => {
		renderApp('/projects/proj123');
		expect(screen.getByTestId('project-detail-page')).toBeInTheDocument();
	});

	it('should render ProjectEditPage on "/projects/:projectId/edit" route', () => {
		renderApp('/projects/proj123/edit');
		expect(screen.getByTestId('project-edit-page')).toBeInTheDocument();
	});

	it('should render VacancyCreatePage on "/projects/:projectId/vacancies/new" route', () => {
		renderApp('/projects/proj123/vacancies/new');
		expect(screen.getByTestId('vacancy-create-page')).toBeInTheDocument();
	});

	it('should render VacancyEditPage on "/projects/:projectId/vacancies/:vacancyId/edit" route', () => {
		renderApp('/projects/proj123/vacancies/vac456/edit');
		expect(screen.getByTestId('vacancy-edit-page')).toBeInTheDocument();
	});

	it('should render 404 page for unknown routes', () => {
		renderApp('/some/random/path');
		expect(screen.getByText(/Страница не найдена \(404\)/i)).toBeInTheDocument();
		expect(screen.queryByTestId('main-content')).not.toBeInTheDocument();
	});

});