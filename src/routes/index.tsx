import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const GOOGLE_ADS_CONVERSION = "AW-18455663339/hL3YCOO9hfwcEOulrOBE";

type LandingPageCustomization = {
  heroTitle?: string;
  heroDescription?: string;
  heroButtonText?: string;
  primaryColor?: string;
  buttonColor?: string;
  backgroundColor?: string;
  textColor?: string;
  showImage?: boolean;
  showCTA?: boolean;
  showSection?: boolean;
};

type LandingPageStyle = CSSProperties & {
  "--landing-primary"?: string;
  "--landing-button"?: string;
  "--landing-background"?: string;
  "--landing-text"?: string;
};

function trackSignupConversion() {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_CONVERSION,
      transport_type: "beacon",
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getSupportedColor(value: unknown) {
  const color = getNonEmptyString(value);
  return color && typeof CSS !== "undefined" && CSS.supports("color", color)
    ? color
    : undefined;
}

function getLandingPageCustomization(value: unknown): LandingPageCustomization {
  if (!isRecord(value)) return {};

  const customization: LandingPageCustomization = {};
  const heroTitle = getNonEmptyString(value["heroTitle"]);
  const heroDescription = getNonEmptyString(value["heroDescription"]);
  const heroButtonText = getNonEmptyString(value["heroButtonText"]);
  const primaryColor = getSupportedColor(value["primaryColor"]);
  const buttonColor = getSupportedColor(value["buttonColor"]);
  const backgroundColor = getSupportedColor(value["backgroundColor"]);
  const textColor = getSupportedColor(value["textColor"]);

  if (heroTitle) customization.heroTitle = heroTitle;
  if (heroDescription) customization.heroDescription = heroDescription;
  if (heroButtonText) customization.heroButtonText = heroButtonText;
  if (primaryColor) customization.primaryColor = primaryColor;
  if (buttonColor) customization.buttonColor = buttonColor;
  if (backgroundColor) customization.backgroundColor = backgroundColor;
  if (textColor) customization.textColor = textColor;
  if (typeof value["showImage"] === "boolean") customization.showImage = value["showImage"];
  if (typeof value["showCTA"] === "boolean") customization.showCTA = value["showCTA"];
  if (typeof value["showSection"] === "boolean") customization.showSection = value["showSection"];

  return customization;
}

async function fetchLandingPage() {
  const { data, error } = await getSupabaseClient()
    .from("landing_pages")
    .select("invite_link, invite_code, customization")
    .eq("slug", "landing-2")
    .single();

  if (error) throw error;
  if (!data?.invite_link) throw new Error("Landing page 2 has no invite link");

  const inviteUrl = new URL(data.invite_link);
  const inviteCode =
    inviteUrl.searchParams.get("invite_code") ??
    inviteUrl.pathname.match(/\/invite\/([^/]+)\/?$/)?.[1] ??
    data.invite_code ??
    null;

  return {
    inviteLink: data.invite_link,
    inviteCode,
    customization: getLandingPageCustomization(data.customization),
  };
}

const faqs = [
  ["How do I sign up?", "Use any application link on this page to open Uber’s official signup flow. The referral code is already included."],
  ["Can I sign up with my car?", "Choose the driving option in Uber’s signup flow and check the vehicle requirements for your location."],
  ["Can I deliver with a bike?", "Choose bike delivery in Uber’s signup flow to check whether it is available in your city."],
  ["What documents do I need?", "Required information and documents vary by vehicle type, city and location."],
  ["Can I choose my own schedule?", "These opportunities are designed around flexibility, though availability varies by location."],
  ["Do requirements vary by city?", "Yes. Eligibility, requirements and availability can differ by city."],
  ["How does the referral link work?", "The link opens Uber’s registration process with the invite code already included."],
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Drive or Deliver in the USA | Get Started" },
    { name: "description", content: "Explore flexible driving and bike delivery opportunities in the USA. Choose your option and start the signup process." },
    { property: "og:title", content: "Drive or Deliver in the USA | Get Started" },
    { property: "og:description", content: "Choose to drive with your car or deliver by bike and begin the official signup process." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: "/" }] }), component: Index,
});

function Cta({ children, className = "button primary", inviteLink }: { children: React.ReactNode; className?: string; inviteLink: string | null }) {
  return <a className={className} href={inviteLink ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!inviteLink} onClick={(event) => {
    if (!inviteLink) {
      event.preventDefault();
      return;
    }
    trackSignupConversion();
  }}>{children}<ArrowRight size={17} aria-hidden="true" /></a>;
}

