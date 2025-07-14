import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(cors());
app.use(helmet());



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAaBj-Pp26ADZnn3zFyguBqY68GQO5AEMU",
//   authDomain: "fir-auth-ece96.firebaseapp.com",
//   projectId: "fir-auth-ece96",
//   storageBucket: "fir-auth-ece96.firebasestorage.app",
//   messagingSenderId: "536724440768",
//   appId: "1:536724440768:web:8911b91cd108d96b524f25",
//   measurementId: "G-HMHE3XMSDK"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);