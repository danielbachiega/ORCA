import axios from 'axios';

const CATALOG_API_BASE_URL = import.meta.env.VITE_CATALOG_API_BASE_URL ?? 'http://localhost:5001/api';
const FORMS_API_BASE_URL = import.meta.env.VITE_FORMS_API_BASE_URL ?? 'http://localhost:5003/api';

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Erro na requisição:', error);
      return Promise.reject(error);
    }
  );
  return client;
}

export const catalogClient = createClient(CATALOG_API_BASE_URL);
export const formsClient = createClient(FORMS_API_BASE_URL);