function Header({ inviteLink, showCTA }: { inviteLink: string | null; showCTA: boolean }) {
  const [open,setOpen]=useState(false);
  return <header><a href="#top" className="wordmark" aria-label="Roadshift home"><span>R</span>Roadshift</a><nav className="nav-desktop" aria-label="Main navigation"><a href="#paths">Options</a><a href="#how">How it works</a><a href="#requirements">Requirements</a><a href="#faq">FAQ</a></nav>{showCTA&&<Cta className="nav-cta" inviteLink={inviteLink}>Apply</Cta>}<button className="menu" id="mobile-menu-button" aria-label={open?"Close menu":"Open menu"} aria-controls="mobile-navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={`nav-mobile${open?" is-open":""}`} id="mobile-navigation" aria-label="Mobile navigation" aria-hidden={!open}><a onClick={()=>setOpen(false)} href="#paths">Options</a><a onClick={()=>setOpen(false)} href="#how">How it works</a><a onClick={()=>setOpen(false)} href="#requirements">Requirements</a><a onClick={()=>setOpen(false)} href="#faq">FAQ</a>{showCTA&&<Cta inviteLink={inviteLink}>Start your application</Cta>}</nav></header>
}

function Index(){
 const [open,setOpen]=useState(0);
 const [showMobileCta,setShowMobileCta]=useState(false);
 const [inviteLink,setInviteLink]=useState<string | null>(null);
 const [inviteCode,setInviteCode]=useState<string | null>(null);
 const [customization,setCustomization]=useState<LandingPageCustomization>({});
 const showCTA=customization.showCTA!==false;
 const showHeroImage=customization.showImage!==false;
 useEffect(()=>{
  let active=true;
  fetchLandingPage()
   .then(({inviteLink,inviteCode,customization})=>{
    if(active){
     setInviteLink(inviteLink);
     setInviteCode(inviteCode);
     setCustomization(customization);
    }
   })
   .catch((error: unknown)=>{console.error("Unable to load the Uber invite link from Supabase.",error)});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  const hero=document.querySelector(".hero");
  const closing=document.querySelector(".closing");
  if(!hero||!closing)return;
  const heroObserver=new IntersectionObserver(([entry])=>setShowMobileCta(!entry.isIntersecting),{threshold:.05});
  const closingObserver=new IntersectionObserver(([entry])=>{
   if(entry.isIntersecting){setShowMobileCta(false);return}
   if(entry.boundingClientRect.top>0)setShowMobileCta(window.scrollY>window.innerHeight*.7);
   else setShowMobileCta(false);
  },{threshold:.1});
  heroObserver.observe(hero);
  closingObserver.observe(closing);
  return()=>{heroObserver.disconnect();closingObserver.disconnect()};
 },[]);
 const pageStyle: LandingPageStyle = {
  ...(customization.primaryColor && {"--landing-primary": customization.primaryColor}),
  ...(customization.buttonColor && {"--landing-button": customization.buttonColor}),
  ...(customization.backgroundColor && {"--landing-background": customization.backgroundColor}),
  ...(customization.textColor && {"--landing-text": customization.textColor}),
 };
 return <main id="top" style={pageStyle}><Header inviteLink={inviteLink} showCTA={showCTA}/>
  <section className="intro hero">
    {showHeroImage&&<div className="hero-visual" aria-hidden="true">
      <div className="hero-scene hero-scene-car"><img src="/images/hero-car.webp" alt="" /></div>
      <div className="hero-scene hero-scene-bike"><img src="/images/hero-bike.webp" alt="" /></div>
      <span className="hero-tag hero-tag-car">01 / DRIVE</span>
      <span className="hero-tag hero-tag-bike">02 / DELIVER</span>
    </div>}
    <div className="hero-copy">
      <p className="pill"><span className="status-dot" /> Independent referral page</p>
      <h1>{customization.heroTitle??<>Make your<br/>next move.</>}</h1>
      <p className="lead">{customization.heroDescription??"Drive with your car or deliver by bike. Choose a path that fits your life and continue to Uber’s official signup process."}</p>
      <div className="intro-actions">{showCTA&&<Cta inviteLink={inviteLink}>{customization.heroButtonText??"Start your application"}</Cta>}<a className="button secondary" href="#paths">Explore your options</a></div>
      <p className="micro"><ShieldCheck size={15} aria-hidden="true"/> Referral code included <i/> Secure signup on uber.com</p>
    </div>
    <a className="hero-scroll" href="#paths"><span>Scroll to explore</span><ChevronDown size={16}/></a>
  </section>
  {customization.showSection!==false&&<section id="paths" className="path-showcase shell" aria-labelledby="paths-title">
    <div className="section-label"><span>01</span><p>Choose your path</p><h2 id="paths-title">Two routes.<br/>One next step.</h2></div>
    <div className="path-options">
      <a href={inviteLink ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!inviteLink} className="option option-car" aria-label="Open Uber signup to explore driving with a car" onClick={(event)=>{if(!inviteLink){event.preventDefault();return}trackSignupConversion()}}><img src="/images/car-driver.webp" alt="Modern car driving through an American city at night" width="1600" height="907" loading="lazy" decoding="async"/><div><span>Drive</span><h3>With your car</h3><p>Check the driving options and vehicle requirements for your location.</p><b>Continue to Uber signup <ArrowRight size={16}/></b></div></a>
      <a href={inviteLink ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!inviteLink} className="option option-bike" aria-label="Open Uber signup to explore bike delivery" onClick={(event)=>{if(!inviteLink){event.preventDefault();return}trackSignupConversion()}}><img src="/images/bike-courier.webp" alt="Bike courier moving through an American city" width="1600" height="907" loading="lazy" decoding="async"/><div><span>Deliver</span><h3>With your bike</h3><p>Check bike delivery availability and requirements for your location.</p><b>Continue to Uber signup <ArrowRight size={16}/></b></div></a>
    </div>
  </section>}
  <p className="signup-note shell"><ShieldCheck size={17} aria-hidden="true"/><span>Both options open Uber’s official signup with the referral code included. Choose your service and confirm local availability there.</span></p>

  <section className="trust"><div className="shell trust-inner"><ShieldCheck size={32}/><h2>An independent referral page. Your application is completed through Uber’s official platform.</h2><div className="trust-points"><p><b>Secure application</b><span>Handled on uber.com</span></p><p><b>Referral included</b><span>{inviteCode ? `Code ${inviteCode} is in the link` : "Invite code is included in the link"}</span></p><p><b>No earnings promises</b><span>Eligibility varies by location</span></p></div></div></section>

  <section id="how" className="content-section shell"><div className="section-label"><span>02</span><p>The process</p><h2>Three clear<br/>steps.</h2></div><div className="steps">{[["01","Sign up","Start through the referral link."],["02","Complete requirements","Provide the information and documents required for your location."],["03","Get ready","Complete the onboarding process and get started."]].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <section className="benefits shell"><div className="section-label"><span>03</span><p>Built around you</p><h2>Flexibility,<br/>made simple.</h2></div><div className="benefit-list">{["Flexible schedule","Choose when you work","Car or bike","Simple signup","Mobile friendly","Location-based requirements"].map((x,i)=><p key={x}><span>0{i+1}</span>{x}</p>)}</div></section>

  <section id="requirements" className="requirements"><div className="shell requirement-inner"><div className="section-label"><span>04</span><p>Quick check</p><h2>What you’ll<br/>need.</h2></div><div className="requirement-columns"><div><h3>Driving with a car</h3>{["Valid driver’s license","Eligible vehicle","Required documents","Smartphone"].map(x=><p key={x}><Check size={15}/>{x}</p>)}</div><div><h3>Delivering with a bike</h3>{["Eligible bicycle","Smartphone","Required identification/documents"].map(x=><p key={x}><Check size={15}/>{x}</p>)}</div><small>Requirements and availability may vary by city and location.</small></div></div></section>

  <section className="usa shell"><div><span className="pill">USA-focused opportunities</span><h2>Built for the<br/>road ahead.</h2><p>Opportunities, requirements and availability can vary depending on your city and location.</p></div><svg viewBox="0 0 960 600" role="img" aria-label="Abstract outline of the contiguous United States"><path d="M93 111L173 135 225 116 290 148 345 130 401 152 468 133 527 165 598 154 646 190 733 194 799 241 856 248 843 304 803 333 785 391 727 417 678 470 617 472 566 520 519 484 455 475 404 434 344 436 304 393 241 377 206 329 151 305 127 252 81 221Z"/></svg></section>

  <section id="faq" className="faq shell"><div className="section-label"><span>05</span><p>Common questions</p><h2>Good to<br/>know.</h2></div><div className="accordion">{faqs.map(([q,a],i)=><div className="faq-row" key={q}><button id={`faq-question-${i}`} onClick={()=>setOpen(open===i?-1:i)} aria-expanded={open===i} aria-controls={`faq-answer-${i}`}><span>{String(i+1).padStart(2,"0")}</span>{q}<ChevronDown size={18}/></button><div id={`faq-answer-${i}`} className="faq-answer" role="region" aria-labelledby={`faq-question-${i}`} aria-hidden={open!==i}><p>{a}</p></div></div>)}</div></section>

  <section className="closing shell"><div className="closing-mark"><div>R</div></div><p className="pill">Your next move</p><h2>Ready to get<br/>started?</h2><p>Choose your path and begin the signup process.</p>{showCTA&&<Cta inviteLink={inviteLink}>Start your application</Cta>}</section>

  <footer className="shell"><a href="#top" className="wordmark" aria-label="Roadshift home"><span>R</span>Roadshift</a><nav aria-label="Footer navigation"><a href="#paths">Options</a><a href="#how">How it works</a><a href="#requirements">Requirements</a><a href="#faq">FAQ</a><a href={inviteLink ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!inviteLink} onClick={(event)=>{if(!inviteLink){event.preventDefault();return}trackSignupConversion()}}>Official signup ↗</a></nav><p>This is an independent referral landing page. Registration and eligibility are handled through Uber.</p><small>© 2026 Roadshift. Independent referral campaign.</small></footer>
  {showCTA&&showMobileCta&&<div className="mobile-apply-dock"><span>Ready for your next move?</span><Cta inviteLink={inviteLink}>Apply now</Cta></div>}
 </main>
}
