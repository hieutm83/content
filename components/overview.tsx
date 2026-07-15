"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { ArrowDownRight,ArrowUpRight,Clapperboard,Download,Eye,Heart,MessageCircle,Minus,Percent,Share2,Video,X } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { fmt,pct } from "@/lib/utils";
import type { DailyAnalytics,SummaryAnalytics,SummaryComparison,TikTokVideoRecord } from "@/types/lark";
import { Button,Empty,Panel,Skeleton } from "./ui";
import { TrendChart } from "./charts";

type ComparisonKey=keyof SummaryComparison;
type Card={label:string;value:number;icon:typeof Video;metric:ComparisonKey;percentage?:boolean;list?:"all"|"new"};
const tones:Record<ComparisonKey,{bar:string;icon:string;value:string;hover:string}>={
 totalVideos:{bar:"bg-blue-500",icon:"bg-blue-50 text-blue-700",value:"text-blue-950",hover:"hover:border-blue-300"},
 newVideos:{bar:"bg-blue-500",icon:"bg-blue-50 text-blue-700",value:"text-blue-950",hover:"hover:border-blue-300"},
 totalViews:{bar:"bg-cyan-500",icon:"bg-cyan-50 text-cyan-700",value:"text-cyan-950",hover:"hover:border-cyan-300"},
 newVideoViews:{bar:"bg-cyan-500",icon:"bg-cyan-50 text-cyan-700",value:"text-cyan-950",hover:"hover:border-cyan-300"},
 totalLikes:{bar:"bg-rose-500",icon:"bg-rose-50 text-rose-700",value:"text-rose-950",hover:"hover:border-rose-300"},
 newVideoLikes:{bar:"bg-rose-500",icon:"bg-rose-50 text-rose-700",value:"text-rose-950",hover:"hover:border-rose-300"},
 totalShares:{bar:"bg-violet-500",icon:"bg-violet-50 text-violet-700",value:"text-violet-950",hover:"hover:border-violet-300"},
 newVideoShares:{bar:"bg-violet-500",icon:"bg-violet-50 text-violet-700",value:"text-violet-950",hover:"hover:border-violet-300"},
 totalComments:{bar:"bg-amber-500",icon:"bg-amber-50 text-amber-700",value:"text-amber-950",hover:"hover:border-amber-300"},
 newVideoComments:{bar:"bg-amber-500",icon:"bg-amber-50 text-amber-700",value:"text-amber-950",hover:"hover:border-amber-300"},
 averageFullWatchRate:{bar:"bg-emerald-500",icon:"bg-emerald-50 text-emerald-700",value:"text-emerald-950",hover:"hover:border-emerald-300"},
 newVideoFullWatchRate:{bar:"bg-emerald-500",icon:"bg-emerald-50 text-emerald-700",value:"text-emerald-950",hover:"hover:border-emerald-300"},
 engagementRate:{bar:"bg-teal-500",icon:"bg-teal-50 text-teal-700",value:"text-teal-950",hover:"hover:border-teal-300"},
 newVideoEngagementRate:{bar:"bg-teal-500",icon:"bg-teal-50 text-teal-700",value:"text-teal-950",hover:"hover:border-teal-300"}
};

