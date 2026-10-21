import CScaleApp from '../../../components/CScaleApp';
export default async function Page({params}){const {slug}=await params;return <CScaleApp expectedSlug={slug}/>}
