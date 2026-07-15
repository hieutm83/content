import dayjs from "dayjs";
import type { AnalyticsPoint,KeywordAnalytics,SummaryAnalytics,TikTokVideoRecord,TopicAnalytics,TrafficSourceAnalytics } from "@/types/lark";

const er=(engagement:number,views:number)=>views?engagement/views*100:0;
const sum=(records:TikTokVideoRecord[],key:"likes"|"shares"|"comments"|"videoViews"|"totalEngagement")=>records.reduce((total,record)=>total+record[key],0);
const normalizedRate=(value:number)=>value<=0?0:value<=1?value*100:value>100?value/100:value;
const averageFullWatchRate=(records:TikTokVideoRecord[])=>{const values=records.map(x=>normalizedRate(x.fullVideoWatchedRate)).filter(x=>Number.isFinite(x)&&x>=0);return values.length?values.reduce((a,x)=>a+x,0)/values.length:0};

/** year, mouth, day and week describe publish time, not snapshot time. */
export function getVideoPublishDate(record:TikTokVideoRecord):string|null{
 if(record.year>0&&record.month>=1&&record.month<=12&&record.day>=1&&record.day<=31){const value=dayjs(`${record.year}-${String(record.month).padStart(2,"0")}-${String(record.day).padStart(2,"0")}`);if(value.isValid())return value.format("YYYY-MM-DD")}
 return record.videoCreateTime&&dayjs(record.videoCreateTime).isValid()?dayjs(record.videoCreateTime).format("YYYY-MM-DD"):null;
}

/** Cumulative TikTok metrics must only use the newest snapshot per video. */
export function getLatestSnapshots(records:TikTokVideoRecord[]):TikTokVideoRecord[]{
 const latest=new Map<string,TikTokVideoRecord>();
 for(const record of records){
  const current=latest.get(record.itemId);
  if(!current||new Date(record.recordCreatedTime)>new Date(current.recordCreatedTime))latest.set(record.itemId,record);
 }
 return [...latest.values()];
}

export const getSummary=(input:TikTokVideoRecord[]):SummaryAnalytics=>{
 const records=getLatestSnapshots(input),views=sum(records,"videoViews"),engagement=sum(records,"totalEngagement");
 return {totalVideos:records.length,newVideos:0,totalViews:views,totalLikes:sum(records,"likes"),totalShares:sum(records,"shares"),totalComments:sum(records,"comments"),totalEngagement:engagement,engagementRate:er(engagement,views),averageFullWatchRate:averageFullWatchRate(records),newVideoViews:0,newVideoLikes:0,newVideoShares:0,newVideoComments:0,newVideoEngagementRate:0,newVideoFullWatchRate:0,lastSync:input.map(x=>x.lastUpdatedTime||x.recordCreatedTime).filter(Boolean).sort().at(-1)||null,totalRecords:input.length};
};

type MetricTotals={videos:number;views:number;likes:number;shares:number;comments:number;engagement:number};
const totals=(records:TikTokVideoRecord[]):MetricTotals=>({videos:records.length,views:sum(records,"videoViews"),likes:sum(records,"likes"),shares:sum(records,"shares"),comments:sum(records,"comments"),engagement:sum(records,"totalEngagement")});
const emptyTotals=():MetricTotals=>({videos:0,views:0,likes:0,shares:0,comments:0,engagement:0});
const positiveDifference=(next:MetricTotals,current:MetricTotals):MetricTotals=>({videos:current.videos,views:Math.max(0,next.views-current.views),likes:Math.max(0,next.likes-current.likes),shares:Math.max(0,next.shares-current.shares),comments:Math.max(0,next.comments-current.comments),engagement:Math.max(0,next.engagement-current.engagement)});