export function Overview({onMeta:_onMeta}:{onMeta:(x:{refresh:()=>void;loading:boolean;total:number;lastSync:string|null})=>void}){
 const s=useAnalytics<SummaryAnalytics>("summary"),d=useAnalytics<DailyAnalytics[]>("daily",7),allVideos=useAnalytics<TikTokVideoRecord[]>("all-videos"),newVideos=useAnalytics<TikTokVideoRecord[]>("new-videos"),[list,setList]=useState<"all"|"new"|null>(null);
 if(s.loading)return <Loading/>;
 if(s.error)return <Empty title="Không thể kết nối Lark Base" description={s.error}/>;
 if(!s.data)return <Empty/>;
 const totalCards:Card[]=[
  {label:"Tổng video",value:s.data.totalVideos,icon:Video,metric:"totalVideos",list:"all"},
  {label:"Tổng lượt xem",value:s.data.totalViews,icon:Eye,metric:"totalViews"},
  {label:"Tổng lượt thích",value:s.data.totalLikes,icon:Heart,metric:"totalLikes"},
  {label:"Tổng lượt chia sẻ",value:s.data.totalShares,icon:Share2,metric:"totalShares"},
  {label:"Tổng bình luận",value:s.data.totalComments,icon:MessageCircle,metric:"totalComments"},
  {label:"Tỷ lệ xem hết",value:s.data.averageFullWatchRate,icon:Percent,metric:"averageFullWatchRate",percentage:true}
 ];
 const newCards:Card[]=[
  {label:"Video đăng mới",value:s.data.newVideos,icon:Clapperboard,metric:"newVideos",list:"new"},
  {label:"Tổng lượt xem trong kỳ",value:s.data.newVideoViews,icon:Eye,metric:"newVideoViews"},
  {label:"Tổng lượt thích trong kỳ",value:s.data.newVideoLikes,icon:Heart,metric:"newVideoLikes"},
  {label:"Tổng lượt chia sẻ trong kỳ",value:s.data.newVideoShares,icon:Share2,metric:"newVideoShares"},
  {label:"Tổng bình luận trong kỳ",value:s.data.newVideoComments,icon:MessageCircle,metric:"newVideoComments"},
  {label:"Tỷ lệ xem hết trong kỳ",value:s.data.newVideoFullWatchRate,icon:Percent,metric:"newVideoFullWatchRate",percentage:true}
 ];
 const row=(cards:Card[],showComparison=true)=><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{cards.map(card=><KpiCard key={card.metric} {...card} showComparison={showComparison} onClick={card.list?()=>setList(card.list!):undefined} change={s.data?.comparison?.[card.metric]||0}/>)}</div>;
 return <div className="space-y-6"><div className="border-b border-slate-200 pb-5"><p className="mb-1 text-xs font-bold uppercase tracking-[.12em] text-brand-700">Báo cáo kênh</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-[28px]">Tổng quan hiệu suất</h1><p className="mt-1.5 text-sm text-slate-500">Hiệu suất toàn kênh và video đăng mới trong kỳ đã chọn.</p></div><section><h2 className="mb-3 text-xs font-bold uppercase tracking-[.1em] text-slate-500">Chỉ số tổng kênh</h2>{row(totalCards,false)}</section><section><h2 className="mb-3 text-xs font-bold uppercase tracking-[.1em] text-slate-500">Chỉ số trong khoảng thời gian đã chọn</h2>{row(newCards)}</section><section><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[.1em] text-slate-500">Biểu đồ diễn biến</h2><span className="text-xs text-slate-400">Theo ngày</span></div><div className="grid gap-5 xl:grid-cols-2"><Panel className="p-5"><h3 className="font-bold text-slate-900">Lượt xem theo ngày</h3><p className="mb-4 mt-1 text-xs text-slate-500">Chênh lệch giữa hai snapshot liên tiếp</p>{d.data?.length?<TrendChart data={d.data}/>:<Empty/>}</Panel><Panel className="p-5"><h3 className="font-bold text-slate-900">Tương tác theo ngày</h3><p className="mb-4 mt-1 text-xs text-slate-500">Likes, shares và comments phát sinh</p>{d.data?.length?<TrendChart data={d.data} metric="engagement" bar/>:<Empty/>}</Panel></div></section>{list&&<VideoListModal title={list==="all"?"Chỉ số tổng kênh":"Chỉ số trong khoảng thời gian đã chọn"} videos={(list==="all"?allVideos.data:newVideos.data)||[]} loading={list==="all"?allVideos.loading:newVideos.loading} onClose={()=>setList(null)}/>}</div>
}
function KpiCard({label,value,icon:Icon,metric,change,percentage,onClick,showComparison=true}:{label:string;value:number;icon:typeof Video;metric:ComparisonKey;change:number;percentage?:boolean;onClick?:()=>void;showComparison?:boolean}){const up=change>0,down=change<0,ChangeIcon=up?ArrowUpRight:down?ArrowDownRight:Minus,tone=tones[metric];return <Panel onClick={onClick} role={onClick?"button":undefined} tabIndex={onClick?0:undefined} onKeyDown={e=>{if(onClick&&(e.key==="Enter"||e.key===" "))onClick()}} className={`group relative overflow-hidden p-4 ${tone.hover} ${onClick?"cursor-pointer hover:-translate-y-0.5 hover:shadow-md":""}`}><span className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`}/><div className="flex min-h-8 items-start justify-between gap-2"><p className="text-xs font-semibold leading-4 text-slate-500">{label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-md ${tone.icon}`}><Icon size={16}/></span></div><p className={`mt-3 font-mono text-2xl font-bold tracking-tight ${tone.value}`}>{percentage?pct(value):fmt(value)}</p>{showComparison&&<div className={`mt-2 flex min-h-4 items-center gap-1 text-xs font-semibold ${up?"text-emerald-600":down?"text-rose-600":"text-slate-400"}`}><ChangeIcon size={14}/><span>{change>0?"+":""}{pct(change)}</span><span className="truncate font-normal text-slate-400">so với kỳ trước</span></div>}</Panel>}

