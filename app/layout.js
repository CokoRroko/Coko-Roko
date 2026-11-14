import './globals.css';import Nav from '@/components/Nav';
export const metadata={title:'CoKo Rroco',description:'Rrjeti social i videove të shkurtra'};
export const viewport={width:'device-width',initialScale:1,themeColor:'#0c0b14'};
export default function L({children}){return(<html lang="sq"><body><main className="md:max-w-md md:mx-auto min-h-[100dvh] pb-16">{children}</main><Nav/></body></html>)}
