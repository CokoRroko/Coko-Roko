'use client';
import {useEffect,useState} from 'react';import {supabase} from './supabase';
export default function useUser(){const [u,setU]=useState(undefined);
useEffect(()=>{supabase.auth.getUser().then(({data})=>setU(data.user));const {data:s}=supabase.auth.onAuthStateChange((_,se)=>setU(se?.user??null));return()=>s.subscription.unsubscribe()},[]);return u}