function VideoListModal({title,videos,loading,onClose}:{title:string;videos:TikTokVideoRecord[];loading:boolean;onClose:()=>void}){
 const exportCsv=()=>{
  const cell=(value:unknown)=>`"${String(value??"").replace(/"/g,'""')}"`;
  const rows=videos.map(video=>[video.itemId,video.caption,video.videoCreateTime||"",video.videoViews,video.likes,video.shares,video.comments,video.fullVideoWatchedRate,video.shareUrl||""].map(cell).join(","));
  const csv=["item_id,caption,video_create_time,views,likes,shares,comments,full_video_watched_rate,share_url",...rows].join("\r\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"})),anchor=document.createElement("a");
  anchor.href=url;anchor.download=`${title==="Chỉ số tổng kênh"?"tong-kenh":"video-trong-ky"}-${dayjs().format("YYYY-MM-DD")}.csv`;anchor.click();URL.revokeObjectURL(url);
 };
 return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}><div className="max-h-[85dvh] w-full max-w-6xl overflow-hidden rounded-xl border bg-white shadow-2xl" onMouseDown={e=>e.stopPropagation()}><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-lg font-bold">{title}</h2><p className="text-xs text-slate-500">{videos.length} video, mới nhất trước</p></div><div className="flex items-center gap-2"><Button disabled={loading||!videos.length} onClick={exportCsv}><Download size={16}/>Xuất CSV</Button><button onClick={onClose} aria-label="Đóng" className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-slate-100"><X size={19}/></button></div></div><div className="scrollbar max-h-[calc(85dvh-74px)] overflow-auto">{loading?<div className="space-y-3 p-5">{Array.from({length:6},(_,i)=><Skeleton key={i} className="h-14"/>)}</div>:videos.length?<table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="w-72 px-5 py-3">Video</th><th className="px-5 py-3">Ngày đăng</th><th className="px-5 py-3">Views</th><th className="px-5 py-3">Likes</th><th className="px-5 py-3">Shares</th><th className="px-5 py-3">Comments</th><th className="px-5 py-3">Tỷ lệ xem hết</th></tr></thead><tbody>{videos.map(video=><tr key={video.itemId} className="border-t"><td className="w-72 px-5 py-2"><button type="button" title={video.caption||video.itemId} disabled={!video.shareUrl} onClick={()=>video.shareUrl&&window.open(video.shareUrl,"_blank","noopener,noreferrer")} className="flex h-11 w-64 items-center rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 hover:border-brand-500 hover:bg-brand-50 disabled:cursor-default disabled:opacity-60"><span className="block w-full truncate">{video.caption||video.itemId}</span></button></td><td className="whitespace-nowrap px-5 py-3">{video.videoCreateTime?dayjs(video.videoCreateTime).format("DD/MM/YYYY HH:mm"):"-"}</td><td className="px-5 py-3">{fmt(video.videoViews)}</td><td className="px-5 py-3">{fmt(video.likes)}</td><td className="px-5 py-3">{fmt(video.shares)}</td><td className="px-5 py-3">{fmt(video.comments)}</td><td className="px-5 py-3">{pct(video.fullVideoWatchedRate<=1?video.fullVideoWatchedRate*100:video.fullVideoWatchedRate>100?video.fullVideoWatchedRate/100:video.fullVideoWatchedRate)}</td></tr>)}</tbody></table>:<Empty title="Không có video" description="Không có video phù hợp với khoảng thời gian đã chọn."/>}</div></div></div>,document.body)
}
function Loading(){return <div className="space-y-5"><Skeleton className="h-14 w-72"/>{[0,1].map(row=><div key={row}><Skeleton className="mb-3 h-5 w-40"/><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({length:6},(_,i)=><Skeleton key={i} className="h-32"/>)}</div></div>)}<Skeleton className="h-96"/></div>}