/** Daily value D = cumulative snapshot D+1 minus cumulative snapshot D. */
export const getDailyAnalytics=(input:TikTokVideoRecord[],start?:string,end?:string):AnalyticsPoint[]=>{
 const snapshots=new Map<string,TikTokVideoRecord[]>();
 for(const record of input){const key=dayjs(record.recordCreatedTime).format("YYYY-MM-DD");(snapshots.get(key)||snapshots.set(key,[]).get(key)!).push(record)}
 const first=dayjs(start||[...snapshots.keys()].sort()[0]||dayjs().format("YYYY-MM-DD")).startOf("day");
 const last=dayjs(end||[...snapshots.keys()].sort().at(-1)||first).startOf("day");
 const published=new Map<string,number>();
 for(const record of getLatestSnapshots(input)){const date=getVideoPublishDate(record);if(date)published.set(date,(published.get(date)||0)+1)}
 const points:AnalyticsPoint[]=[];
 for(let date=first;!date.isAfter(last,"day");date=date.add(1,"day")){
  const key=date.format("YYYY-MM-DD"),nextKey=date.add(1,"day").format("YYYY-MM-DD");
  const currentRaw=snapshots.get(key),nextRaw=snapshots.get(nextKey);
  const current=currentRaw?totals(getLatestSnapshots(currentRaw)):emptyTotals();
  const delta=currentRaw&&nextRaw?positiveDifference(totals(getLatestSnapshots(nextRaw)),current):emptyTotals();
  delta.videos=published.get(key)||0;
  points.push({key,label:key,...delta,engagementRate:er(delta.engagement,delta.views)});
 }
 return points;
};

const rollup=(daily:AnalyticsPoint[],type:"week"|"month"):AnalyticsPoint[]=>{
 const groups=new Map<string,AnalyticsPoint[]>();
 for(const point of daily){const date=dayjs(point.key),key=type==="month"?date.format("YYYY-MM"):`Tuần ${date.startOf("week").format("DD/MM")}`;(groups.get(key)||groups.set(key,[]).get(key)!).push(point)}
 return [...groups].map(([key,points])=>{const value=points.reduce((a,x)=>({videos:a.videos+x.videos,views:a.views+x.views,likes:a.likes+x.likes,shares:a.shares+x.shares,comments:a.comments+x.comments,engagement:a.engagement+x.engagement}),emptyTotals());return{key,label:key,...value,engagementRate:er(value.engagement,value.views)}});
};
export const getWeeklyAnalytics=(r:TikTokVideoRecord[],start?:string,end?:string)=>rollup(getDailyAnalytics(r,start,end),"week");
export const getMonthlyAnalytics=(r:TikTokVideoRecord[],start?:string,end?:string)=>rollup(getDailyAnalytics(r,start,end),"month");

/** Period KPI values use finalized daily deltas, while videos remain unique tracked videos. */
export const getPeriodSummary=(input:TikTokVideoRecord[],start:string,end:string):SummaryAnalytics=>{
 const daily=getDailyAnalytics(input,start,end),periodGrowth=daily.reduce((a,x)=>({views:a.views+x.views,likes:a.likes+x.likes,shares:a.shares+x.shares,comments:a.comments+x.comments}),{views:0,likes:0,shares:0,comments:0});
 const periodRecords=input.filter(x=>!dayjs(x.recordCreatedTime).isBefore(dayjs(start).startOf("day"))&&!dayjs(x.recordCreatedTime).isAfter(dayjs(end).endOf("day")));
 // Channel totals are cumulative through the selected end date. Metrics use
 // each eligible video's newest snapshot, regardless of snapshot date.
 const periodVideos=getVideoListThroughDate(input,end),totalViews=sum(periodVideos,"videoViews"),totalLikes=sum(periodVideos,"likes"),totalShares=sum(periodVideos,"shares"),totalComments=sum(periodVideos,"comments"),totalEngagement=totalLikes+totalShares+totalComments;
 const newVideoRecords=getNewVideoList(input,start,end);
 const periodEngagement=periodGrowth.likes+periodGrowth.shares+periodGrowth.comments;
 return {totalVideos:periodVideos.length,newVideos:newVideoRecords.length,totalViews,totalLikes,totalShares,totalComments,totalEngagement,engagementRate:er(totalEngagement,totalViews),averageFullWatchRate:averageFullWatchRate(periodVideos),newVideoViews:periodGrowth.views,newVideoLikes:periodGrowth.likes,newVideoShares:periodGrowth.shares,newVideoComments:periodGrowth.comments,newVideoEngagementRate:er(periodEngagement,periodGrowth.views),newVideoFullWatchRate:averageFullWatchRate(periodVideos),lastSync:input.map(x=>x.lastUpdatedTime||x.recordCreatedTime).filter(Boolean).sort().at(-1)||null,totalRecords:periodRecords.length};
};

