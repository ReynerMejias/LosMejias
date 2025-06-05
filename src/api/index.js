import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.1.9:8000/api";

// Función para manejar login
export const loginUser = async (username, password) => {
  try {
    const credentials = btoa(
      unescape(encodeURIComponent(`${username}:${password}`))
    );

    const response = await fetch(`${API_URL}/`, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      console.error("Error de autenticación:", await response.text());
      return false;
    }

    await SecureStore.setItemAsync("username", username);
    await SecureStore.setItemAsync("password", password);
    return true;
  } catch (error) {
    console.error("Error en loginUser:", error);
    return false;
  }
};

// Función para obtener los encabezados de autenticación
const getAuthHeaders = async () => {
  const username = await SecureStore.getItemAsync("username");
  const password = await SecureStore.getItemAsync("password");

  if (!username || !password) {
    throw new Error("No se encontraron credenciales guardadas.");
  }

  const credentials = btoa(
    unescape(encodeURIComponent(`${username}:${password}`))
  );

  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
};

// Función genérica para hacer GET requests
const fetchData = async (endpoint) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) throw new Error(`Error al obtener ${endpoint}`);

    return await response.json();
  } catch (error) {
    console.error(`fetchData error (${endpoint}):`, error);
    throw error;
  }
};

export const getClientes = (lugarNombre) =>
  fetchData(`clientes/?lugar_nombre=${lugarNombre}&ordering=orden`);

export const getUsuario = async () => {
  const activeUser = await SecureStore.getItemAsync("activeUser");
  const username = await SecureStore.getItemAsync("username");

  if (activeUser) return JSON.parse(activeUser);

  data = await fetchData(`usuarios/?search=${username}`).then(
    (data) => data[0]
  );
  await SecureStore.setItemAsync("activeUser", JSON.stringify(data));
  return data;
};

export const getLugares = () => fetchData("lugares/");

export const getLugar = (id) => fetchData(`lugares/${id}/`);

export const getCliente = (id) => fetchData(`clientes/${id}/`);

// Función genérica para hacer POST/PATCH requests
const sendData = async (method, endpoint, data, isFormData = false) => {
  try {
    const headers = await getAuthHeaders();
    if (isFormData) delete headers["Content-Type"]; // FormData maneja su propio Content-Type

    const response = await fetch(`${API_URL}/${endpoint}`, {
      method,
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error(`${method} error en ${endpoint}:`, errorMsg);
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`${method} error en ${endpoint}:`, error);
    throw error;
  }
};

export const postLectura = (data) => sendData("POST", "lecturas/", data, true);

export const postSolicitud = (data) =>
  sendData("POST", "solicitudes/", data, true);

export const patchLectura = (id, data) =>
  sendData("PATCH", `lecturas/${id}/`, data, true);

export const patchUsuario = (id, data) =>
  sendData("PATCH", `usuarios/${id}/`, data);

export const patchCliente = (id, data) =>
  sendData("PATCH", `clientes/${id}/`, data, true);
