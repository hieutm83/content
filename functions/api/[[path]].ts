import { handleAnalytics } from "../../lib/api";
interface Env { LARK_APP_ID:string;LARK_APP_SECRET:string;LARK_APP_TOKEN:string;LARK_TABLE_ID:string;LARK_VIEW_ID:string }
export const onRequestGet:PagesFunction<Env>=async({request,env,params})=>{try{const raw=params.path;const path=Array.isArray(raw)?raw.join("/"):String(raw||"");return Response.json(await handleAnalytics(path,request.url,env))}catch(e){return Response.json({error:e instanceof Error?e.message:"Lỗi không xác định"},{status:500})}}
