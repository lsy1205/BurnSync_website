'use server'
const { GoogleGenerativeAI } = require("@google/generative-ai");

const getSuggestion = async (target, height, weight, age, gender) => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    console.log("target: ", target);
    console.log("height: ", height);
    console.log("weight: ", weight);
    console.log("age: ", age);
    console.log("gender", gender);
    const prompt = `Based on the following details:
- approximate calories burned: ${target}
- age: ${age}
- gender: ${gender}
- height: ${height} cm
- weight: ${weight} kg
please answer in the format below to  effectively achieve the approximate calories burned

Push-ups:  ___ sets, ___ repetitions
Sit-ups: ___ sets, ___ repetitions
Squats: ___ sets, ___ repetitions
Dumbbell: ___ sets, ___ repetitions`;

    // console.log("prompt: ", prompt);
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return result.response.text();
}


export { getSuggestion };