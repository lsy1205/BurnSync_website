import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

import { Client } from "@gradio/client";

export async function POST(req, res) {
    try{
        console.log("POST /api/inference");
        
        const client = await Client.connect("AIOT12345/IMU_CLASSIFY");
        const data = await req.json();
        
        // console.log(data);
        
        const result = await client.predict("/predict", { 
            data: data, 
        });
        console.log(result.data);
        
        return NextResponse.json({ success: true, result: result.data });
    } catch(e){
        console.error(e);
        return NextResponse.json({ error: e });
    }
} 						