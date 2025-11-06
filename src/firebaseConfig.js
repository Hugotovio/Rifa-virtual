// Importa las funciones que necesitas del SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA7uT_mh2kld7W5pL__S5bdoVRXZ-jCiSM",
  authDomain: "rifa-amigos.firebaseapp.com",
  projectId: "rifa-amigos",
  storageBucket: "rifa-amigos.firebasestorage.app",
  messagingSenderId: "315550294987",
  appId: "1:315550294987:web:21c00f3f9d32ecd3cc4c4e"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la base de datos Firestore para usarla en el proyecto
export const db = getFirestore(app);

