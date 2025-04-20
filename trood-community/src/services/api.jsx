
// const BASE_URL = 'http://localhost:8080';
const hostname = window.location.hostname;

const BASE_URL =
  hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'http://65.108.87.81:8080';


async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.body && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  console.log(`API Request: ${config.method || 'GET'} ${url}`);
  if (config.body) {
    console.log('Request Body:', config.body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      console.log(`API Response ${response.status}: No Content`);
      return null;
    }

    let data;
    try {
      data = await response.clone().json();
      console.log(`API Response ${response.status}:`, data);
    } catch (error) {
      const textResponse = await response.text();
      console.error(`API Response ${response.status} is not valid JSON or empty:`, textResponse);
      if (!response.ok) {
        throw new Error(textResponse || `Request failed with status ${response.status}`);
      }
      return textResponse;
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.detail || `API Error: ${response.status} ${response.statusText}`;
      console.error(`API Error ${response.status}: ${errorMessage}`, data);
      throw new Error(errorMessage);
    }

    return data;

  } catch (error) {
    console.error('API Request Failed:', error.message);
    throw new Error(error.message || 'Network error or API is unreachable');
  }
}


export const getProjects = () => request('/projects');

export const createProject = (projectData) => request('/projects', {
  method: 'POST',
  body: JSON.stringify(projectData),
});

export const getProjectById = (id) => request(`/projects/${id}`);

export const updateProject = (id, projectData) => request(`/projects/${id}`, {
  method: 'PUT',
  body: JSON.stringify(projectData),
});

export const deleteProject = (id) => request(`/projects/${id}`, {
  method: 'DELETE',
});

export const getVacanciesForProject = (projectId) => request(`/projects/${projectId}/vacancies`);

export const getVacancyById = (vacancyId) => request(`/vacancies/${vacancyId}`);

export const createVacancy = (projectId, vacancyData) => request(`/projects/${projectId}/vacancies`, {
  method: 'POST',
  body: JSON.stringify(vacancyData),
});

export const updateVacancy = (vacancyId, vacancyData) => {
  if (!vacancyId) {
      console.error("updateVacancy Error: vacancyId is missing or invalid", vacancyId);
      return Promise.reject(new Error("Invalid Vacancy ID provided to updateVacancy."));
  }
  const endpoint = `/vacancies/${vacancyId}`;
  console.log(`Constructed PUT endpoint: ${endpoint}`);

  return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(vacancyData), 
  });
};

export const deleteVacancy = (vacancyId) => { 
  if (!vacancyId) {
      console.error("deleteVacancy Error: vacancyId is missing or invalid", vacancyId);
      return Promise.reject(new Error("Invalid Vacancy ID provided to deleteVacancy."));
  }
  const endpoint = `/vacancies/${vacancyId}`;
  console.log(`Constructed DELETE endpoint: ${endpoint}`);
  return request(endpoint, { method: 'DELETE' });
};
