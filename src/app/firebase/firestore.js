'use server'
import { collection, addDoc, doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; 
import { db } from "./config"
import { Timestamp } from "firebase/firestore";

const addUser = async (uid, name)=>{
    console.log("addUser");
    
    const userDocRef = doc(db, "Users", uid);
    
    try {
          await setDoc(userDocRef, {
          name: name,
          info:{
            height: null,
            weight: null,
            birthday: null,
            gender: null,
          },
          exercises: {
            pushups:{
              sets: 0,
              reps: 0
            },
            situps:{
              sets: 0,
              reps: 0
            },
            squats:{
              sets: 0,
              reps: 0
            },
            dumbbells:{
              sets: 0,
              reps: 0
            }
          },
          total_exercise_day: 0,
          total_calories: 0,
          last_exercise_day: null,
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
        // console.log("Document data:", docSnap.data());
        const data = docSnap.data();
        const birthday = convertTimestamp(data.info.birthday);
        const res = {...data, info: {...data.info, birthday}};
        // console.log(res);
        return res;
    } else {
        console.log("No such document!");
        return null;
    }
}

const editInfo = async (uid, info) => {
  try {
    console.log("editInfo");
    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, {
      info: info,
    });
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

const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  
  // 創建 Timestamp 物件
  const firestoreTimestamp = new Timestamp(timestamp.seconds, timestamp.nanoseconds);
  
  // 轉換成 Date 物件
  const date = firestoreTimestamp.toDate();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;

  
  // 格式化日期
  // return date.toLocaleDateString();
};

export { addUser, getUser, editInfo, addExcercise, editExercise, uploadExercise }