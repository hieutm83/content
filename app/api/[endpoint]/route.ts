import { NextRequest,NextResponse } from "next/server";import { handleAnalytics } from "@/lib/api";
export const runtime="edge";
export async function GET(req:NextRequest,{params}:{params:Promise<{endpoint:string}>}){try{const {endpoint}=await params;return NextResponse.json(await handleAnalytics(endpoint,req.url,process.env))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Lỗi không xác định"},{status:500})}}