/** Per-video growth in a period uses the same D+1 minus D rule as daily charts. */
export const getVideoGrowth=(input:TikTokVideoRecord[],start:string,end:string):TikTokVideoRecord[]=>{
 const byVideo=new Map<string,TikTokVideoRecord[]>();
 for(const record of input)(byVideo.get(record.itemId)||byVideo.set(record.itemId,[]).get(record.itemId)!).push(record);
 const first=dayjs(start).startOf("day"),last=dayjs(end).startOf("day"),result:TikTokVideoRecord[]=[];
 for(const records of byVideo.values()){
  const byDay=new Map<string,TikTokVideoRecord>();
  for(const record of records){const key=dayjs(record.recordCreatedTime).format("YYYY-MM-DD"),current=byDay.get(key);if(!current||dayjs(record.recordCreatedTime).isAfter(current.recordCreatedTime))byDay.set(key,record)}
  const latest=[...records].sort((a,b)=>dayjs(b.recordCreatedTime).valueOf()-dayjs(a.recordCreatedTime).valueOf())[0];
  let views=0,likes=0,shares=0,comments=0;
  for(let date=first;!date.isAfter(last,"day");date=date.add(1,"day")){const current=byDay.get(date.format("YYYY-MM-DD")),next=byDay.get(date.add(1,"day").format("YYYY-MM-DD"));if(current&&next){views+=Math.max(0,next.videoViews-current.videoViews);likes+=Math.max(0,next.likes-current.likes);shares+=Math.max(0,next.shares-current.shares);comments+=Math.max(0,next.comments-current.comments)}}
  if(views||likes||shares||comments)result.push({...latest,videoViews:views,likes,shares,comments,totalEngagement:likes+shares+comments});
 }
 return result;
};

export const getAllVideoList=(input:TikTokVideoRecord[])=>getLatestSnapshots(input).sort((a,b)=>dayjs(getVideoPublishDate(b)||0).valueOf()-dayjs(getVideoPublishDate(a)||0).valueOf());
export const getVideoListThroughDate=(input:TikTokVideoRecord[],end:string)=>getAllVideoList(input).filter(record=>{const published=getVideoPublishDate(record);return published!==null&&!dayjs(published).isAfter(dayjs(end).endOf("day"))});
export const getNewVideoList=(input:TikTokVideoRecord[],start:string,end:string)=>getAllVideoList(input).filter(record=>{const published=getVideoPublishDate(record);return published!==null&&!dayjs(published).isBefore(dayjs(start).startOf("day"))&&!dayjs(published).isAfter(dayjs(end).endOf("day"))});
export const getNewVideoPeriodList=(input:TikTokVideoRecord[],start:string,end:string)=>{const growth=new Map(getVideoGrowth(input,start,end).map(x=>[x.itemId,x]));return getNewVideoList(input,start,end).map(video=>{const value=growth.get(video.itemId);return{...video,videoViews:value?.videoViews||0,likes:value?.likes||0,shares:value?.shares||0,comments:value?.comments||0,totalEngagement:value?.totalEngagement||0}})};

const isoWeekRange=(year:number,week:number)=>{const jan4=new Date(Date.UTC(year,0,4)),monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-(jan4.getUTCDay()||7)+1+(week-1)*7);const sunday=new Date(monday);sunday.setUTCDate(monday.getUTCDate()+6);return{start:dayjs(monday).format("YYYY-MM-DD"),end:dayjs(sunday).format("YYYY-MM-DD")}};
export const getFilterOptions=(input:TikTokVideoRecord[])=>{
 const videos=getLatestSnapshots(input),weeks=new Map<string,{value:string;label:string;start:string;end:string;sort:number}>(),months=new Map<string,{value:string;label:string;start:string;end:string;sort:number}>();
 for(const video of videos){
  const published=getVideoPublishDate(video);if(!published)continue;
  const weekNumber=Number(video.week.replace(/\D/g,""));
  if(video.year&&weekNumber){const range=isoWeekRange(video.year,weekNumber),value=`${video.year}-W${String(weekNumber).padStart(2,"0")}`;weeks.set(value,{value,label:`W${weekNumber} (${dayjs(range.start).format("DD/MM")} - ${dayjs(range.end).format("DD/MM")})`,...range,sort:dayjs(range.start).valueOf()})}
  const date=dayjs(published),value=date.format("YYYY-MM");months.set(value,{value,label:`Tháng ${date.month()+1}/${date.year()}`,start:date.startOf("month").format("YYYY-MM-DD"),end:date.endOf("month").format("YYYY-MM-DD"),sort:date.valueOf()});
 }
 return{weeks:[...weeks.values()].sort((a,b)=>b.sort-a.sort),months:[...months.values()].sort((a,b)=>b.sort-a.sort)};
};

