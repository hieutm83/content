import dayjs from "dayjs";
import { z } from "zod";
import { getAllRecords } from "@/services/lark";
import { getAllVideoList,getDailyAnalytics,getFilterOptions,getKeywordAnalysis,getMonthlyAnalytics,getNewVideoList,getPeriodSummary,getSearchAnalysis,getSummary,getTopVideoGrowth,getTopVideos,getTopicAnalysis,getTrafficSources,getVideoListThroughDate,getViralVideoGrowth,getViralVideos,getWeeklyAnalytics } from "@/services/aggregator";

const querySchema=z.object({start:z.string().optional(),end:z.string().optional(),force:z.enum(["true","false"]).optional()});
export async function handleAnalytics(path:string,url:string,env:Record<string,string|undefined>){
 const q=querySchema.parse(Object.fromEntries(new URL(url).searchParams));
 const config={appId:env.LARK_APP_ID||"",appSecret:env.LARK_APP_SECRET||"",appToken:env.LARK_APP_TOKEN||"L89NbJwFAaTvCCsEVmajGVRHpJh",tableId:env.LARK_TABLE_ID||"tbl632K3PIw26pvv",viewId:env.LARK_VIEW_ID||"vew8E3SU2J"};
 if(!config.appId||!config.appSecret)throw new Error("Thiếu LARK_APP_ID hoặc LARK_APP_SECRET");
 const allRecords=await getAllRecords(config,q.force==="true");
 const start=q.start?dayjs(q.start).startOf("day"):null,end=q.end?dayjs(q.end).endOf("day"):null;
 const records=allRecords.filter(x=>(!start||!dayjs(x.recordCreatedTime).isBefore(start))&&(!end||!dayjs(x.recordCreatedTime).isAfter(end)));
 const percentChange=(current:number,previous:number)=>previous===0?(current===0?0:100):(current-previous)/previous*100;
 const summaryData=()=>{
  if(!q.start||!q.end)return getSummary(records);
  const current=getPeriodSummary(allRecords,q.start,q.end),days=dayjs(q.end).startOf("day").diff(dayjs(q.start).startOf("day"),"day")+1;
  const previousEnd=dayjs(q.start).subtract(1,"day").format("YYYY-MM-DD"),previousStart=dayjs(previousEnd).subtract(days-1,"day").format("YYYY-MM-DD"),previous=getPeriodSummary(allRecords,previousStart,previousEnd);
  return {...current,comparison:{totalVideos:percentChange(current.totalVideos,previous.totalVideos),newVideos:percentChange(current.newVideos,previous.newVideos),totalViews:percentChange(current.totalViews,previous.totalViews),totalLikes:percentChange(current.totalLikes,previous.totalLikes),totalShares:percentChange(current.totalShares,previous.totalShares),totalComments:percentChange(current.totalComments,previous.totalComments),engagementRate:percentChange(current.engagementRate,previous.engagementRate),averageFullWatchRate:percentChange(current.averageFullWatchRate,previous.averageFullWatchRate),newVideoViews:percentChange(current.newVideoViews,previous.newVideoViews),newVideoLikes:percentChange(current.newVideoLikes,previous.newVideoLikes),newVideoShares:percentChange(current.newVideoShares,previous.newVideoShares),newVideoComments:percentChange(current.newVideoComments,previous.newVideoComments),newVideoEngagementRate:percentChange(current.newVideoEngagementRate,previous.newVideoEngagementRate),newVideoFullWatchRate:percentChange(current.newVideoFullWatchRate,previous.newVideoFullWatchRate)}};
 };
 const routes:Record<string,()=>unknown>={summary:summaryData,"filter-options":()=>getFilterOptions(allRecords),daily:()=>getDailyAnalytics(allRecords,q.start,q.end),weekly:()=>getWeeklyAnalytics(allRecords,q.start,q.end),monthly:()=>getMonthlyAnalytics(allRecords,q.start,q.end),"all-videos":()=>q.end?getVideoListThroughDate(allRecords,q.end):getAllVideoList(allRecords),"new-videos":()=>q.start&&q.end?getNewVideoList(allRecords,q.start,q.end):[],"top-videos":()=>q.start&&q.end?getTopVideoGrowth(allRecords,q.start,q.end):getTopVideos(records),"traffic-sources":()=>getTrafficSources(records),keywords:()=>getKeywordAnalysis(records),topics:()=>getTopicAnalysis(records),"search-analysis":()=>getSearchAnalysis(records),"viral-videos":()=>q.start&&q.end?getViralVideoGrowth(allRecords,q.start,q.end):getViralVideos(records)};
 const fn=routes[path];if(!fn)throw new Error("API endpoint không tồn tại");
 const summary=getSummary(records);
 return{data:fn(),meta:{totalRecords:records.length,lastSync:summary.lastSync,cached:q.force!=="true"}};
}
