import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore"; 
import { db } from "./config"

const addUser = async (uid, name)=>{
    console.log("addUser");
    
    const userDocRef = doc(db, "Users", uid);
    
    try {
          await setDoc(userDocRef, {
          name: name,
          height: null,
          weight: null,
          birthday: null,
          gender: null,
          total_exercise_day: 0,
          total_calories: 0,
          last_exercise_day: null,
          pushup:{
            set: 0,
            rep: 0
          },
          situp:{
            set: 0,
            rep: 0
          },
          squat:{
            set: 0,
            rep: 0
          },
          dumbbell:{
            set: 0,
            rep: 0
          }

        });
        console.log("Document written with ID: ", userDocRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}

const getUser = async (uid) => {
    console.log("getUser");
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        console.log("No such document!");
        return null;
    }
}

const editInfo = async (uid, info) => {
  try {
    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, info);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
}

const addExcercise = async ()=> {
  // BLE control
}

const editExercise = async ()=>{
  // user edit
}

const uploadExercise = async () => {
  // upload button, merge the calories
}


export { addUser, getUser, editInfo, addExcercise, editExercise, uploadExercise }