export const getTopVideos=(input:TikTokVideoRecord[],limit=50)=>getLatestSnapshots(input).sort((a,b)=>b.videoViews-a.videoViews).slice(0,limit);
export const getViralVideos=(input:TikTokVideoRecord[])=>getLatestSnapshots(input).sort((a,b)=>(b.videoViews+b.shares*20+er(b.totalEngagement,b.videoViews)*100)-(a.videoViews+a.shares*20+er(a.totalEngagement,a.videoViews)*100)).slice(0,50);
export const getTopVideoGrowth=(input:TikTokVideoRecord[],start:string,end:string,limit=50)=>getVideoGrowth(input,start,end).sort((a,b)=>b.videoViews-a.videoViews).slice(0,limit);
export const getViralVideoGrowth=(input:TikTokVideoRecord[],start:string,end:string)=>getVideoGrowth(input,start,end).sort((a,b)=>(b.videoViews+b.shares*20+er(b.totalEngagement,b.videoViews)*100)-(a.videoViews+a.shares*20+er(a.totalEngagement,a.videoViews)*100)).slice(0,50);

export const getTrafficSources=(input:TikTokVideoRecord[]):TrafficSourceAnalytics[]=>{
 const records=getLatestSnapshots(input),labels={feed:"Dành cho bạn",follow:"Đang theo dõi",profile:"Hồ sơ",search:"Tìm kiếm",sound:"Âm thanh"};
 const values=Object.keys(labels).map(key=>({key:key as keyof typeof labels,label:labels[key as keyof typeof labels],value:records.reduce((total,x)=>total+x.impressionSources[key as keyof typeof labels],0)}));
 const total=values.reduce((value,x)=>value+x.value,0);
 return values.map(x=>({...x,percentage:total?x.value/total*100:0}));
};

export const getKeywordAnalysis=(input:TikTokVideoRecord[]):KeywordAnalytics[]=>{
 const records=getLatestSnapshots(input),keywords=new Map<string,{occurrences:number;views:number;ids:Set<string>}>();
 for(const record of records){
  const tags=[...new Set((record.hashtags.match(/#[\p{L}\p{N}_]+/gu)||record.hashtags.split(/[\s,;]+/)).map(tag=>tag.trim().replace(/^#+/,"").toLowerCase()).filter(Boolean))];
  for(const tag of tags){const value=keywords.get(tag)||{occurrences:0,views:0,ids:new Set<string>()};value.occurrences++;value.views+=record.videoViews;value.ids.add(record.itemId);keywords.set(tag,value)}
 }
 return [...keywords].map(([keyword,x])=>({keyword,occurrences:x.occurrences,views:x.views,videos:x.ids.size})).sort((a,b)=>b.occurrences-a.occurrences).slice(0,100);
};

const TOPICS:Record<string,string[]>={"Khí huyết":["khí huyết","bổ khí","tuần hoàn"],"Mất ngủ":["mất ngủ","ngủ sớm","giấc ngủ"],"Dưỡng nhan":["dưỡng nhan","da","nhan sắc"],"Nội tiết":["nội tiết","hormone"],"Gan":["gan","nóng gan"],"Tiêu hóa":["tiêu hóa","dạ dày","đường ruột"],"Thải độc":["thải độc","độc tố"],"Làm đẹp":["làm đẹp","tóc","mụn"]};
export const getTopicAnalysis=(input:TikTokVideoRecord[]):TopicAnalytics[]=>{
 const records=getLatestSnapshots(input),topics=new Map<string,TikTokVideoRecord[]>();
 for(const record of records){const caption=record.caption.toLowerCase(),topic=Object.entries(TOPICS).find(([,words])=>words.some(word=>caption.includes(word)))?.[0]||"Khác";(topics.get(topic)||topics.set(topic,[]).get(topic)!).push(record)}
 return [...topics].map(([topic,items])=>{const summary=getSummary(items);return{topic,videos:items.length,views:summary.totalViews,averageViews:items.length?summary.totalViews/items.length:0,averageEngagementRate:summary.engagementRate}}).sort((a,b)=>b.views-a.views);
};
export const getSearchAnalysis=(records:TikTokVideoRecord[])=>{const sources=getTrafficSources(records);return{sources,growthChannel:[...sources].sort((a,b)=>b.percentage-a.percentage)[0]?.label||"Chưa có dữ liệu"}};
