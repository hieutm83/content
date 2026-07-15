"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { fmt,pct } from "@/lib/utils";
import type { KeywordAnalytics,TopicAnalytics,TrafficSourceAnalytics } from "@/types/lark";
import { Empty,Panel,Skeleton } from "./ui";
import { TrafficDonut } from "./charts";

type SearchData={sources:TrafficSourceAnalytics[];growthChannel:string};
export function TrafficView({search=false}:{search?:boolean}){
 const q=useAnalytics<TrafficSourceAnalytics[]|SearchData>(search?"search-analysis":"traffic-sources");
 if(q.loading)return <Skeleton className="h-[500px]"/>;
 if(q.error)return <Empty title="Không thể tải nguồn truy cập" description={q.error}/>;
 const data=Array.isArray(q.data)?q.data:q.data?.sources||[];
 const growth=!Array.isArray(q.data)?q.data?.growthChannel:null;
 return <div><h1 className="text-2xl font-bold">{search?"Phân tích tìm kiếm":"Nguồn truy cập"}</h1><p className="mt-1 text-sm text-slate-500">Tỷ trọng nguồn hiển thị của toàn bộ video trong kỳ.</p>{growth&&<Panel className="mt-5 border-brand-100 bg-brand-50 p-5"><p className="text-xs font-semibold text-brand-700">Kênh đóng góp lớn nhất</p><p className="mt-1 text-2xl font-bold text-brand-700">{growth}</p></Panel>}<div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]"><Panel className="p-5"><TrafficDonut data={data}/></Panel><Panel className="p-5"><div className="space-y-5">{data.map(x=><div key={x.key}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{x.label}</span><span>{fmt(x.value)} <span className="text-slate-400">({pct(x.percentage)})</span></span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{width:`${x.percentage}%`}}/></div></div>)}</div></Panel></div></div>
}
export function KeywordView(){const q=useAnalytics<KeywordAnalytics[]>("keywords");return <RankTable title="Phân tích hashtag" subtitle="Top 100 hashtag lấy trực tiếp từ cột Hashtag của Lark Base." loading={q.loading} error={q.error} headers={["Hashtag","Số video sử dụng","Tổng views"]} rows={(q.data||[]).map(x=>[`#${x.keyword}`,fmt(x.videos),fmt(x.views)])}/>}
export function TopicView(){const q=useAnalytics<TopicAnalytics[]>("topics");return <RankTable title="Phân tích chủ đề" subtitle="Caption được phân nhóm theo 8 chủ đề sức khỏe và nhóm Khác." loading={q.loading} error={q.error} headers={["Chủ đề","Số video","Tổng views","View trung bình","ER trung bình"]} rows={(q.data||[]).map(x=>[x.topic,fmt(x.videos),fmt(x.views),fmt(x.averageViews),pct(x.averageEngagementRate)])}/>}
function RankTable({title,subtitle,loading,error,headers,rows}:{title:string;subtitle:string;loading:boolean;error:string|null;headers:string[];rows:string[][]}){if(loading)return <Skeleton className="h-[520px]"/>;if(error)return <Empty title="Không thể tải dữ liệu" description={error}/>;return <div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p><Panel className="mt-5 overflow-hidden"><div className="scrollbar max-h-[650px] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr>{headers.map(x=><th className="px-5 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t hover:bg-slate-50">{r.map((x,j)=><td key={j} className={`px-5 py-3 ${j===0?"font-semibold text-slate-900":"text-slate-600"}`}>{x}</td>)}</tr>)}</tbody></table></div>{!rows.length&&<Empty/>}</Panel></div>}
