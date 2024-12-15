'use server'
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore"; 
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
        let last_exercise_day = data.last_exercise_day;
        if (last_exercise_day) {
          last_exercise_day = convertTimestamp(data.last_exercise_day);
        }
        const res = {...data, last_exercise_day, info: {...data.info, birthday}};
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

const addExcercise = async ({req:{uid, type, reps}})=> {
  // BLE control
  try{
    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, {
      [`exercises.${type}.reps`]: increment(reps),
      [`exercises.${type}.sets`]: increment(1),
    })
    return { success: true };
  } catch(e){
    console.error('Error add exercise:', error);
    return { success: false, error };
  }

}

const editExercise = async ({req:{uid, exercises}})=>{
  // user edit
  console.log("editExercise");
  try{
    const userRef = doc(db, 'Users', uid);
    await updateDoc(userRef, {
      exercises: exercises,
    })
    return { success: true };
  } catch(e){
    console.error('Error edit exercise:', error);
    return { success: false, error };
  }
}

const uploadExercise = async ({req:{uid, calories}}) => {
  console.log(calories);
  if (calories <= 0) {
    return { success: false, error: "No new fitness record" };
  }
  console.log(calories);
  // upload button, merge the calories
  console.log("uploadExercise");
  const userRef = doc(db, 'Users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    let last_exercise_day  = docSnap.data().last_exercise_day;
    if (last_exercise_day) {
      const firestoreTimestamp = new Timestamp(last_exercise_day.seconds, last_exercise_day.nanoseconds);
      last_exercise_day = firestoreTimestamp.toDate();
    }
    console.log(last_exercise_day);
    const today = new Date();
    if (isSameDay(today, last_exercise_day)) {
      console.log("Today is the last exercise day");
      await updateDoc(userRef, {
        total_calories: increment(calories),
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
        }
      });
      
    } else {
      console.log("Today is not the last exercise day");
      await updateDoc(userRef, {
        total_exercise_day: increment(1),
        total_calories: increment(calories),
        last_exercise_day: today,
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
        }
      });
    }
    return { success: true };
  } else{
    console.log("No user data");
    return { success: false, error: "No user data" };
  }
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
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export { addUser, getUser, editInfo, addExcercise, editExercise, uploadExercise }