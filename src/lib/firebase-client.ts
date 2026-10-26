import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: "AIzaSyAz2gNxH5ItL-0Zp0OWoTqCwRrwsJq7-sw",
  authDomain: "choltihomedecor-a2db3.firebaseapp.com",
  projectId: "choltihomedecor-a2db3",
};

const app = getApps().length ? getApps()[0] : initializeApp(config);

export const adminClientAuth = getAuth(app);
