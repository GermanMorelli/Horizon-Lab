(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();function Xa(a,e,t,n=1e-12,o=200){let i=a(e),s=a(t);if(i===0)return e;if(s===0)return t;if(i*s>0)return NaN;let r=e,l=i,u=t-e,h=u;for(let d=0;d<o;d++){Math.abs(l)<Math.abs(s)&&(e=t,t=r,r=e,i=s,s=l,l=i);const p=2*Number.EPSILON*Math.abs(t)+.5*n,c=.5*(r-t);if(Math.abs(c)<=p||s===0)return t;if(Math.abs(h)>=p&&Math.abs(i)>Math.abs(s)){let m,g;const b=s/i;if(e===r)m=2*c*b,g=1-b;else{const v=i/l,f=s/l;m=b*(2*c*v*(v-f)-(t-e)*(f-1)),g=(v-1)*(f-1)*(b-1)}m>0&&(g=-g),m=Math.abs(m),2*m<Math.min(3*c*g-Math.abs(p*g),Math.abs(h*g))?(h=u,u=m/g):(u=c,h=u)}else u=c,h=u;e=t,i=s,t+=Math.abs(u)>p?u:c>0?p:-p,s=a(t),s*l>0&&(r=e,l=i,h=t-e,u=h)}return t}function va(a,e,t,n=512,o=!1,i=1e-12){const s=(t-e)/n,r=[];for(let h=0;h<=n;h++)r.push(e+h*s);o&&r.reverse();let l=r[0],u=a(l);for(let h=1;h<r.length;h++){const d=r[h],p=a(d);if(Number.isFinite(u)&&Number.isFinite(p)&&u*p<=0){const[c,m]=l<d?[l,d]:[d,l];return Xa(a,c,m,i)}l=d,u=p}return NaN}function Wa(a,e,t,n=1e-10,o=400){const i=(Math.sqrt(5)-1)/2;let s=t-i*(t-e),r=e+i*(t-e),l=a(s),u=a(r);for(let h=0;h<o&&t-e>n;h++)l<u?(t=r,r=s,u=l,s=t-i*(t-e),l=a(s)):(e=s,s=r,l=u,r=e+i*(t-e),u=a(r));return .5*(e+t)}function H(a,e){return a*a-2*a+e.a*e.a+e.q*e.q}function be(a,e,t){const n=Math.cos(e);return a*a+t.a*t.a*n*n}function he(a,e,t){const n=Math.sin(e),o=a*a+t.a*t.a;return o*o-t.a*t.a*H(a,t)*n*n}function ee(a){const e=1-a.a*a.a-a.q*a.q;if(e<0)return{rPlus:NaN,rMinus:NaN,hasHorizon:!1,isExtremal:!1};const t=Math.sqrt(e);return{rPlus:1+t,rMinus:1-t,hasHorizon:!0,isExtremal:e<1e-12}}function Ze(a,e){const t=Math.cos(a),n=1-e.q*e.q-e.a*e.a*t*t;return n<0?NaN:1+Math.sqrt(n)}function Va(a){const e=ee(a);return e.hasHorizon?(e.rPlus-e.rMinus)/(2*(e.rPlus*e.rPlus+a.a*a.a)):NaN}function Le(a,e,t){const n=Math.sin(e),o=n*n,i=be(a,e,t),s=H(a,t),r=he(a,e,t),l=t.a;return{g_tt:-(s-l*l*o)/i,g_tphi:-l*o*(a*a+l*l-s)/i,g_phiphi:r*o/i,g_rr:i/s,g_thth:i}}function xa(a,e,t){const n=Math.sin(e),o=n*n,i=be(a,e,t),s=H(a,t),r=he(a,e,t),l=t.a;return{gtt:-r/(i*s),gtphi:-l*(a*a+l*l-s)/(i*s),gphiphi:(s-l*l*o)/(i*s*o),grr:s/i,gthth:1/i}}function Ge(a,e,t){return t.a*(a*a+t.a*t.a-H(a,t))/he(a,e,t)}function ya(a,e,t){const n=H(a,t)*be(a,e,t)/he(a,e,t);return n<=0?0:Math.sqrt(n)}function Ka(a,e,t){const n=Math.max(Math.abs(Math.sin(e)),1e-9),o=be(a,e,t),i=H(a,t),s=he(a,e,t),r=Ge(a,e,t),l=Math.sqrt(s/(i*o));return{e0:[l,0,0,l*r],er:[0,Math.sqrt(i/o),0,0],eth:[0,0,1/Math.sqrt(o),0],ephi:[0,0,0,Math.sqrt(o)/(Math.sqrt(s)*n)]}}function Ya(a,e){const t=e.a,n=e.q*e.q,o=a*a,i=o*a,s=-2/o+2*n/i,r=-t*s,l=2*a-2*t*t/o+2*t*t*n/i;return{dg_tt:s,dg_tphi:r,dg_phiphi:l}}function $e(a,e,t=!0){const{dg_tt:n,dg_tphi:o,dg_phiphi:i}=Ya(a,e),s=o*o-n*i;if(s<0)return NaN;const r=t?1:-1;return(-o+r*Math.sqrt(s))/i}function Qa(a,e,t=!0){const n=$e(a,e,t),o=Le(a,Math.PI/2,e);return o.g_tt+2*n*o.g_tphi+n*n*o.g_phiphi}function ie(a,e=!0){const t=ee(a),n=t.hasHorizon?t.rPlus+1e-9:1e-6;return va(o=>Qa(o,a,e),n,12,4096,!0)}function _a(a,e,t=!0){const n=$e(a,e,t),o=Le(a,Math.PI/2,e),i=o.g_tt+2*n*o.g_tphi+n*n*o.g_phiphi;return i>=0?NaN:-(1/Math.sqrt(-i))*(o.g_tt+n*o.g_tphi)}function Be(a,e=!0){const t=ie(a,e);if(!Number.isFinite(t))return NaN;const n=t*(1+1e-6)+1e-9;return Wa(s=>{const r=_a(s,a,e);return Number.isFinite(r)?r:1e9},n,60,1e-12)}function Za(a,e=!0){const t=Be(a,e);return 1-_a(t,a,e)}function je(a,e,t){const n=be(a,e,t),o=Math.sin(e);return{A_t:-t.q*a/n,A_phi:t.q*a*t.a*o*o/n}}function Ja(a,e=.001){const t=ee(a);return t.hasHorizon?t.rPlus*(1+e):.001}const et=1/5,at=3/40,tt=9/40,nt=3/10,ot=-9/10,it=6/5,st=-11/54,rt=5/2,lt=-70/27,ct=35/27,dt=1631/55296,ut=175/512,ht=575/13824,pt=44275/110592,mt=253/4096,ft=37/378,gt=250/621,bt=125/594,vt=512/1771,xt=2825/27648,yt=18575/48384,_t=13525/55296,Mt=277/14336,Et=1/4;function te(a,e,...t){const n=[...a];for(const[o,i]of t)for(let s=0;s<6;s++)n[s]+=e*o*i[s];return n}const St=.001;function Rt(a,e,t){const n=t(a),o=t(te(a,e,[et,n])),i=t(te(a,e,[at,n],[tt,o])),s=t(te(a,e,[nt,n],[ot,o],[it,i])),r=t(te(a,e,[st,n],[rt,o],[lt,i],[ct,s])),l=t(te(a,e,[dt,n],[ut,o],[ht,i],[pt,s],[mt,r])),u=te(a,e,[ft,n],[gt,i],[bt,s],[vt,l]),h=te(a,e,[xt,n],[yt,i],[_t,s],[Mt,r],[Et,l]);let d=0;for(let p=1;p<6;p++){const c=Math.abs(a[p])+Math.abs(u[p])+St;d=Math.max(d,Math.abs(u[p]-h[p])/c)}return{y5:u,err:d}}const De=1e-7;function Ma(a){const e=Math.sin(a);return Math.abs(e)>=De?a:Math.cos(a)>0?De:Math.PI-De}function Ne(a,e,t){const n=a[1],o=a[2],i=xa(n,Ma(o),t),s=je(n,o,t),r=-e.E-e.eps*s.A_t,l=e.L-e.eps*s.A_phi,u=a[4],h=a[5];return .5*(i.gtt*r*r+2*i.gtphi*r*l+i.gphiphi*l*l+i.grr*u*u+i.gthth*h*h)}const Je=.001,Tt=1e-10,At=.01;function ea(a,e,t,n,o){const i=s=>{const r=[...a];return r[n]+=s,Ne(r,e,t)};return(-i(2*o)+8*i(o)-8*i(-o)+i(-2*o))/(12*o)}function kt(a,e,t){const n=a[1],o=a[2],i=xa(n,Ma(o),t),s=je(n,o,t),r=-e.E-e.eps*s.A_t,l=e.L-e.eps*s.A_phi,u=i.gtt*r+i.gtphi*l,h=i.grr*a[4],d=i.gthth*a[5],p=i.gtphi*r+i.gphiphi*l,c=Je*Math.max(1,n),m=Je;return[u,h,d,p,-ea(a,e,t,1,c),-ea(a,e,t,2,m)]}function Pt(a,e,t,n,o=0){const i=t[0]**2+t[1]**2+t[2]**2;if(i>=1)throw new Error(`velocidad local |v| = ${Math.sqrt(i)} >= c`);const s=1/Math.sqrt(1-i),r=Ka(a,e,n),l=s*r.e0[0],u=s*t[0]*r.er[1],h=s*t[1]*r.eth[2],d=s*(r.e0[3]+t[2]*r.ephi[3]),p=Le(a,e,n),c=p.g_tt*l+p.g_tphi*d,m=p.g_rr*u,g=p.g_thth*h,b=p.g_tphi*l+p.g_phiphi*d,v=je(a,e,n);return{y:[0,a,e,0,m,g],k:{E:-(c+o*v.A_t),L:b+o*v.A_phi,eps:o,mu:1}}}function It(a,e,t,n={}){const o=Math.max(n.tol??1e-9,Tt),i=n.maxSteps??2e5,s=n.tauMax??2e3,r=n.stride??1,l=1-t.a*t.a-t.q*t.q,u=l>=0?1+Math.sqrt(l):0,h=n.rCapture??(u>0?u*(1+At):.001),d=n.rEscape??1e4,p=S=>kt(S,e,t),c=Ne(a,e,t);let m=[...a],g=.05,b=0,v=0,f="maxSteps",x=0,M=m[1],T=m[1];const E=[[...m]],R=[0];for(;v<i&&b<s;){const S=Math.max(1e-9,.2*(m[1]-h));g>S&&(g=S);const{y5:P,err:I}=Rt(m,g,p);if(I>o&&g>1e-12){g*=Math.max(.2,.9*Math.pow(o/I,.2));continue}if(m=P,b+=g,v++,M=Math.min(M,m[1]),T=Math.max(T,m[1]),x=Math.max(x,Math.abs(Ne(m,e,t)-c)),v%r===0&&(E.push([...m]),R.push(b)),m[1]<=h){f="captured";break}if(m[1]>=d){f="escaped";break}g*=Math.min(5,.9*Math.pow(o/Math.max(I,1e-18),.2))}return f==="maxSteps"&&b>=s&&(f="complete"),(R.length===0||b>R[R.length-1])&&(E.push([...m]),R.push(b)),{outcome:f,path:E,properTime:R,cartesian:E.map(Ee),steps:v,tau:b,maxHamiltonianDrift:x,rMin:M,rMax:T,phiTotal:m[3]-a[3]}}function Ee(a){const e=a[1],t=a[2],n=a[3];return[e*Math.sin(t)*Math.cos(n),e*Math.sin(t)*Math.sin(n),e*Math.cos(t)]}function aa(a,e){const t=a.path.length;return t<2?0:e==="proper"?a.properTime[t-1]-a.properTime[0]:a.path[t-1][0]-a.path[0][0]}function ta(a,e,t){const n=a.path.length;if(n===0)return null;const o=x=>t==="proper"?a.properTime[x]:a.path[x][0],i=o(0),r=o(n-1)-i,l=Math.min(Math.max(e,0),Math.max(r,0)),u=i+l;let h=0,d=n-1;for(;d-h>1;){const x=h+d>>1;o(x)<=u?h=x:d=x}const p=o(h),c=o(d),m=c>p?(u-p)/(c-p):0,g=a.path[h],b=a.path[d],v=[g[1]+(b[1]-g[1])*m,g[2]+(b[2]-g[2])*m,g[3]+(b[3]-g[3])*m],f=Math.sin(v[1]);return{x:v,cart:[v[0]*f*Math.cos(v[2]),v[0]*f*Math.sin(v[2]),v[0]*Math.cos(v[1])],tau:a.properTime[h]+(a.properTime[d]-a.properTime[h])*m,t:g[0]+(b[0]-g[0])*m,r:v[0],progress:r>0?l/r:1,ended:l>=r}}function Lt(a,e,t){for(let n=1;n<a.path.length;n++){const o=a.path[n-1][1],i=a.path[n][1];if(o>e&&i<=e){const s=(o-e)/(o-i),r=t==="proper"?a.properTime[n-1]:a.path[n-1][0],l=t==="proper"?a.properTime[n]:a.path[n][0],u=t==="proper"?a.properTime[0]:a.path[0][0];return{time:r+(l-r)*s-u,index:n}}}return null}function wt(a){return Ea(Ct(a))}function Ea(a){if(a.length<2)return null;let e=0;for(let n=1;n<a.length;n++)e+=a[n]-a[n-1];const t=e/(a.length-1);return t-2*Math.PI*Math.sign(t)}function Ct(a,e){const t=a.path,n=[];for(let o=1;o<t.length;o++){const i=t[o-1][4],s=t[o][4];if(!(i<0&&s>=0))continue;const l=i/(i-s);n.push(t[o-1][3]+l*(t[o][3]-t[o-1][3]))}return n}function zt(a){const e=a.path,t=[];for(let n=1;n<e.length;n++){const o=Math.cos(e[n-1][2]),i=Math.cos(e[n][2]);if(o>0&&i<=0){const s=o/(o-i);t.push(e[n-1][3]+s*(e[n][3]-e[n-1][3]))}}return Ea(t)}const C=299792458,Se=662607015e-42,Sa=1380649e-29,Dt=Se/(2*Math.PI),we=132712440018e9,na=149597870700,ne=0x6da012f95c9e88;function Xe(a){return we*a/(C*C)}function Ft(a){return Xe(a)/C}const qt=1e7,Bt=10,oa=.1;function Nt(a,e=oa,t=1){return qt*Math.pow(a/Bt,-.25)*Math.pow(e/oa,.25)*t}function Ot(a,e){const t=a/Xe(e)*C*C;return Dt*t/(2*Math.PI*Sa*C)}function Ut(a){return a*(180/Math.PI)*3600*1e6}function Re(a){const e=Math.abs(a);return e<1e3?`${a.toPrecision(4)} m`:e<.01*na?`${(a/1e3).toPrecision(4)} km`:e<.1*ne?`${(a/na).toPrecision(4)} AU`:e<1e3*ne?`${(a/ne).toPrecision(4)} pc`:`${(a/(1e6*ne)).toPrecision(4)} Mpc`}function Fe(a){const e=Math.abs(a);return e<1e-6?`${(a*1e9).toPrecision(3)} ns`:e<.001?`${(a*1e6).toPrecision(3)} µs`:e<1?`${(a*1e3).toPrecision(3)} ms`:e<120?`${a.toPrecision(3)} s`:e<7200?`${(a/60).toPrecision(3)} min`:e<2*86400?`${(a/3600).toPrecision(3)} h`:e<3*365.25*86400?`${(a/86400).toPrecision(3)} d`:`${(a/(365.25*86400)).toPrecision(3)} yr`}function Ht(a){if(a<1e3)return`${a.toPrecision(3)} M☉`;const e=Math.floor(Math.log10(a));return`${(a/Math.pow(10,e)).toFixed(2)}×10${$t(e)} M☉`}const Gt="⁰¹²³⁴⁵⁶⁷⁸⁹";function $t(a){return String(a).split("").map(e=>e==="-"?"⁻":Gt[Number(e)]??e).join("")}function oe(a,e,t,n){const o=(a-e)/(a<e?t:n);return Math.exp(-.5*o*o)}function jt(a){return 1.056*oe(a,599.8,37.9,31)+.362*oe(a,442,16,26.7)-.065*oe(a,501.1,20.4,26.2)}function Xt(a){return .821*oe(a,568.8,46.9,40.5)+.286*oe(a,530.9,16.3,31.1)}function Wt(a){return 1.217*oe(a,437,11.8,36)+.681*oe(a,459,26,13.8)}function Ra(a,e){const t=Math.pow(a,5),n=Se*C/(a*Sa*e);return n>700?2*Se*C*C/t*Math.exp(-n):2*Se*C*C/(t*Math.expm1(n))}function Vt(a){return .002897771955/a}const Ta=360,Aa=830,re=2,X=[[3.2406,-1.5372,-.4986],[-.9689,1.8758,.0415],[.0557,-.204,1.057]];function ge(a){let e=0,t=0,n=0;for(let p=Ta;p<=Aa;p+=re){const c=Ra(p*1e-9,a);e+=c*jt(p),t+=c*Xt(p),n+=c*Wt(p)}e*=re,t*=re,n*=re;const o=e+t+n;if(!(o>0)||!Number.isFinite(o))return{chroma:[1,1,1],visibleRadiance:0};const i=e/t,s=n/t;let r=X[0][0]*i+X[0][1]*1+X[0][2]*s,l=X[1][0]*i+X[1][1]*1+X[1][2]*s,u=X[2][0]*i+X[2][1]*1+X[2][2]*s;const h=Math.min(r,l,u);h<0&&(r-=h,l-=h,u-=h);const d=.2126*r+.7152*l+.0722*u;return d>0&&(r/=d,l/=d,u/=d),{chroma:[r,l,u],visibleRadiance:t}}const ke=2.5,Oe=9,Te=512,ka=1e4;function Kt(){const a=new Float32Array(Te*4),e=ge(ka).visibleRadiance;for(let t=0;t<Te;t++){const n=ke+(Oe-ke)*t/(Te-1),o=ge(Math.pow(10,n)),i=e>0?o.visibleRadiance/e:0;a[t*4+0]=o.chroma[0],a[t*4+1]=o.chroma[1],a[t*4+2]=o.chroma[2],a[t*4+3]=i>0?Math.log10(i):-30}return a}function Yt(a){const e=ge(ka).visibleRadiance,t=ge(Math.max(a,1)).visibleRadiance;return e>0?t/e:0}function Qt(a){let e=0;for(let n=Ta;n<=Aa;n+=re)e+=Ra(n*1e-9,a)*re*1e-9;const t=5670374419e-17*Math.pow(a,4)/Math.PI;return t>0?e/t:0}const xe=6957e5,Zt=6371e3,Jt=69911e3,en=300273e-11,an=95458e-8,Ue={earth:{label:"Tierra",type:"planet",massSolar:en,radiusMeters:Zt,temperatureK:288,albedo:[.25,.42,.75]},jupiter:{label:"Júpiter",type:"planet",massSolar:an,radiusMeters:Jt,temperatureK:165,albedo:[.78,.68,.52]},sun:{label:"Estrella tipo Sol",type:"star",massSolar:1,radiusMeters:xe,temperatureK:5772},redGiant:{label:"Gigante roja",type:"star",massSolar:1.2,radiusMeters:100*xe,temperatureK:3500},blueGiant:{label:"Gigante azul",type:"star",massSolar:20,radiusMeters:8*xe,temperatureK:25e3},s2:{label:"S2 (Sgr A*)",type:"star",massSolar:13.6,radiusMeters:5.5*xe,temperatureK:25e3},whiteDwarf:{label:"Enana blanca",type:"compact",massSolar:.6,radiusMeters:7e6,temperatureK:12e3},neutronStar:{label:"Estrella de neutrones",type:"compact",massSolar:1.4,radiusMeters:12e3,temperatureK:1e6}};function tn(a,e){if(a.massSolar<=0)return 1/0;const t=a.radiusMeters*Math.cbrt(e/a.massSolar),n=we*e/(C*C);return t/n}function nn(a,e,t,n){const o=tn(a,e),i=o<=t;return{rTidal:o,rHorizon:t,disrupts:!i&&n<=o,swallowedWhole:i,reachesTidalRadius:n<=o}}function on(a,e){const t=we*e/(C*C);return a.radiusMeters/t}function ia(a,e){return a.massSolar/e}const sn=.001;function Ce(a){return a.m1+a.m2}function Pa(a){return Math.pow(a.m1*a.m2,.6)/Math.pow(a.m1+a.m2,.2)}function Ia(a){return a.a*(1-a.e*a.e)/(1+a.e*Math.cos(a.nu))}function rn(a){const e=Ia(a),t=Ce(a),n=e*Math.cos(a.nu),o=e*Math.sin(a.nu),i=-a.m2/t,s=a.m1/t;return{p1:[i*n,i*o,0],p2:[s*n,s*o,0]}}function ln(a){const e=Ce(a),t=a.e*a.e,n=Math.max(1-t,1e-12),o=1+73*t/24+37*t*t/96;return-64/5*(a.m1*a.m2*e/Math.pow(a.a,3))*Math.pow(n,-3.5)*o}function cn(a){const e=Ce(a),t=a.e*a.e,n=Math.max(1-t,1e-12);return-304/15*a.e*(a.m1*a.m2*e/Math.pow(a.a,4))*Math.pow(n,-2.5)*(1+121*t/304)}const ye=6;function dn(a,e){if(a.a<=ye)return{orbit:a,merged:!0};const t=m=>({da:ln(m),de:cn(m)}),n=(m,g,b)=>({...m,a:Math.max(m.a+g*b.da,ye*.5),e:Math.min(Math.max(m.e+g*b.de,0),.999)}),o=t(a),i=t(n(a,e/2,o)),s=t(n(a,e/2,i)),r=t(n(a,e,s)),l=a.a+e/6*(o.da+2*i.da+2*s.da+r.da),u=a.e+e/6*(o.de+2*i.de+2*s.de+r.de),h=Ia(a),p=Math.sqrt(Ce(a)*a.a*Math.max(1-a.e*a.e,1e-12))/(h*h)*e,c={m1:a.m1,m2:a.m2,a:Math.max(l,ye*.5),e:Math.min(Math.max(u,0),.999),nu:a.nu+p};return{orbit:c,merged:c.a<=ye}}function La(a){return we*a/(C*C*C)}function We(a,e){return Math.sqrt(1/(a*a*a))/(2*Math.PI*La(e))}function un(a,e,t){const n=La(Pa({m1:e,m2:t}));return 5/256*Math.pow(Math.PI*a,-8/3)*Math.pow(n,-5/3)}function hn(a,e){return 2*We(6,a+e)}function Ve(a,e){const t=e.a,n=H(a,e),o=a-1,i=((a*a+t*t)*o-2*a*n)/(t*o),s=4*a*a*n/(o*o)-(i-t)*(i-t);return{xi:i,eta:s}}function pn(a,e,t){const{xi:n,eta:o}=Ve(a,t),i=Math.sin(e),s=Math.cos(e);if(Math.abs(i)<1e-9){if(Math.abs(n)>1e-6)return null;const u=o+t.a*t.a;return u<0?null:{alpha:Math.sqrt(u),beta:0}}const r=-n/i,l=o+t.a*t.a*s*s-n*n*s*s/(i*i);return l<0?null:{alpha:r,beta:Math.sqrt(l)}}function mn(a,e,t=512){const n=u=>{const h=[];for(let d=0;d<=t;d++){const p=Math.PI*d/t;h.push({alpha:u*Math.cos(p),beta:u*Math.sin(p)})}return h};if(Math.abs(a.a)<1e-7)return n(Ke(a));if(Math.abs(Math.sin(e))<1e-6)return n(bn(a));const o=ie(a,!0),i=ie(a,!1),s=Math.min(o,i),r=Math.max(o,i),l=[];for(let u=0;u<=t;u++){const h=s+(r-s)*u/t,d=pn(h,e,a);d&&l.push(d)}return l}function Ke(a){const e=(3+Math.sqrt(9-8*a.q*a.q))/2,t=H(e,a),n=e-1;return Math.sqrt(4*e*e*t/(n*n))}function wa(a,e,t=1024){const n=mn(a,e,t);if(n.length===0)return{rMax:NaN,rMin:NaN,rAreal:NaN,centroidAlpha:NaN,asymmetry:NaN};const o=[...n,...n.slice(0,-1).reverse().map(d=>({alpha:d.alpha,beta:-d.beta}))];let i=0,s=0;for(let d=0;d<o.length;d++){const p=o[d],c=o[(d+1)%o.length],m=p.alpha*c.beta-c.alpha*p.beta;i+=m,s+=(p.alpha+c.alpha)*m}const r=Math.abs(i/2),l=i!==0?s/(3*i):0;let u=-1/0,h=1/0;for(const d of o){const p=Math.hypot(d.alpha-l,d.beta);p>u&&(u=p),p<h&&(h=p)}return{rMax:u,rMin:h,rAreal:Math.sqrt(r/Math.PI),centroidAlpha:l,asymmetry:(u-h)/(u+h)}}function fn(a,e,t=Math.PI/2){const n=Math.abs(e.a)<1e-7?Ke(e):wa(e,t,256).rAreal,o=1-2/a+e.q*e.q/(a*a);if(o<=0)return NaN;const i=n/a*Math.sqrt(o);return i>=1?Math.PI/2:Math.asin(i)}function gn(a){if(Math.abs(a.a)<1e-9)return(3+Math.sqrt(9-8*a.q*a.q))/2;const e=ie(a,!0),t=ie(a,!1);return va(n=>Ve(n,a).xi,Math.min(e,t),Math.max(e,t),2048)}function bn(a){if(Math.abs(a.a)<1e-7)return Ke(a);const e=gn(a);if(!Number.isFinite(e))return NaN;const{eta:t}=Ve(e,a),n=t+a.a*a.a;return n<0?NaN:Math.sqrt(n)}const vn=.05;function xn(a,e){let t=1;for(const n of e){const o=a[0]-n.pos[0],i=a[1]-n.pos[1],s=a[2]-n.pos[2],r=Math.sqrt(o*o+i*i+s*s);t+=n.m/(2*Math.max(r,1e-9))}return t}function Pe(a){return a/2}function yn(a,e=4e3){if(a.length<2)return 0;const[t,n]=a,o=[n.pos[0]-t.pos[0],n.pos[1]-t.pos[1],n.pos[2]-t.pos[2]],i=Math.hypot(o[0],o[1],o[2]);if(i===0)return 0;const s=Math.min(.45,Pe(t.m)/i),r=Math.max(.55,1-Pe(n.m)/i);let l=0;const u=(r-s)/e;for(let h=0;h<e;h++){const d=s+(h+.5)*u,p=[t.pos[0]+d*o[0],t.pos[1]+d*o[1],t.pos[2]+d*o[2]],c=xn(p,a);l+=c*c*u*i}return l}function Ca(a,e=20,t=600){const n=ee(a),o=n.hasHorizon?n.rPlus:.001,i=c=>Math.sqrt(he(c,Math.PI/2,a))/c,s=c=>{const m=1e-6*Math.max(1,c);return(i(c+m)-i(c-m))/(2*m)},r=[];let l=NaN;const u=[];for(let c=0;c<=t;c++){const m=c/t;u.push(o*(1+1e-9)+(e-o)*m*m)}let h=0;const d=new Array(u.length).fill(0);for(let c=u.length-1;c>0;c--){const m=u[c],g=u[c-1],b=m-g,v=.5*(m+g),f=s(v),x=v*v/H(v,a)-f*f;if(x<0){Number.isNaN(l)&&(l=v),d[c-1]=h;continue}h-=Math.sqrt(x)*b,d[c-1]=h}const p=Math.min(...d);for(let c=0;c<u.length;c++)r.push({r:u[c],R:i(u[c]),z:d[c]-p});return{points:r,embeddingFailsBelow:l,depth:r.length?r[r.length-1].z:0}}function za(a,e=400){const t=ee(a),n=[];if(!t.hasHorizon)return{profile:n,fails:!1,failCapAngle:NaN,area:NaN};const o=t.rPlus,i=a.a*a.a,s=o*o+i,r=p=>o*o+i*Math.cos(p)*Math.cos(p),l=p=>s*Math.sin(p)/Math.sqrt(r(p));let u=!1,h=0,d=0;for(let p=0;p<=e;p++){const c=Math.PI*p/e,m=l(c);if(n.push({theta:c,R:m,z:d}),p<e){const g=Math.PI*(p+1)/e,b=g-c,v=.5*(c+g),f=1e-7,x=(l(v+f)-l(v-f))/(2*f),M=r(v)-x*x;if(M<0){u=!0,h=Math.max(h,Math.min(v,Math.PI-v));continue}d+=Math.sqrt(M)*b}}return{profile:n,fails:u,failCapAngle:u?h:NaN,area:4*Math.PI*s}}function Da(a,e){const t=(H(a,e)-e.a*e.a)/(a*a);return t<=0?NaN:Math.sqrt(t)}function _n(a,e){const t=H(a,e);return t<=0?1/0:a/Math.sqrt(t)}function Mn(a,e,t,n=4e3){const o=Math.min(a,e),s=(Math.max(a,e)-o)/n;let r=0;for(let l=0;l<n;l++){const u=o+(l+.5)*s,h=_n(u,t);if(!Number.isFinite(h))return 1/0;r+=h*s}return r}const Ie=.998,q={mode:"single",binaryMassRatio:.55,binarySeparation:40,binaryEccentricity:0,binaryEvolving:!1,binaryTimeScale:1,binaryShowGrid:!0,chirpAudio:!1,meshShowSurface:!0,meshShowLapse:!0,meshOuterRadius:18,meshHeightScale:1,meshGridDensity:1,meshShowHorizon:!1,massSolar:65e8,spin:.9,charge:0,distanceRg:60,distanceMeters:523e21,distanceMode:"rg",inclination:78*Math.PI/180,azimuth:0,fov:40*Math.PI/180,diskEnabled:!0,diskOuter:18,eddingtonRatio:.1,diskOpacity:1,diskTurbulence:!0,diskPrograde:!0,timeWarp:0,starsEnabled:!0,starIntensity:1,starDensity:.5,milkyWayIntensity:.35,galaxyCount:0,galaxyBrightness:1,galaxySize:.06,galaxySpiral:1,galaxyAlignBehind:!0,bodyKind:"sun",bodyClock:"proper",bodyPlaying:!0,bodySpeed:40,bodyLoop:!0,showHorizon:!1,showErgosphere:!1,showPhotonSphere:!1,showIsco:!1,showDragGrid:!1,dragGridRadius:8,layerOpacity:.8,showOrbits:!0,orbitOpacity:.9,orbitLaunchRadius:14,orbitInclination:25*Math.PI/180,orbitSpeedFraction:.97,orbitCharge:0,orbitPrograde:!0,orbitRevolutions:6,renderScale:1,interactiveScale:.4,maxIter:900,tolerance:1e-5,rEscape:300,targetSamples:192,exposure:1,autoExposure:!0,bloomEnabled:!0,bloomStrength:.55,bloomThreshold:1,markNonConverged:!1,autoQuality:!0};function sa(a){const e={a:a.spin,q:a.charge},t=ee(e),n=a.diskPrograde,o=Be(e,!0),i=Be(e,!1),s=n?o:i,r=Xe(a.massSolar),l=a.distanceMode==="rg"?a.distanceRg:Math.max(a.distanceMeters/r,2.2),u=Va(e),h=wa(e,a.inclination,256),d=Nt(a.massSolar,a.eddingtonRatio),p=Ft(a.massSolar),c=Math.min(Math.max(a.binaryMassRatio,.02),.98),m=1-c,g=Pa({m1:c,m2:m}),b=g*a.massSolar,v=We(a.binarySeparation,a.massSolar)*2,f=hn(c*a.massSolar,m*a.massSolar),x=v>0&&v<f?un(v,c*a.massSolar,m*a.massSolar):0,M=[{m:c,pos:[-m*a.binarySeparation,0,0]},{m,pos:[c*a.binarySeparation,0,0]}],T=Ca(e,a.meshOuterRadius,240),E=za(e,400),R=1/(Math.pow(s,1.5)+(n?e.a:-e.a)),S=2*Math.PI/Math.abs(R)*p;return{bh:e,extremality:e.a*e.a+e.q*e.q,hasHorizon:t.hasHorizon,isExtremal:t.isExtremal,rPlus:t.rPlus,rMinus:t.rMinus,rErgoEquator:Ze(Math.PI/2,e),rErgoPole:Ze(0,e),rPhotonPrograde:ie(e,!0),rPhotonRetrograde:ie(e,!1),rIscoPrograde:o,rIscoRetrograde:i,rDiskInner:s,surfaceGravity:u,hawkingTempK:Number.isFinite(u)?Ot(u,a.massSolar):NaN,efficiency:Za(e,n),shadowArealRadius:h.rAreal,shadowAsymmetry:h.asymmetry,shadowAngularRad:fn(l,e,a.inclination),rgMeters:r,tgSeconds:p,camDistanceRg:l,camLapse:ya(l,a.inclination,e),camOmega:Ge(l,a.inclination,e),diskTempMaxK:d,iscoPeriodSeconds:S,rCapture:Ja(e),binaryM1:c,binaryM2:m,chirpMassGeom:g,chirpMassSolar:b,gwFrequencyHz:v,mergerTimeSeconds:x,cutoffFrequencyHz:f,binaryProperSeparation:yn(M,800),binaryR1:Pe(c),binaryR2:Pe(m),meshDepth:T.depth,horizonEmbeddingFails:E.fails,properDistanceToTen:t.hasHorizon?Mn(t.rPlus*(1+1e-6),10,e,2e3):NaN}}class En{params;derived;listeners=new Set;constructor(e=q){this.params={...e},this.derived=sa(this.params)}get(){return this.params}getDerived(){return this.derived}patch(e){let t=!1;for(const[n,o]of Object.entries(e))this.params[n]!==o&&(this.params[n]=o,t=!0);if(t){this.clampSpin(),this.derived=sa(this.params);for(const n of this.listeners)n(this.params,this.derived)}}clampSpin(){this.params.spin=Math.max(-Ie,Math.min(Ie,this.params.spin)),this.params.charge=Math.max(0,Math.min(1.4,this.params.charge))}subscribe(e){return this.listeners.add(e),e(this.params,this.derived),()=>this.listeners.delete(e)}}const Sn={minDistance:2.2,maxDistance:4e3,rotateSpeed:.006,damping:.86},ra=.02;class Rn{constructor(e,t,n){this.canvas=e,this.opts={...Sn,...n},this.state={...t},this.attach()}opts;state;velIncl=0;velAzim=0;velZoom=0;dragging=!1;pointers=new Map;lastPinchDist=0;lastX=0;lastY=0;idleFrames=0;disposed=!1;detach=[];get(){return this.state}set(e,t=!0){Object.assign(this.state,e),this.clamp(),t&&(this.velIncl=0,this.velAzim=0,this.velZoom=0),this.opts.onChange(this.state,!1)}setDistanceLimits(e,t){this.opts.minDistance=e,this.opts.maxDistance=t,this.clamp()}get isInteracting(){return this.dragging||this.idleFrames<2}attach(){const e=this.canvas,t=r=>{e.setPointerCapture(r.pointerId),this.pointers.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.pointers.size===1?(this.dragging=!0,this.lastX=r.clientX,this.lastY=r.clientY,this.velIncl=0,this.velAzim=0):this.pointers.size===2&&(this.lastPinchDist=this.pinchDistance()),e.style.cursor="grabbing"},n=r=>{if(!this.pointers.has(r.pointerId))return;if(this.pointers.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.pointers.size>=2){const h=this.pinchDistance();if(this.lastPinchDist>0&&h>0){const d=this.lastPinchDist/h;this.state.distance*=d,this.clamp(),this.emit(!0)}this.lastPinchDist=h;return}if(!this.dragging)return;const l=r.clientX-this.lastX,u=r.clientY-this.lastY;this.lastX=r.clientX,this.lastY=r.clientY,this.velAzim=-l*this.opts.rotateSpeed,this.velIncl=-u*this.opts.rotateSpeed,this.state.azimuth+=this.velAzim,this.state.inclination+=this.velIncl,this.clamp(),this.emit(!0)},o=r=>{this.pointers.delete(r.pointerId),e.hasPointerCapture(r.pointerId)&&e.releasePointerCapture(r.pointerId),this.pointers.size===0&&(this.dragging=!1,e.style.cursor="grab"),this.pointers.size<2&&(this.lastPinchDist=0)},i=r=>{r.preventDefault();const l=r.deltaMode===1?16:r.deltaMode===2?100:1;this.velZoom+=r.deltaY*l/900},s=r=>r.preventDefault();e.addEventListener("pointerdown",t),e.addEventListener("pointermove",n),e.addEventListener("pointerup",o),e.addEventListener("pointercancel",o),e.addEventListener("wheel",i,{passive:!1}),e.addEventListener("contextmenu",s),e.style.cursor="grab",e.style.touchAction="none",this.detach=[()=>e.removeEventListener("pointerdown",t),()=>e.removeEventListener("pointermove",n),()=>e.removeEventListener("pointerup",o),()=>e.removeEventListener("pointercancel",o),()=>e.removeEventListener("wheel",i),()=>e.removeEventListener("contextmenu",s)]}update(){if(this.disposed)return!1;let e=!1;return!this.dragging&&(Math.abs(this.velIncl)>1e-6||Math.abs(this.velAzim)>1e-6)&&(this.state.azimuth+=this.velAzim,this.state.inclination+=this.velIncl,this.velAzim*=this.opts.damping,this.velIncl*=this.opts.damping,e=!0),Math.abs(this.velZoom)>1e-5&&(this.state.distance*=Math.exp(this.velZoom),this.velZoom*=this.opts.damping,e=!0),e?(this.clamp(),this.emit(!0),this.idleFrames=0):this.dragging?this.idleFrames=0:this.idleFrames++,e}emit(e){this.idleFrames=0,this.opts.onChange(this.state,e)}pinchDistance(){const e=[...this.pointers.values()];return e.length<2?0:Math.hypot(e[0].x-e[1].x,e[0].y-e[1].y)}clamp(){this.state.inclination=Math.max(ra,Math.min(Math.PI-ra,this.state.inclination)),this.state.distance=Math.max(this.opts.minDistance,Math.min(this.opts.maxDistance,this.state.distance));const e=Math.PI*2;this.state.azimuth=(this.state.azimuth%e+e)%e}dispose(){this.disposed=!0;for(const e of this.detach)e();this.detach=[]}}function Fa(a,e){const t=1-a*a-e*e,n=t>=0?1+Math.sqrt(t):0;return Math.max(2.2,n*1.35)}function Tn(a){const e=!!a.getExtension("EXT_color_buffer_float"),t=!!a.getExtension("OES_texture_float_linear"),n=a.getExtension("WEBGL_debug_renderer_info"),o=n?String(a.getParameter(n.UNMASKED_RENDERER_WEBGL)):"desconocido";return{colorBufferFloat:e,floatLinear:t,maxTextureSize:a.getParameter(a.MAX_TEXTURE_SIZE),renderer:o}}function la(a,e,t,n){const o=a.createShader(e);if(a.shaderSource(o,t),a.compileShader(o),!a.getShaderParameter(o,a.COMPILE_STATUS)){const i=a.getShaderInfoLog(o)??"";throw a.deleteShader(o),new Error(`Error compilando ${n}:
${i}
${An(t,i)}`)}return o}function An(a,e){const t=new Set;for(const i of e.matchAll(/:(\d+):/g))t.add(Number(i[1]));if(t.size===0)return"";const n=a.split(`
`),o=[];for(const i of[...t].sort((s,r)=>s-r)){for(let s=Math.max(1,i-2);s<=Math.min(n.length,i+2);s++)o.push(`${s===i?">":" "} ${String(s).padStart(4)} | ${n[s-1]}`);o.push("")}return o.join(`
`)}class le{constructor(e,t,n,o){this.gl=e,this.label=o;const i=la(e,e.VERTEX_SHADER,t,`${o} (vertex)`),s=la(e,e.FRAGMENT_SHADER,n,`${o} (fragment)`),r=e.createProgram();if(e.attachShader(r,i),e.attachShader(r,s),e.linkProgram(r),e.deleteShader(i),e.deleteShader(s),!e.getProgramParameter(r,e.LINK_STATUS)){const l=e.getProgramInfoLog(r);throw e.deleteProgram(r),new Error(`Error enlazando ${o}: ${l}`)}this.handle=r}handle;locs=new Map;use(){this.gl.useProgram(this.handle)}loc(e){let t=this.locs.get(e);return t===void 0&&(t=this.gl.getUniformLocation(this.handle,e),this.locs.set(e,t)),t}f(e,t){const n=this.loc(e);n&&this.gl.uniform1f(n,t)}i(e,t){const n=this.loc(e);n&&this.gl.uniform1i(n,t)}b(e,t){const n=this.loc(e);n&&this.gl.uniform1i(n,t?1:0)}v2(e,t,n){const o=this.loc(e);o&&this.gl.uniform2f(o,t,n)}v3(e,t,n,o){const i=this.loc(e);i&&this.gl.uniform3f(i,t,n,o)}v4(e,t,n,o,i){const s=this.loc(e);s&&this.gl.uniform4f(s,t,n,o,i)}tex(e,t,n,o){const i=this.gl;i.activeTexture(i.TEXTURE0+t),i.bindTexture(n,o),this.i(e,t)}dispose(){this.gl.deleteProgram(this.handle)}}function kn(a,e,t,n,o,i=a.LINEAR){const s=a.createTexture();a.bindTexture(a.TEXTURE_2D,s),a.texImage2D(a.TEXTURE_2D,0,n,e,t,0,a.RGBA,o,null),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,i),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,i),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE);const r=a.createFramebuffer();a.bindFramebuffer(a.FRAMEBUFFER,r),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,s,0);const l=a.checkFramebufferStatus(a.FRAMEBUFFER);if(a.bindFramebuffer(a.FRAMEBUFFER,null),l!==a.FRAMEBUFFER_COMPLETE)throw new Error(`Framebuffer incompleto (0x${l.toString(16)})`);return{fbo:r,tex:s,width:e,height:t}}function Q(a,e){e&&(a.deleteFramebuffer(e.fbo),a.deleteTexture(e.tex))}function Pn(a,e,t){const n=a.createTexture();return a.bindTexture(a.TEXTURE_2D,n),a.texImage2D(a.TEXTURE_2D,0,a.RGBA16F,t,1,0,a.RGBA,a.FLOAT,e),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),n}function In(a){const e=a.createTexture();a.bindTexture(a.TEXTURE_CUBE_MAP,e);const t=new Uint8Array([0,0,0,255]),n=[a.TEXTURE_CUBE_MAP_POSITIVE_X,a.TEXTURE_CUBE_MAP_NEGATIVE_X,a.TEXTURE_CUBE_MAP_POSITIVE_Y,a.TEXTURE_CUBE_MAP_NEGATIVE_Y,a.TEXTURE_CUBE_MAP_POSITIVE_Z,a.TEXTURE_CUBE_MAP_NEGATIVE_Z];for(const o of n)a.texImage2D(o,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,t);return a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_CUBE_MAP,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),e}function _e(a,e){let t=1,n=0,o=a;for(;o>0;)t/=e,n+=t*(o%e),o=Math.floor(o/e);return n}const Ln=`#version 300 es
precision highp float;

// Lineas del overlay de orbitas. La proyeccion se hace en CPU (son unos pocos
// miles de puntos), asi que aqui llegan ya en NDC: el shader solo transporta.

layout(location = 0) in vec2 aPos;   // NDC, [-1, 1]
layout(location = 1) in float aFade; // 0 = oculto por el agujero, 1 = visible

out float vFade;

void main() {
  vFade = aFade;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,wn=`#version 300 es
precision highp float;

uniform vec3 u_color;
uniform float u_opacity;

in float vFade;
out vec4 fragColor;

void main() {
  float a = u_opacity * vFade;
  if (a <= 0.002) discard;
  // Se emite premultiplicado y se compone con blending aditivo sobre la imagen ya
  // tonemapeada, de modo que las lineas no oscurezcan lo que hay detras.
  fragColor = vec4(u_color * a, a);
}
`;class Cn{constructor(e){this.gl=e,this.prog=new le(e,Ln,wn,"overlay de orbitas"),this.vao=e.createVertexArray(),this.vbo=e.createBuffer(),e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,this.vbo),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,12,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,1,e.FLOAT,!1,12,8),e.bindVertexArray(null)}prog;vao;vbo;traces=[];nextId=1;scratch=new Float32Array(0);get list(){return this.traces}add(e){const t={...e,id:this.nextId++};return this.traces.push(t),t}clear(){this.traces=[]}remove(e){this.traces=this.traces.filter(t=>t.id!==e)}get isEmpty(){return this.traces.length===0}advance(e,t,n){let o=!1;for(const i of this.traces){if(!i.body)continue;const s=t==="proper"?i.body.durationProper:i.body.durationCoordinate;s<=0||(i.body.time+=e,i.body.time>=s&&(i.body.time=n?i.body.time%s:s),o=!0)}return o}rewind(){for(const e of this.traces)e.body&&(e.body.time=0)}bodyStates(e){const t=[];for(const n of this.traces){if(!n.body)continue;const o=ta(n.body.result,n.body.time,e);o&&t.push({trace:n,snap:o,disrupted:Number.isFinite(n.body.tidalRg)&&o.r<=n.body.tidalRg})}return t}draw(e,t,n,o="proper"){if(this.traces.length===0||n<=0)return;const i=this.gl,s=Math.sin(e.theta),r=Math.cos(e.theta),l=Math.sin(e.phi),u=Math.cos(e.phi),h=[e.r*s*u,e.r*s*l,e.r*r],d=[s*u,s*l,r],p=[r*u,r*l,-s],c=[-l,u,0],m=ee(t),g=m.hasHorizon?m.rPlus:0;i.bindVertexArray(this.vao),i.enable(i.BLEND),i.blendFunc(i.ONE,i.ONE_MINUS_SRC_ALPHA),this.prog.use(),this.prog.f("u_opacity",n);for(const b of this.traces){const v=b.points.length;if(v<2)continue;this.scratch.length<v*3&&(this.scratch=new Float32Array(v*3));const f=this.scratch;let x=0;for(let M=0;M<v;M++){const T=b.points[M],E=T[0]-h[0],R=T[1]-h[1],S=T[2]-h[2],P=E*d[0]+R*d[1]+S*d[2],I=E*p[0]+R*p[1]+S*p[2],$=E*c[0]+R*c[1]+S*c[2],G=-P;if(G<=1e-6){f[x*3]=0,f[x*3+1]=0,f[x*3+2]=0,x++;continue}const j=$/(G*e.tanHalfFov*e.aspect),N=-I/(G*e.tanHalfFov);let ae=1;if(g>0){const se=T[0]-h[0],O=T[1]-h[1],B=T[2]-h[2],pe=se*se+O*O+B*B;if(pe>1e-12){const Y=-(h[0]*se+h[1]*O+h[2]*B)/pe;if(Y>0&&Y<1){const me=h[0]+Y*se,ve=h[1]+Y*O,Qe=h[2]+Y*B,ja=Math.sqrt(me*me+ve*ve+Qe*Qe);ae=Math.min(1,Math.max(0,(ja-g)/(.6*g)))}}}f[x*3]=j,f[x*3+1]=N,f[x*3+2]=ae,x++}i.bindBuffer(i.ARRAY_BUFFER,this.vbo),i.bufferData(i.ARRAY_BUFFER,f.subarray(0,x*3),i.DYNAMIC_DRAW),this.prog.v3("u_color",b.color[0],b.color[1],b.color[2]),i.drawArrays(i.LINE_STRIP,0,x)}for(const b of this.traces){if(!b.body)continue;const v=ta(b.body.result,b.body.time,o);v&&this.drawBodyMarker(b,v,h,d,p,c,e,g)}i.disable(i.BLEND),i.bindVertexArray(null)}drawBodyMarker(e,t,n,o,i,s,r,l){const u=this.gl,h=e.body,d=t.cart,p=d[0]-n[0],c=d[1]-n[1],m=d[2]-n[2],g=p*o[0]+c*o[1]+m*o[2],b=p*i[0]+c*i[1]+m*i[2],v=p*s[0]+c*s[1]+m*s[2],f=-g;if(f<=1e-6)return;const x=v/(f*r.tanHalfFov*r.aspect),M=-b/(f*r.tanHalfFov);let T=1;if(l>0){const O=p*p+c*c+m*m;if(O>1e-12){const B=-(n[0]*p+n[1]*c+n[2]*m)/O;if(B>0&&B<1){const pe=n[0]+B*p,Y=n[1]+B*c,me=n[2]+B*m,ve=Math.sqrt(pe*pe+Y*Y+me*me);T=Math.min(1,Math.max(0,(ve-l)/(.6*l)))}}}if(T<=.01)return;const E=Math.sqrt(p*p+c*c+m*m),R=Math.atan(h.radiusRg/Math.max(E,1e-6)),S=Math.max(R/r.tanHalfFov,.012),I=Number.isFinite(h.tidalRg)&&t.r<=h.tidalRg?[1,.28,.2]:h.bodyColor,$=28,G=($+1+5)*3;this.scratch.length<G&&(this.scratch=new Float32Array(G));const j=this.scratch;let N=0;for(let O=0;O<=$;O++){const B=2*Math.PI*O/$;j[N*3]=x+S*Math.cos(B)*(1/r.aspect),j[N*3+1]=M+S*Math.sin(B),j[N*3+2]=T,N++}u.bindBuffer(u.ARRAY_BUFFER,this.vbo),u.bufferData(u.ARRAY_BUFFER,j.subarray(0,N*3),u.DYNAMIC_DRAW),this.prog.v3("u_color",I[0],I[1],I[2]),u.drawArrays(u.LINE_STRIP,0,N);const ae=S*.55,se=[x-ae/r.aspect,M,T,x+ae/r.aspect,M,T,x,M-ae,T,x,M+ae,T];u.bufferData(u.ARRAY_BUFFER,new Float32Array(se),u.DYNAMIC_DRAW),u.drawArrays(u.LINES,0,4)}dispose(){this.gl.deleteBuffer(this.vbo),this.gl.deleteVertexArray(this.vao),this.prog.dispose()}}function zn(a,e=4e3){const t=a.path;if(t.length<=e)return t.map(Ee);const n=Math.ceil(t.length/e),o=[];for(let i=0;i<t.length;i+=n)o.push(Ee(t[i]));return o.push(Ee(t[t.length-1])),o}const Dn=`#version 300 es
precision highp float;

// Malla del espaciotiempo: lineas en NDC con color por vertice.
// La proyeccion se hace en CPU (unos pocos miles de vertices), asi que aqui llegan
// ya proyectadas.

layout(location = 0) in vec2 aPos;   // NDC
layout(location = 1) in vec3 aColor; // color lineal por vertice
layout(location = 2) in float aFade; // profundidad/atenuacion

out vec3 vColor;
out float vFade;

void main() {
  vColor = aColor;
  vFade = aFade;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,Fn=`#version 300 es
precision highp float;

uniform float u_opacity;

in vec3 vColor;
in float vFade;
out vec4 fragColor;

/** Codificacion sRGB: se dibuja directamente al canvas, sin pasar por el tonemap. */
vec3 linearToSrgb(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  float a = u_opacity * vFade;
  if (a <= 0.002) discard;
  fragColor = vec4(linearToSrgb(vColor) * a, a);
}
`;class qn{constructor(e){this.gl=e,this.prog=new le(e,Dn,Fn,"malla del espaciotiempo"),this.vao=e.createVertexArray(),this.vbo=e.createBuffer(),e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,this.vbo);const t=24;e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,t,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,t,8),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,t,20),e.bindVertexArray(null)}prog;vao;vbo;data=new Float32Array(0);cache=null;lapseColor(e){if(!Number.isFinite(e))return[.75,.15,.6];const t=Math.min(Math.max(e,0),1),n=Math.pow(t,1.6),o=.25*t+.75*Math.pow(t,2.2),i=.55+.45*Math.pow(t,.6)-.55*Math.pow(t,3);return[.25+.75*n,.3+.7*o,i]}ensure(e,t){const n=`${e.a}|${e.q}|${t.meshOuterRadius}`;if(this.cache?.key===n)return this.cache;const o=Ca(e,t.meshOuterRadius,220),i=ee(e).rPlus;return this.cache={key:n,emb:o,lapseAt:s=>Da(s,e),rPlus:i},this.cache}draw(e,t,n){const o=this.gl,{emb:i,lapseAt:s}=this.ensure(t,n);if(i.points.length<2)return;const r=Math.sin(e.inclination),l=Math.cos(e.inclination),u=Math.sin(e.azimuth),h=Math.cos(e.azimuth),d=[e.distance*r*h,e.distance*l,e.distance*r*u],p=da([-d[0],-d[1],-d[2]]),c=da(ca([0,1,0],p)),m=ca(p,c),g=E=>{const R=[E[0]-d[0],E[1]-d[1],E[2]-d[2]],S=qe(R,p);if(S<=.05)return null;const P=qe(R,c),I=qe(R,m);return{ndc:[P/(S*e.tanHalfFov*e.aspect),I/(S*e.tanHalfFov)],fade:Math.min(1,Math.max(.12,2.2/(1+S/e.distance)))}},b=[],v=(E,R)=>{if(!R)return;const S=g(R.p),P=g(E.p);!S||!P||(b.push([S.ndc[0],S.ndc[1],R.color[0],R.color[1],R.color[2],S.fade]),b.push([P.ndc[0],P.ndc[1],E.color[0],E.color[1],E.color[2],P.fade]))},f=Math.max(8,Math.round(28*n.meshGridDensity)),x=n.meshHeightScale,M=Math.max(1,Math.round(4/n.meshGridDensity)),T=(E,R)=>{const S=i.points[E],P=2*Math.PI*R/f,I=n.meshShowLapse?this.lapseColor(s(S.r)):[.55,.68,.95];return{p:[S.R*Math.cos(P),S.z*x,S.R*Math.sin(P)],color:I}};if(n.meshShowSurface){for(let R=0;R<f;R++){let S=null;for(let P=0;P<i.points.length;P+=M){const I=T(P,R);v(I,S),S=I}}const E=Math.max(4,Math.round(14/n.meshGridDensity));for(let R=0;R<i.points.length;R+=E){let S=null;for(let P=0;P<=f;P++){const I=T(R,P%f);v(I,S),S=I}}}if(n.meshShowHorizon){const E=za(t,120),R=E.fails?[1,.35,.5]:[.9,.55,.2],S=0;for(let P=0;P<f;P+=2){let I=null;for(let $=0;$<E.profile.length;$+=3){const G=E.profile[$],j=2*Math.PI*P/f,N={p:[G.R*Math.cos(j),(S+G.z)*x,G.R*Math.sin(j)],color:R};v(N,I),I=N}}}if(b.length!==0){this.data.length<b.length*6&&(this.data=new Float32Array(b.length*6));for(let E=0;E<b.length;E++)this.data.set(b[E],E*6);o.bindVertexArray(this.vao),o.bindBuffer(o.ARRAY_BUFFER,this.vbo),o.bufferData(o.ARRAY_BUFFER,this.data.subarray(0,b.length*6),o.DYNAMIC_DRAW),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),this.prog.use(),this.prog.f("u_opacity",1),o.drawArrays(o.LINES,0,b.length),o.disable(o.BLEND),o.bindVertexArray(null)}}dispose(){this.gl.deleteBuffer(this.vbo),this.gl.deleteVertexArray(this.vao),this.prog.dispose()}}function qe(a,e){return a[0]*e[0]+a[1]*e[1]+a[2]*e[2]}function ca(a,e){return[a[1]*e[2]-a[2]*e[1],a[2]*e[0]-a[0]*e[2],a[0]*e[1]-a[1]*e[0]]}function da(a){const e=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/e,a[1]/e,a[2]/e]}const Me=`#version 300 es
precision highp float;

out vec2 vUv;

/**
 * Triangulo a pantalla completa sin buffers de vertices: los tres vertices
 * (-1,-1), (3,-1), (-1,3) cubren el cuadrado [-1,1]^2 con un solo triangulo,
 * que ahorra el vertice extra y la costura diagonal de dos triangulos.
 */
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`,Bn=`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

// ---------------------------------------------------------------------------
// Trazador de geodesicas nulas de Kerr-Newman.
//
// Un rayo por pixel, integrado hacia atras desde la camara con Cash-Karp 4(5)
// adaptativo. La sombra, el anillo de fotones, los anillos de Einstein, el
// beaming Doppler y el corrimiento gravitacional no se dibujan: salen de la
// integracion. Ver README para las relaciones que valida la suite de tests.
// ---------------------------------------------------------------------------

// ---- begin metric.glsl ----
// ---------------------------------------------------------------------------
// Metrica de Kerr-Newman y flujo hamiltoniano de geodesicas nulas.
//
// Replica exactamente \`src/physics/kerrNewman.ts\` y \`src/physics/geodesic.ts\`.
// Cualquier cambio aqui debe reflejarse alli: son las dos implementaciones que
// compara el test de paridad, y la de CPU es la que esta validada contra
// resultados analiticos.
//
// Formulacion (ver geodesic.ts para la derivacion completa):
//   2 Sigma H = Delta p_r^2 + p_theta^2 + F
//   F = -U^2/Delta + w^2,   U = (r^2+a^2)E - aL,   w = aE sin(th) - L/sin(th)
// El estado integrado es (r, theta, phi, p_r, p_theta); E y L son constantes.
// ---------------------------------------------------------------------------

uniform float u_a; // a = J/M^2
uniform float u_q; // q = Q/M

const float SIN_EPS = 1e-6;

/** Estado de un rayo: x = (r, theta, phi), p = (p_r, p_theta). */
struct State {
  vec3 x;
  vec2 p;
};

float knDelta(float r) {
  return r * r - 2.0 * r + u_a * u_a + u_q * u_q;
}

float knSigma(float r, float cosT) {
  return r * r + u_a * u_a * cosT * cosT;
}

float knBigA(float r, float sinT) {
  float r2a2 = r * r + u_a * u_a;
  return r2a2 * r2a2 - u_a * u_a * knDelta(r) * sinT * sinT;
}

/** Radio del horizonte exterior; devuelve -1 si es singularidad desnuda. */
float knHorizonOuter() {
  float disc = 1.0 - u_a * u_a - u_q * u_q;
  return disc < 0.0 ? -1.0 : 1.0 + sqrt(disc);
}

/** Ergosuperficie exterior r_E(theta) = 1 + sqrt(1 - q^2 - a^2 cos^2 theta). */
float knErgosphere(float cosT) {
  float disc = 1.0 - u_q * u_q - u_a * u_a * cosT * cosT;
  return disc < 0.0 ? -1.0 : 1.0 + sqrt(disc);
}

/** Arrastre de marcos omega = a (r^2 + a^2 - Delta) / A. */
float knFrameDragging(float r, float sinT) {
  return (u_a * (r * r + u_a * u_a - knDelta(r))) / knBigA(r, sinT);
}

/** Lapso del ZAMO alpha = sqrt(Delta Sigma / A) = dtau/dt. */
float knLapse(float r, float sinT, float cosT) {
  float v = knDelta(r) * knSigma(r, cosT) / knBigA(r, sinT);
  return v <= 0.0 ? 0.0 : sqrt(v);
}

/** Evita el cero de sin(theta) sin cambiar el signo. */
float safeSin(float sinT) {
  return abs(sinT) < SIN_EPS ? (sinT < 0.0 ? -SIN_EPS : SIN_EPS) : sinT;
}

/**
 * Lado derecho del sistema hamiltoniano reducido.
 * Se conserva el termino H * d_mu(Sigma) / Sigma en lugar de descartarlo por
 * H = 0, para que el flujo integrado sea el flujo hamiltoniano exacto.
 */
State geodesicRHS(State s, float E, float L) {
  float r = s.x.x;
  float th = s.x.y;
  float p_r = s.p.x;
  float p_th = s.p.y;

  float sinT = sin(th);
  float cosT = cos(th);
  float sf = safeSin(sinT);
  float s2 = sf * sf;

  float a = u_a;
  float a2 = a * a;
  float Del = knDelta(r);
  float dDel = 2.0 * (r - 1.0);
  float Sig = r * r + a2 * cosT * cosT;
  float Sig_r = 2.0 * r;
  float Sig_th = -2.0 * a2 * cosT * sinT;

  float U = (r * r + a2) * E - a * L;
  float w = a * E * sf - L / sf;

  float F = -U * U / Del + w * w;
  float dF_dr = -4.0 * r * E * U / Del + U * U * dDel / (Del * Del);
  float w_th = cosT * (a * E + L / s2);
  float dF_dth = 2.0 * w * w_th;
  float dF_dL = 2.0 * a * U / Del - 2.0 * w / sf;

  float N = Del * p_r * p_r + p_th * p_th + F;
  float H = N / (2.0 * Sig);
  float N_r = dDel * p_r * p_r + dF_dr;

  State d;
  d.x = vec3(Del * p_r / Sig, p_th / Sig, dF_dL / (2.0 * Sig));
  d.p = vec2(
    -N_r / (2.0 * Sig) + H * Sig_r / Sig,
    -dF_dth / (2.0 * Sig) + H * Sig_th / Sig
  );
  return d;
}

// ---------------------------------------------------------------------------
// Paso Runge-Kutta-Fehlberg 4(5) con coeficientes de Cash-Karp
// ---------------------------------------------------------------------------

/**
 * Un paso. Devuelve el estado de 5o orden y el error relativo estimado en
 * \`errOut\`, que es la diferencia entre las soluciones de 4o y 5o orden.
 */
State cashKarpStep(State s, float h, float E, float L, out float errOut) {
  State k1 = geodesicRHS(s, E, L);

  State y2;
  y2.x = s.x + h * (0.2 * k1.x);
  y2.p = s.p + h * (0.2 * k1.p);
  State k2 = geodesicRHS(y2, E, L);

  State y3;
  y3.x = s.x + h * (0.075 * k1.x + 0.225 * k2.x);
  y3.p = s.p + h * (0.075 * k1.p + 0.225 * k2.p);
  State k3 = geodesicRHS(y3, E, L);

  State y4;
  y4.x = s.x + h * (0.3 * k1.x - 0.9 * k2.x + 1.2 * k3.x);
  y4.p = s.p + h * (0.3 * k1.p - 0.9 * k2.p + 1.2 * k3.p);
  State k4 = geodesicRHS(y4, E, L);

  const float B51 = -11.0 / 54.0, B52 = 2.5, B53 = -70.0 / 27.0, B54 = 35.0 / 27.0;
  State y5;
  y5.x = s.x + h * (B51 * k1.x + B52 * k2.x + B53 * k3.x + B54 * k4.x);
  y5.p = s.p + h * (B51 * k1.p + B52 * k2.p + B53 * k3.p + B54 * k4.p);
  State k5 = geodesicRHS(y5, E, L);

  const float B61 = 1631.0 / 55296.0, B62 = 175.0 / 512.0, B63 = 575.0 / 13824.0;
  const float B64 = 44275.0 / 110592.0, B65 = 253.0 / 4096.0;
  State y6;
  y6.x = s.x + h * (B61 * k1.x + B62 * k2.x + B63 * k3.x + B64 * k4.x + B65 * k5.x);
  y6.p = s.p + h * (B61 * k1.p + B62 * k2.p + B63 * k3.p + B64 * k4.p + B65 * k5.p);
  State k6 = geodesicRHS(y6, E, L);

  const float C1 = 37.0 / 378.0, C3 = 250.0 / 621.0, C4 = 125.0 / 594.0, C6 = 512.0 / 1771.0;
  const float D1 = 2825.0 / 27648.0, D3 = 18575.0 / 48384.0, D4 = 13525.0 / 55296.0;
  const float D5 = 277.0 / 14336.0, D6 = 0.25;

  State out5;
  out5.x = s.x + h * (C1 * k1.x + C3 * k3.x + C4 * k4.x + C6 * k6.x);
  out5.p = s.p + h * (C1 * k1.p + C3 * k3.p + C4 * k4.p + C6 * k6.p);

  vec3 x4 = s.x + h * (D1 * k1.x + D3 * k3.x + D4 * k4.x + D5 * k5.x + D6 * k6.x);
  vec2 p4 = s.p + h * (D1 * k1.p + D3 * k3.p + D4 * k4.p + D5 * k5.p + D6 * k6.p);

  vec3 sx = abs(s.x) + abs(out5.x) + 1e-6;
  vec2 sp = abs(s.p) + abs(out5.p) + 1e-6;
  vec3 ex = abs(out5.x - x4) / sx;
  vec2 ep = abs(out5.p - p4) / sp;
  errOut = max(max(max(ex.x, ex.y), ex.z), max(ep.x, ep.y));

  return out5;
}

/** Paso Runge-Kutta 4 clasico, usado solo para refinar cruces del plano. */
State rk4Step(State s, float h, float E, float L) {
  State k1 = geodesicRHS(s, E, L);
  State y2;
  y2.x = s.x + 0.5 * h * k1.x;
  y2.p = s.p + 0.5 * h * k1.p;
  State k2 = geodesicRHS(y2, E, L);
  State y3;
  y3.x = s.x + 0.5 * h * k2.x;
  y3.p = s.p + 0.5 * h * k2.p;
  State k3 = geodesicRHS(y3, E, L);
  State y4;
  y4.x = s.x + h * k3.x;
  y4.p = s.p + h * k3.p;
  State k4 = geodesicRHS(y4, E, L);

  State o;
  o.x = s.x + (h / 6.0) * (k1.x + 2.0 * k2.x + 2.0 * k3.x + k4.x);
  o.p = s.p + (h / 6.0) * (k1.p + 2.0 * k2.p + 2.0 * k3.p + k4.p);
  return o;
}

// ---------------------------------------------------------------------------
// Camara: direccion local -> momento covariante
// ---------------------------------------------------------------------------

/**
 * Convierte una direccion unitaria en el cielo local del ZAMO
 * dir = (d_r, d_theta, d_phi) al momento covariante de un foton de energia
 * local unidad. Devuelve (p_t, p_r, p_theta, p_phi).
 *
 * La aberracion relativista y el arrastre de marcos quedan incorporados por
 * construccion al usar la tetrada del ZAMO.
 */
vec4 photonMomentum(float r, float th, vec3 dir) {
  float sinT = sin(th);
  float cosT = cos(th);
  float sf = max(abs(sinT), 1e-7) * (sinT < 0.0 ? -1.0 : 1.0);

  float Sig = knSigma(r, cosT);
  float Del = knDelta(r);
  float A = knBigA(r, sinT);
  float omega = knFrameDragging(r, sinT);
  float N = sqrt(A / (Del * Sig)); // 1 / alpha

  // Componentes contravariantes p^mu en la base coordenada.
  float pt_up = N;
  float pr_up = dir.x * sqrt(Del / Sig);
  float pth_up = dir.y / sqrt(Sig);
  float pph_up = N * omega + dir.z * sqrt(Sig) / (sqrt(A) * sf);

  // Metrica covariante para bajar los indices.
  float s2 = sinT * sinT;
  float g_tt = -(Del - u_a * u_a * s2) / Sig;
  float g_tphi = -u_a * s2 * (r * r + u_a * u_a - Del) / Sig;
  float g_phiphi = A * s2 / Sig;

  return vec4(
    g_tt * pt_up + g_tphi * pph_up,
    (Sig / Del) * pr_up,
    Sig * pth_up,
    g_tphi * pt_up + g_phiphi * pph_up
  );
}

/**
 * Direccion de la velocidad del rayo en pseudo-cartesianas
 * (x, y, z) = (r sin th cos ph, r sin th sin ph, r cos th), con z el eje de espin.
 * Para un rayo que escapa es la posicion celeste de donde proviene la luz.
 */
vec3 velocityDirection(State s, float E, float L) {
  State d = geodesicRHS(s, E, L);
  float r = s.x.x;
  float st = sin(s.x.y);
  float ct = cos(s.x.y);
  float sp = sin(s.x.z);
  float cp = cos(s.x.z);
  float dr = d.x.x, dth = d.x.y, dph = d.x.z;

  return normalize(vec3(
    dr * st * cp + r * ct * cp * dth - r * st * sp * dph,
    dr * st * sp + r * ct * sp * dth + r * st * cp * dph,
    dr * ct - r * st * dth
  ));
}

// ---- end metric.glsl ----
// ---- begin blackbody.glsl ----
// ---------------------------------------------------------------------------
// LUT de cuerpo negro compartida.
//
// Se extrae de disk.glsl para que la use tambien el trazador de la binaria, que
// necesita el color de las estrellas del fondo pero no el disco de acrecion.
//
// El fichero .frag debe incluirlo UNA sola vez y antes de disk.glsl o
// starfield.glsl: el preprocesador de #include no deduplica, e incluirlo dos veces
// duplicaria las declaraciones de uniforms y no compilaria.
// ---------------------------------------------------------------------------

uniform sampler2D u_bbLUT;   // RGB = cromaticidad, A = log10(radiancia visible)
uniform float u_lutLogTMin;
uniform float u_lutLogTMax;

const float LN10 = 2.302585092994046;

/**
 * Emision visible de un cuerpo negro a temperatura T (kelvin), en RGB lineal.
 *
 * La LUT guarda la cromaticidad con luminancia unidad y, en el canal alfa, el
 * log10 de la radiancia visible relativa: en logaritmo la interpolacion lineal de
 * la textura es fiel a lo largo de las ~20 decadas que cubre el rango.
 */
vec3 blackbodyEmission(float T) {
  if (T <= 0.0) return vec3(0.0);
  float logT = log(T) / LN10;
  float idx = (logT - u_lutLogTMin) / (u_lutLogTMax - u_lutLogTMin);
  vec4 s = texture(u_bbLUT, vec2(clamp(idx, 0.001, 0.999), 0.5));
  return s.rgb * pow(10.0, s.a);
}

// ---- end blackbody.glsl ----
// ---- begin disk.glsl ----
// ---------------------------------------------------------------------------
// Disco de acrecion delgado: perfil de Novikov-Thorne, cinematica kepleriana,
// corrimiento total (Doppler + gravitacional) y color de cuerpo negro.
//
// Requiere metric.glsl y blackbody.glsl (la LUT vive ahi, compartida con el
// fondo estelar y con el trazador de la binaria).
// ---------------------------------------------------------------------------

uniform float u_diskInner;   // r_in, normalmente el ISCO
uniform float u_diskOuter;   // r_out
uniform float u_diskTempMax; // T_max en kelvin
uniform float u_diskOpacity; // 0 = transparente, 1 = opticamente grueso
uniform float u_diskTime;    // fase de rotacion (en unidades de t geometrico)
uniform float u_diskTurbulence;
uniform float u_diskPrograde; // +1 corrotante, -1 contrarrotante

/**
 * Calibracion del brillo del disco.
 *
 * La radiancia que sale de la LUT esta en unidades relativas a un cuerpo negro
 * de referencia y abarca varias decadas segun la temperatura. Este factor la
 * lleva al rango que espera el tonemap, y se calcula en CPU (Renderer.ts):
 *  - exposicion automatica: normaliza por la radiancia a T_max, de modo que el
 *    disco queda bien expuesto a cualquier masa;
 *  - exposicion fisica: normaliza por una referencia FIJA, de modo que el brillo
 *    cambia de verdad con la masa via T ~ M^-1/4.
 *
 * Se aplica aqui y no en la exposicion global a proposito: si escalara la imagen
 * completa, las estrellas del fondo cambiarian de brillo al mover la masa del
 * agujero negro, que es fisicamente absurdo.
 */
uniform float u_diskBrightness;

// ---------------------------------------------------------------------------
// Orbitas circulares ecuatoriales
// ---------------------------------------------------------------------------

/**
 * Velocidad angular Omega = dphi/dt de la orbita circular ecuatorial en r,
 * de la condicion geodesica d_r g_tt + 2 Omega d_r g_tphi + Omega^2 d_r g_phiphi = 0.
 * Para Kerr se reduce a Omega = 1/(r^{3/2} + a).
 */
float diskOmega(float r) {
  float a = u_a;
  float q2 = u_q * u_q;
  float r2 = r * r;
  float r3 = r2 * r;

  float dg_tt = -2.0 / r2 + 2.0 * q2 / r3;
  float dg_tphi = -a * dg_tt;
  float dg_phiphi = 2.0 * r - 2.0 * a * a / r2 + 2.0 * a * a * q2 / r3;

  float disc = dg_tphi * dg_tphi - dg_tt * dg_phiphi;
  disc = max(disc, 0.0);
  return (-dg_tphi + u_diskPrograde * sqrt(disc)) / dg_phiphi;
}

/** Componentes ecuatoriales de la metrica covariante (theta = pi/2). */
void diskMetricEq(float r, out float g_tt, out float g_tphi, out float g_phiphi) {
  float a2 = u_a * u_a;
  float r2 = r * r;
  float Del = knDelta(r);
  g_tt = -(Del - a2) / r2;
  g_tphi = -u_a * (r2 + a2 - Del) / r2;
  float A = (r2 + a2) * (r2 + a2) - a2 * Del;
  g_phiphi = A / r2;
}

/** u^t de la orbita circular; 0 si no existe orbita temporal en r. */
float diskUt(float r, float Om) {
  float g_tt, g_tphi, g_phiphi;
  diskMetricEq(r, g_tt, g_tphi, g_phiphi);
  float norm = g_tt + 2.0 * Om * g_tphi + Om * Om * g_phiphi;
  return norm >= 0.0 ? 0.0 : 1.0 / sqrt(-norm);
}

// ---------------------------------------------------------------------------
// Perfil de temperatura
// ---------------------------------------------------------------------------

/**
 * Forma radial de Novikov-Thorne / Shakura-Sunyaev:
 *   f(r) = r^{-3/4} [1 - sqrt(r_in/r)]^{1/4}
 * normalizada a 1 en su maximo, que esta en r = (49/36) r_in.
 */
float diskTempProfile(float r) {
  if (r <= u_diskInner) return 0.0;
  float rin = u_diskInner;
  float f = pow(r, -0.75) * pow(max(1.0 - sqrt(rin / r), 0.0), 0.25);
  float rPeak = (49.0 / 36.0) * rin;
  float fPeak = pow(rPeak, -0.75) * pow(1.0 - sqrt(rin / rPeak), 0.25);
  return fPeak > 0.0 ? f / fPeak : 0.0;
}

// ---------------------------------------------------------------------------
// Ruido para la estructura turbulenta
// ---------------------------------------------------------------------------

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/**
 * Ruido de valor periodico en x con periodo \`periodX\` celdas.
 *
 * La periodicidad no es un lujo: la coordenada azimutal da la vuelta en phi = 2pi
 * y un ruido no periodico deja una costura recta y visible en el disco. Se logra
 * envolviendo el indice ENTERO de la rejilla con mod(), de modo que la celda
 * periodX coincide exactamente con la celda 0.
 */
float periodicValueNoise(vec2 p, float periodX) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, periodX);
  float x1 = mod(i.x + 1.0, periodX);
  float a = hash21(vec2(x0, i.y));
  float b = hash21(vec2(x1, i.y));
  float c = hash21(vec2(x0, i.y + 1.0));
  float d = hash21(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/**
 * FBM de 4 octavas periodica en el azimut.
 * \`angle\` es el azimut en el marco corrotante y \`radial\` la coordenada radial.
 * Cada octava dobla la frecuencia y tambien el periodo, que asi sigue siendo
 * un numero entero de celdas y mantiene la continuidad en la vuelta completa.
 */
float diskFbm(float angle, float radial) {
  const float BASE_PERIOD = 16.0;
  float v = 0.0;
  float amp = 0.5;
  float period = BASE_PERIOD;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    // angle/(2pi) * period recorre exactamente \`period\` celdas en una vuelta.
    vec2 p = vec2((angle / 6.283185307) * period, radial * freq);
    v += amp * periodicValueNoise(p, period);
    period *= 2.0;
    freq *= 2.03;
    amp *= 0.5;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Emision del disco en un cruce del plano ecuatorial
// ---------------------------------------------------------------------------

/**
 * Radiancia observada al cruzar el plano ecuatorial en radio r con azimut phi,
 * para un rayo de momento (E, L). Devuelve el color en \`emission\` y la opacidad
 * acumulada en \`alpha\`.
 *
 * El corrimiento total es un solo factor
 *   g = (p.u)_camara / (p.u)_disco = 1 / [u^t (E - Omega L)]
 * que engloba Doppler relativista y corrimiento gravitacional. La energia local
 * del foton en la camara es 1 por construccion de la tetrada, de ahi el
 * numerador unidad.
 *
 * No se aplica un g^4 sobre un color fijo: la radiacion observada de un cuerpo
 * negro a T con corrimiento g es exactamente un cuerpo negro a g*T, asi que se
 * consulta la LUT en g*T. Eso da brillo y color correctos a la vez, e incluye
 * que solo parte del flujo caiga en la banda visible (ver blackbody.ts).
 */
void diskSample(
  float r,
  float phi,
  float E,
  float L,
  out vec3 emission,
  out float alpha
) {
  emission = vec3(0.0);
  alpha = 0.0;
  if (r < u_diskInner || r > u_diskOuter) return;

  float Om = diskOmega(r);
  float ut = diskUt(r, Om);
  if (ut <= 0.0) return;

  // Factor de corrimiento total.
  float denom = ut * (E - Om * L);
  if (denom <= 1e-6) return;
  float g = 1.0 / denom;

  float Temit = u_diskTempMax * diskTempProfile(r);
  if (Temit <= 0.0) return;

  // Estructura turbulenta en el marco corrotante: la fase avanza con
  // Omega(r)*t, de modo que el cizallamiento por rotacion diferencial es el
  // que corresponde al perfil kepleriano.
  float shear = phi - Om * u_diskTime;
  float n = diskFbm(shear, log(r) * 6.0);
  float turb = mix(1.0, 0.35 + 1.3 * n, clamp(u_diskTurbulence, 0.0, 1.0));

  float Tobs = g * Temit;
  emission = blackbodyEmission(Tobs) * turb * u_diskBrightness;

  // Bordes suaves para no aliasear el corte radial.
  float edge = smoothstep(0.0, 0.06, (r - u_diskInner) / max(u_diskInner, 1.0)) *
               (1.0 - smoothstep(0.85, 1.0, r / u_diskOuter));
  emission *= edge;
  alpha = clamp(u_diskOpacity * edge, 0.0, 1.0);
}

// ---- end disk.glsl ----
// ---- begin starfield.glsl ----
// ---------------------------------------------------------------------------
// Fondo estelar procedural.
//
// No usa ningun asset: las estrellas se generan por hash sobre la direccion, y
// su color sale de la misma LUT de cuerpo negro que el disco (las estrellas son
// cuerpos negros a 2500-30000 K). Se anade una banda galactica difusa que sirve
// de referencia visual para leer la distorsion del lente.
//
// Requiere disk.glsl (para blackbodyEmission).
// ---------------------------------------------------------------------------

uniform float u_starIntensity;
uniform float u_starDensity;
uniform float u_milkyWayIntensity;
uniform samplerCube u_starCube;
uniform bool u_useStarCube;

/**
 * Calibracion absoluta del fondo.
 *
 * El fondo y el disco alimentan el mismo tonemap, asi que sus escalas tienen que
 * ser coherentes: con el pico del disco normalizado a ~1, una estrella brillante
 * debe rondar 0.05 y la banda galactica 0.02. Estas constantes son fijas y NO
 * dependen de los parametros del agujero negro, para que las estrellas no
 * cambien de brillo al mover la masa.
 */
const float STAR_CALIBRATION = 0.09;
const float MW_CALIBRATION = 0.03;
const float GALAXY_CALIBRATION = 0.5;

// ---------------------------------------------------------------------------
// Galaxias de fondo
//
// Una galaxia NO orbita un agujero negro: tiene ~10^11 masas solares y ~30 kpc de
// diametro, asi que es el objeto grande y el agujero el pequeno. Lo que si es real,
// y es lo que se hace aqui, es el LENTE GRAVITACIONAL de galaxias de fondo: sus
// arcos, sus anillos de Einstein y sus imagenes multiples son astronomia
// observacional corriente (Hubble, JWST).
//
// Aqui no se dibuja ningun arco: se define el perfil de brillo de la galaxia en el
// cielo asintotico, y la deformacion la produce el propio trazado de geodesicas al
// muestrear ese perfil con la direccion de escape del rayo.
// ---------------------------------------------------------------------------

#define MAX_GALAXIES 4

uniform int u_galaxyCount;
/** Direccion unitaria de cada galaxia en el cielo asintotico. */
uniform vec3 u_galaxyDir[MAX_GALAXIES];
/** (radio angular, razon de ejes, angulo de posicion, brillo). */
uniform vec4 u_galaxyShape[MAX_GALAXIES];
/** Color en RGB lineal. */
uniform vec3 u_galaxyColor[MAX_GALAXIES];
/** Intensidad de los brazos espirales, 0 = eliptica lisa. */
uniform float u_galaxySpiral;

/**
 * Brillo superficial de las galaxias de fondo en la direccion \`dir\`.
 *
 * Perfil: disco exponencial (Sersic n = 1) mas una componente central mas
 * concentrada, con una modulacion espiral logaritmica opcional. La proyeccion al
 * plano tangente es gnomonica, valida mientras la galaxia sea pequena en el cielo,
 * que es siempre el caso.
 */
vec3 galaxyLight(vec3 dir) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < MAX_GALAXIES; i++) {
    if (i >= u_galaxyCount) break;

    vec3 g = u_galaxyDir[i];
    float cosA = dot(dir, g);
    // Detras del observador o a mas de 90 grados: no contribuye.
    if (cosA <= 0.05) continue;

    // Base ortonormal en el plano tangente a la esfera celeste en g.
    vec3 helper = abs(g.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(helper, g));
    vec3 t2 = cross(g, t1);

    // Proyeccion gnomonica del desplazamiento angular.
    vec3 off = dir / cosA - g;
    float u = dot(off, t1);
    float v = dot(off, t2);

    // Rotacion por el angulo de posicion y achatamiento por la razon de ejes:
    // asi la galaxia se ve inclinada, no siempre de frente.
    float pa = u_galaxyShape[i].z;
    float cu = cos(pa) * u + sin(pa) * v;
    float cv = (-sin(pa) * u + cos(pa) * v) / max(u_galaxyShape[i].y, 0.05);

    float scale = max(u_galaxyShape[i].x, 1e-5);
    float rad = length(vec2(cu, cv)) / scale;
    if (rad > 6.0) continue;

    // Disco exponencial + componente central.
    float disc = exp(-1.68 * rad);
    float core = 0.45 * exp(-3.5 * sqrt(rad));

    // Brazos espirales logaritmicos: dos brazos, con la fase creciendo como log(r).
    float ang = atan(cv, cu);
    float arms = 1.0 + u_galaxySpiral * 0.5 * sin(2.0 * ang + 5.0 * log(max(rad, 0.06)));

    sum += u_galaxyColor[i] * u_galaxyShape[i].w * (disc * arms + core);
  }
  return sum * GALAXY_CALIBRATION;
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1, 0, 0));
  float n010 = hash13(i + vec3(0, 1, 0));
  float n110 = hash13(i + vec3(1, 1, 0));
  float n001 = hash13(i + vec3(0, 0, 1));
  float n101 = hash13(i + vec3(1, 0, 1));
  float n011 = hash13(i + vec3(0, 1, 1));
  float n111 = hash13(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

float fbm3(vec3 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    v += amp * valueNoise3(p);
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

/**
 * Una capa de estrellas puntuales. Se hashea la celda de una rejilla cubica
 * sobre la esfera de direcciones; cada celda contiene una estrella en posicion
 * aleatoria, con magnitud y temperatura aleatorias.
 *
 * El perfil es una gaussiana estrecha en la distancia angular, lo que hace que
 * las estrellas se estiren correctamente en arcos cuando el lente las deforma:
 * la deformacion la produce el trazado, no un truco de dibujado.
 */
vec3 starLayer(vec3 dir, float scale, float density, float sizeScale) {
  vec3 p = dir * scale;
  vec3 cell = floor(p);
  vec3 rnd = hash33(cell);

  // Solo una fraccion de las celdas contiene estrella.
  if (rnd.x > density) return vec3(0.0);

  // Posicion de la estrella dentro de la celda, proyectada a la esfera.
  // Se confina al 50% central: como solo se consulta la celda que contiene el
  // pixel, una estrella pegada al borde veria su perfil gaussiano cortado en
  // seco y se dibujaria como un bloque en vez de un punto.
  vec3 starPos = cell + 0.25 + 0.5 * vec3(rnd.y, rnd.z, fract(rnd.x * 71.13));
  vec3 starDir = normalize(starPos);

  float cosAng = dot(dir, starDir);
  float ang = acos(clamp(cosAng, -1.0, 1.0));

  // Magnitud: distribucion sesgada a muchas estrellas debiles y pocas brillantes.
  float mag = pow(fract(rnd.y * 313.7 + rnd.z * 71.3), 3.0);
  // El radio se mantiene bien por debajo del cuarto de celda disponible, de modo
  // que la gaussiana cae a cero antes de llegar al borde y no se recorta.
  float radius = sizeScale * (0.35 + 0.65 * mag) / scale;
  float falloff = exp(-(ang * ang) / (radius * radius));
  if (falloff < 1e-4) return vec3(0.0);

  // Temperatura estelar 2500-30000 K, con su color fisico desde la LUT.
  float T = mix(2500.0, 30000.0, pow(fract(rnd.z * 157.31), 1.6));
  vec3 color = blackbodyEmission(T);
  // Normalizar para que la LUT no imponga el brillo: aqui manda \`mag\`.
  color /= max(max(color.r, color.g), max(color.b, 1e-6));

  return color * falloff * (0.05 + 3.0 * mag);
}

/**
 * Banda galactica difusa. Es un realce a lo largo del plano z = 0 en
 * pseudo-cartesianas modulado por ruido, con nubes oscuras de polvo.
 * Da una referencia extensa que hace legibles los anillos de Einstein.
 */
vec3 milkyWay(vec3 dir) {
  // La banda se inclina respecto al eje de espin para que no coincida con el
  // plano del disco y las dos estructuras se distingan.
  vec3 d = normalize(vec3(dir.x, dir.y * 0.94 + dir.z * 0.34, -dir.y * 0.34 + dir.z * 0.94));

  float band = exp(-(d.z * d.z) / 0.045);
  float clouds = fbm3(d * 6.0, 5);
  float dust = smoothstep(0.35, 0.75, fbm3(d * 11.0 + 17.0, 4));

  float bright = band * (0.35 + 0.9 * clouds) * (1.0 - 0.75 * dust);
  vec3 tint = mix(vec3(0.55, 0.62, 0.95), vec3(1.0, 0.92, 0.78), clouds);
  return tint * bright;
}

/** Radiancia del fondo en la direccion asintotica \`dir\`. */
vec3 background(vec3 dir) {
  if (u_useStarCube) {
    return texture(u_starCube, dir).rgb * u_starIntensity;
  }

  vec3 c = vec3(0.0);
  c += starLayer(dir, 140.0, u_starDensity * 0.55, 0.13);
  c += starLayer(dir, 320.0, u_starDensity * 0.45, 0.11);
  c += starLayer(dir, 760.0, u_starDensity * 0.35, 0.10);
  c *= u_starIntensity * STAR_CALIBRATION;
  c += milkyWay(dir) * u_milkyWayIntensity * MW_CALIBRATION;
  c += galaxyLight(dir);
  return c;
}

// ---- end starfield.glsl ----
// ---- begin layers.glsl ----
// ---------------------------------------------------------------------------
// Capas geometricas conmutables: horizonte, ergosfera, esfera de fotones, ISCO
// y malla de coordenadas.
//
// Se dibujan DENTRO del trazador, detectando cuando el rayo cruza cada
// superficie. Eso significa que aparecen con su lente gravitacional correcto:
// no son un overlay pintado sobre la imagen, sino la imagen real de esas
// superficies. Es la diferencia entre un diagrama y una observacion.
//
// (El horizonte interior de Cauchy no se puede mostrar asi: esta dentro de r_+ y
// ningun rayo lo alcanza. Es causalmente inaccesible por construccion, y el HUD
// lo reporta como numero en vez de dibujarlo.)
//
// Requiere metric.glsl.
// ---------------------------------------------------------------------------

uniform bool u_showHorizon;
uniform bool u_showErgosphere;
uniform bool u_showPhotonSphere;
uniform bool u_showIsco;
uniform bool u_showDragGrid;

uniform float u_iscoRadius;
uniform float u_photonRadius;
uniform float u_dragGridRadius;
uniform float u_layerOpacity;

const float PI_L = 3.14159265358979;

/** Mascara de linea: 1 en los multiplos de \`spacing\`, 0 fuera. */
float lineMask(float v, float spacing, float halfWidth) {
  float k = v / spacing;
  float d = abs(k - round(k)) * spacing;
  return 1.0 - smoothstep(halfWidth * 0.4, halfWidth, d);
}

/**
 * Rejilla de meridianos y paralelos sobre una superficie de revolucion.
 * \`arc\` escala el ancho de linea con el radio para que se vea uniforme.
 */
float sphereGrid(float theta, float phi, float arc, float nLat, float nLon) {
  float lat = lineMask(theta, PI_L / nLat, arc);
  // Los meridianos se estrechan hacia los polos: se compensa con sin(theta).
  float lon = lineMask(phi, (2.0 * PI_L) / nLon, arc / max(sin(theta), 0.15));
  return clamp(max(lat, lon), 0.0, 1.0);
}

/** Interpola linealmente el estado entre dos pasos en la fraccion f. */
vec3 lerpX(vec3 a, vec3 b, float f) {
  return a + (b - a) * f;
}

/**
 * Contribucion de las capas al cruzar de \`prev\` a \`cur\`.
 * Devuelve color premultiplicado (se suma con la transmitancia acumulada).
 */
vec3 layerContribution(vec3 prev, vec3 cur) {
  vec3 col = vec3(0.0);
  if (u_layerOpacity <= 0.0) return col;

  // --- Ergosfera: superficie r = r_E(theta), se achata con el espin ---------
  if (u_showErgosphere) {
    float fPrev = prev.x - knErgosphere(cos(prev.y));
    float fCur = cur.x - knErgosphere(cos(cur.y));
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.05, 12.0, 24.0);
      col += vec3(0.95, 0.45, 0.15) * g * u_layerOpacity;
    }
  }

  // --- Esfera de fotones: r = r_ph (orbita circular ecuatorial prograda) ----
  if (u_showPhotonSphere) {
    float fPrev = prev.x - u_photonRadius;
    float fCur = cur.x - u_photonRadius;
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.04, 10.0, 20.0);
      col += vec3(0.35, 0.85, 1.0) * g * u_layerOpacity * 0.8;
    }
  }

  // --- Malla de coordenadas: muestra el arrastre de marcos ------------------
  if (u_showDragGrid) {
    float fPrev = prev.x - u_dragGridRadius;
    float fCur = cur.x - u_dragGridRadius;
    if (fPrev * fCur < 0.0) {
      float f = fPrev / (fPrev - fCur);
      vec3 x = lerpX(prev, cur, f);
      float g = sphereGrid(x.y, x.z, 0.03, 8.0, 16.0);
      // La intensidad se modula con omega para que se lea donde el arrastre
      // es fuerte.
      float drag = knFrameDragging(x.x, sin(x.y));
      col += mix(vec3(0.3, 0.35, 0.5), vec3(0.9, 0.3, 0.7), clamp(drag * 8.0, 0.0, 1.0)) *
             g * u_layerOpacity * 0.5;
    }
  }

  return col;
}

/** Rejilla sobre el horizonte, en el punto donde el rayo es capturado. */
vec3 horizonGrid(vec3 x) {
  if (!u_showHorizon || u_layerOpacity <= 0.0) return vec3(0.0);
  float g = sphereGrid(x.y, x.z, 0.045, 12.0, 24.0);
  return vec3(0.55, 0.15, 0.35) * g * u_layerOpacity;
}

/**
 * Anillo del ISCO en el plano ecuatorial. Se evalua en cada cruce del plano,
 * asi que se ve tanto directamente como en las imagenes de orden superior.
 */
vec3 iscoRing(float r) {
  if (!u_showIsco || u_layerOpacity <= 0.0) return vec3(0.0);
  float w = 0.035 * max(u_iscoRadius, 1.0);
  float d = abs(r - u_iscoRadius);
  float m = 1.0 - smoothstep(w * 0.4, w, d);
  return vec3(0.4, 1.0, 0.55) * m * u_layerOpacity;
}

// ---- end layers.glsl ----

uniform vec3 u_camPos; // (r, theta, phi) en Boyer-Lindquist
uniform float u_tanHalfFov;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform vec2 u_jitter; // desplazamiento subpixel, en pixeles

uniform int u_maxIter;
uniform float u_tol;
uniform float u_rEscape;
uniform float u_rCapture;
uniform float u_hInit;

uniform bool u_diskEnabled;
uniform bool u_starsEnabled;
uniform bool u_markNonConverged;

uniform sampler2D u_prevAccum;
uniform float u_sampleIndex; // 0 en la primera muestra del lote

out vec4 fragColor;

/** Tope absoluto de iteraciones; u_maxIter recorta por debajo en tiempo real. */
const int HARD_ITER_CAP = 4096;

void main() {
  // --- Direccion del pixel en el cielo local del ZAMO ----------------------
  vec2 px = gl_FragCoord.xy + u_jitter;
  vec2 ndc = (px / u_resolution) * 2.0 - 1.0;

  // La camara mira siempre al centro: adelante = -e_r, arriba = -e_theta
  // (theta crece hacia el sur), derecha = +e_phi.
  vec3 dLocal = normalize(vec3(
    -1.0,
    -ndc.y * u_tanHalfFov,
    ndc.x * u_tanHalfFov * u_aspect
  ));

  vec4 pmu = photonMomentum(u_camPos.x, u_camPos.y, dLocal);
  float E = -pmu.x; // constante de movimiento
  float L = pmu.w;  // constante de movimiento

  State s;
  s.x = u_camPos;
  s.p = vec2(pmu.y, pmu.z);

  vec3 radiance = vec3(0.0);
  float transmittance = 1.0;
  float h = u_hInit;
  bool resolved = false;

  // --- Integracion ---------------------------------------------------------
  for (int i = 0; i < HARD_ITER_CAP; i++) {
    if (i >= u_maxIter) break;

    // Limitador de paso: nunca saltar dentro del horizonte.
    float hCap = max(1e-6, 0.25 * (s.x.x - u_rCapture));

    // Cerca del plano del disco se acota dtheta por paso para que el cruce se
    // localice con precision (de ahi sale la nitidez del anillo de fotones).
    if (u_diskEnabled && s.x.x > u_diskInner - 1.0 && s.x.x < u_diskOuter + 2.0) {
      float Sig = knSigma(s.x.x, cos(s.x.y));
      float dthAbs = abs(s.p.y) / Sig;
      hCap = min(hCap, 0.02 / max(dthAbs, 1e-4));
    }
    h = min(h, hCap);

    float err;
    State next = cashKarpStep(s, h, E, L, err);

    if (err > u_tol && h > 1e-7) {
      // Paso rechazado: reducir y reintentar (consume iteracion, no avanza).
      h *= max(0.2, 0.9 * pow(u_tol / err, 0.2));
      continue;
    }

    // --- Cruce del plano ecuatorial: emision del disco ---------------------
    float cPrev = cos(s.x.y);
    float cNext = cos(next.x.y);
    if (cPrev * cNext < 0.0) {
      // Interpolacion lineal en cos(theta) y un refinamiento de Newton, ambos
      // evaluados con subpasos RK4 exactos desde el estado anterior.
      float f = cPrev / (cPrev - cNext);
      State hit = rk4Step(s, h * f, E, L);

      State dh = geodesicRHS(hit, E, L);
      float dCos = -sin(hit.x.y) * dh.x.y;
      if (abs(dCos) > 1e-9) {
        float dLambda = -cos(hit.x.y) / dCos;
        hit = rk4Step(s, h * f + dLambda, E, L);
      }

      if (u_diskEnabled) {
        vec3 emis;
        float alpha;
        diskSample(hit.x.x, hit.x.z, E, L, emis, alpha);
        radiance += transmittance * emis;
        transmittance *= (1.0 - alpha);
      }
      radiance += transmittance * iscoRing(hit.x.x);

      if (transmittance < 0.003) {
        resolved = true;
        break;
      }
    }

    // --- Capas geometricas (lente correcto: son cruces reales del rayo) ----
    radiance += transmittance * layerContribution(s.x, next.x);

    s = next;

    // --- Captura ----------------------------------------------------------
    if (s.x.x <= u_rCapture) {
      radiance += transmittance * horizonGrid(s.x);
      resolved = true;
      break;
    }

    // --- Escape -----------------------------------------------------------
    if (s.x.x >= u_rEscape) {
      State d = geodesicRHS(s, E, L);
      if (d.x.x > 0.0) {
        if (u_starsEnabled) {
          float r = s.x.x;
          float st = sin(s.x.y), ct = cos(s.x.y);
          float sp = sin(s.x.z), cp = cos(s.x.z);
          vec3 dir = normalize(vec3(
            d.x.x * st * cp + r * ct * cp * d.x.y - r * st * sp * d.x.z,
            d.x.x * st * sp + r * ct * sp * d.x.y + r * st * cp * d.x.z,
            d.x.x * ct - r * st * d.x.y
          ));
          radiance += transmittance * background(dir);
        }
        resolved = true;
        break;
      }
    }

    // Crecer el paso si el error lo permite.
    h *= min(5.0, 0.9 * pow(u_tol / max(err, 1e-12), 0.2));
  }

  // --- Rayos que agotaron las iteraciones ---------------------------------
  if (!resolved) {
    if (u_markNonConverged) {
      // Modo diagnostico: hace visible donde falta presupuesto de pasos.
      radiance += vec3(1.0, 0.0, 0.8) * transmittance;
    } else if (u_starsEnabled) {
      // Mejor estimacion disponible en vez de un pixel negro.
      radiance += transmittance * background(velocityDirection(s, E, L)) * 0.5;
    }
  }

  // --- Acumulacion progresiva (media corrida) -----------------------------
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 prev = texture(u_prevAccum, uv).rgb;
  float n = u_sampleIndex;
  vec3 outColor = n < 0.5 ? radiance : mix(prev, radiance, 1.0 / (n + 1.0));

  fragColor = vec4(outColor, 1.0);
}
`,Nn=`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

// ---------------------------------------------------------------------------
// Trazador de dos agujeros negros sobre datos iniciales de Brill-Lindquist.
//
// No hay disco de acrecion en este modo: lo interesante aqui es el lente DOBLE
// sobre el fondo estelar, con sus dos sombras, sus imagenes multiples y los
// anillos de Einstein cruzados. Meter un disco taparia justo eso.
//
// Limite declarado, tambien en la interfaz: la metrica es solucion exacta de las
// LIGADURAS de Einstein en cada instante, pero no de las ecuaciones de evolucion.
// Las posiciones de los dos agujeros las da la dinamica post-newtoniana, no
// Einstein: una secuencia de instantaneas no es una fusion simulada.
// ---------------------------------------------------------------------------

// ---- begin binaryMetric.glsl ----
// ---------------------------------------------------------------------------
// Metrica de Brill-Lindquist y geodesicas nulas, en cartesianas isotropas.
//
// Espejo en GLSL de \`src/physics/binary.ts\`, que es el que esta validado contra
// resultados analiticos (con m2 = 0 debe reproducir sqrt(27) M). Cualquier cambio
// aqui hay que replicarlo alli.
//
//   psi = 1 + m1/(2 r1) + m2/(2 r2)
//   ds^2 = -alpha^2 dt^2 + psi^4 (dx^2 + dy^2 + dz^2),   alpha = 2/psi - 1
//
// Con dos punturas se pierde la simetria axial: no hay analogo de L y hay que
// integrar las tres componentes del momento. A cambio la metrica es estatica, asi
// que E = -p_t sigue siendo constante, y al ser conformemente plana solo hacen
// falta psi y su gradiente.
// ---------------------------------------------------------------------------

uniform vec3 u_bh1Pos;
uniform vec3 u_bh2Pos;
uniform float u_bh1Mass;
uniform float u_bh2Mass;

/** Estado de un rayo: posicion y momento covariante espacial. */
struct BinState {
  vec3 x;
  vec3 p;
};

/** psi = 1 + sum m_i/(2 r_i). */
float blPsi(vec3 x) {
  float r1 = max(length(x - u_bh1Pos), 1e-6);
  float r2 = max(length(x - u_bh2Pos), 1e-6);
  return 1.0 + u_bh1Mass / (2.0 * r1) + u_bh2Mass / (2.0 * r2);
}

/** Gradiente de psi. Apunta hacia las masas, porque psi crece al acercarse. */
vec3 blGradPsi(vec3 x) {
  vec3 d1 = x - u_bh1Pos;
  vec3 d2 = x - u_bh2Pos;
  float r1 = max(length(d1), 1e-6);
  float r2 = max(length(d2), 1e-6);
  return -u_bh1Mass * d1 / (2.0 * r1 * r1 * r1)
         - u_bh2Mass * d2 / (2.0 * r2 * r2 * r2);
}

/** Lapso alpha = 2/psi - 1: vale 1 en el infinito y 0 en el horizonte (psi = 2). */
float blLapse(float psi) {
  return 2.0 / psi - 1.0;
}

/** Distancia a la puntura mas cercana, para limitar el paso. */
float blNearest(vec3 x) {
  return min(length(x - u_bh1Pos), length(x - u_bh2Pos));
}

/**
 * Lado derecho:
 *   dx^i/dl = p_i / psi^4
 *   dp_i/dl = -E^2 d_i(alpha)/alpha^3 + 2 |p|^2 d_i(psi)/psi^5
 * con d_i(alpha) = -2 d_i(psi)/psi^2.
 */
BinState blRHS(BinState s, float E) {
  float psi = blPsi(s.x);
  vec3 gp = blGradPsi(s.x);
  float a = blLapse(psi);
  vec3 ga = -2.0 * gp / (psi * psi);

  float psi4 = psi * psi * psi * psi;
  float psi5 = psi4 * psi;
  float p2 = dot(s.p, s.p);
  float a3 = a * a * a;

  BinState d;
  d.x = s.p / psi4;
  d.p = -(E * E) * ga / a3 + 2.0 * p2 * gp / psi5;
  return d;
}

/** Paso Cash-Karp 4(5). Mismos coeficientes que el trazador de Kerr-Newman. */
BinState blStep(BinState s, float h, float E, out float errOut) {
  BinState k1 = blRHS(s, E);

  BinState y2; y2.x = s.x + h * 0.2 * k1.x; y2.p = s.p + h * 0.2 * k1.p;
  BinState k2 = blRHS(y2, E);

  BinState y3;
  y3.x = s.x + h * (0.075 * k1.x + 0.225 * k2.x);
  y3.p = s.p + h * (0.075 * k1.p + 0.225 * k2.p);
  BinState k3 = blRHS(y3, E);

  BinState y4;
  y4.x = s.x + h * (0.3 * k1.x - 0.9 * k2.x + 1.2 * k3.x);
  y4.p = s.p + h * (0.3 * k1.p - 0.9 * k2.p + 1.2 * k3.p);
  BinState k4 = blRHS(y4, E);

  const float B51 = -11.0 / 54.0, B52 = 2.5, B53 = -70.0 / 27.0, B54 = 35.0 / 27.0;
  BinState y5;
  y5.x = s.x + h * (B51 * k1.x + B52 * k2.x + B53 * k3.x + B54 * k4.x);
  y5.p = s.p + h * (B51 * k1.p + B52 * k2.p + B53 * k3.p + B54 * k4.p);
  BinState k5 = blRHS(y5, E);

  const float B61 = 1631.0 / 55296.0, B62 = 175.0 / 512.0, B63 = 575.0 / 13824.0;
  const float B64 = 44275.0 / 110592.0, B65 = 253.0 / 4096.0;
  BinState y6;
  y6.x = s.x + h * (B61 * k1.x + B62 * k2.x + B63 * k3.x + B64 * k4.x + B65 * k5.x);
  y6.p = s.p + h * (B61 * k1.p + B62 * k2.p + B63 * k3.p + B64 * k4.p + B65 * k5.p);
  BinState k6 = blRHS(y6, E);

  const float C1 = 37.0 / 378.0, C3 = 250.0 / 621.0, C4 = 125.0 / 594.0, C6 = 512.0 / 1771.0;
  const float D1 = 2825.0 / 27648.0, D3 = 18575.0 / 48384.0, D4 = 13525.0 / 55296.0;
  const float D5 = 277.0 / 14336.0, D6 = 0.25;

  BinState o;
  o.x = s.x + h * (C1 * k1.x + C3 * k3.x + C4 * k4.x + C6 * k6.x);
  o.p = s.p + h * (C1 * k1.p + C3 * k3.p + C4 * k4.p + C6 * k6.p);

  vec3 x4 = s.x + h * (D1 * k1.x + D3 * k3.x + D4 * k4.x + D5 * k5.x + D6 * k6.x);
  vec3 p4 = s.p + h * (D1 * k1.p + D3 * k3.p + D4 * k4.p + D5 * k5.p + D6 * k6.p);

  // Error mixto absoluto/relativo: el suelo evita que una componente nula limite
  // el paso de forma permanente (ver la nota de ERR_FLOOR en geodesic.ts).
  vec3 ex = abs(o.x - x4) / (abs(s.x) + abs(o.x) + 1e-3);
  vec3 ep = abs(o.p - p4) / (abs(s.p) + abs(o.p) + 1e-3);
  errOut = max(max(max(ex.x, ex.y), ex.z), max(max(ep.x, ep.y), ep.z));

  return o;
}

/**
 * Construye un foton con energia local unidad en el marco del observador estatico.
 * La tetrada es e_0 = (1/alpha) d_t, e_i = (1/psi^2) d_i, de donde E = alpha y
 * p_i = psi^2 dir_i, que da un momento nulo por construccion.
 */
BinState blPhoton(vec3 x, vec3 dir, out float E) {
  float psi = blPsi(x);
  E = blLapse(psi);
  BinState s;
  s.x = x;
  s.p = psi * psi * normalize(dir);
  return s;
}

// ---- end binaryMetric.glsl ----
// ---- begin blackbody.glsl ----
// ---------------------------------------------------------------------------
// LUT de cuerpo negro compartida.
//
// Se extrae de disk.glsl para que la use tambien el trazador de la binaria, que
// necesita el color de las estrellas del fondo pero no el disco de acrecion.
//
// El fichero .frag debe incluirlo UNA sola vez y antes de disk.glsl o
// starfield.glsl: el preprocesador de #include no deduplica, e incluirlo dos veces
// duplicaria las declaraciones de uniforms y no compilaria.
// ---------------------------------------------------------------------------

uniform sampler2D u_bbLUT;   // RGB = cromaticidad, A = log10(radiancia visible)
uniform float u_lutLogTMin;
uniform float u_lutLogTMax;

const float LN10 = 2.302585092994046;

/**
 * Emision visible de un cuerpo negro a temperatura T (kelvin), en RGB lineal.
 *
 * La LUT guarda la cromaticidad con luminancia unidad y, en el canal alfa, el
 * log10 de la radiancia visible relativa: en logaritmo la interpolacion lineal de
 * la textura es fiel a lo largo de las ~20 decadas que cubre el rango.
 */
vec3 blackbodyEmission(float T) {
  if (T <= 0.0) return vec3(0.0);
  float logT = log(T) / LN10;
  float idx = (logT - u_lutLogTMin) / (u_lutLogTMax - u_lutLogTMin);
  vec4 s = texture(u_bbLUT, vec2(clamp(idx, 0.001, 0.999), 0.5));
  return s.rgb * pow(10.0, s.a);
}

// ---- end blackbody.glsl ----
// ---- begin starfield.glsl ----
// ---------------------------------------------------------------------------
// Fondo estelar procedural.
//
// No usa ningun asset: las estrellas se generan por hash sobre la direccion, y
// su color sale de la misma LUT de cuerpo negro que el disco (las estrellas son
// cuerpos negros a 2500-30000 K). Se anade una banda galactica difusa que sirve
// de referencia visual para leer la distorsion del lente.
//
// Requiere disk.glsl (para blackbodyEmission).
// ---------------------------------------------------------------------------

uniform float u_starIntensity;
uniform float u_starDensity;
uniform float u_milkyWayIntensity;
uniform samplerCube u_starCube;
uniform bool u_useStarCube;

/**
 * Calibracion absoluta del fondo.
 *
 * El fondo y el disco alimentan el mismo tonemap, asi que sus escalas tienen que
 * ser coherentes: con el pico del disco normalizado a ~1, una estrella brillante
 * debe rondar 0.05 y la banda galactica 0.02. Estas constantes son fijas y NO
 * dependen de los parametros del agujero negro, para que las estrellas no
 * cambien de brillo al mover la masa.
 */
const float STAR_CALIBRATION = 0.09;
const float MW_CALIBRATION = 0.03;
const float GALAXY_CALIBRATION = 0.5;

// ---------------------------------------------------------------------------
// Galaxias de fondo
//
// Una galaxia NO orbita un agujero negro: tiene ~10^11 masas solares y ~30 kpc de
// diametro, asi que es el objeto grande y el agujero el pequeno. Lo que si es real,
// y es lo que se hace aqui, es el LENTE GRAVITACIONAL de galaxias de fondo: sus
// arcos, sus anillos de Einstein y sus imagenes multiples son astronomia
// observacional corriente (Hubble, JWST).
//
// Aqui no se dibuja ningun arco: se define el perfil de brillo de la galaxia en el
// cielo asintotico, y la deformacion la produce el propio trazado de geodesicas al
// muestrear ese perfil con la direccion de escape del rayo.
// ---------------------------------------------------------------------------

#define MAX_GALAXIES 4

uniform int u_galaxyCount;
/** Direccion unitaria de cada galaxia en el cielo asintotico. */
uniform vec3 u_galaxyDir[MAX_GALAXIES];
/** (radio angular, razon de ejes, angulo de posicion, brillo). */
uniform vec4 u_galaxyShape[MAX_GALAXIES];
/** Color en RGB lineal. */
uniform vec3 u_galaxyColor[MAX_GALAXIES];
/** Intensidad de los brazos espirales, 0 = eliptica lisa. */
uniform float u_galaxySpiral;

/**
 * Brillo superficial de las galaxias de fondo en la direccion \`dir\`.
 *
 * Perfil: disco exponencial (Sersic n = 1) mas una componente central mas
 * concentrada, con una modulacion espiral logaritmica opcional. La proyeccion al
 * plano tangente es gnomonica, valida mientras la galaxia sea pequena en el cielo,
 * que es siempre el caso.
 */
vec3 galaxyLight(vec3 dir) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < MAX_GALAXIES; i++) {
    if (i >= u_galaxyCount) break;

    vec3 g = u_galaxyDir[i];
    float cosA = dot(dir, g);
    // Detras del observador o a mas de 90 grados: no contribuye.
    if (cosA <= 0.05) continue;

    // Base ortonormal en el plano tangente a la esfera celeste en g.
    vec3 helper = abs(g.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(helper, g));
    vec3 t2 = cross(g, t1);

    // Proyeccion gnomonica del desplazamiento angular.
    vec3 off = dir / cosA - g;
    float u = dot(off, t1);
    float v = dot(off, t2);

    // Rotacion por el angulo de posicion y achatamiento por la razon de ejes:
    // asi la galaxia se ve inclinada, no siempre de frente.
    float pa = u_galaxyShape[i].z;
    float cu = cos(pa) * u + sin(pa) * v;
    float cv = (-sin(pa) * u + cos(pa) * v) / max(u_galaxyShape[i].y, 0.05);

    float scale = max(u_galaxyShape[i].x, 1e-5);
    float rad = length(vec2(cu, cv)) / scale;
    if (rad > 6.0) continue;

    // Disco exponencial + componente central.
    float disc = exp(-1.68 * rad);
    float core = 0.45 * exp(-3.5 * sqrt(rad));

    // Brazos espirales logaritmicos: dos brazos, con la fase creciendo como log(r).
    float ang = atan(cv, cu);
    float arms = 1.0 + u_galaxySpiral * 0.5 * sin(2.0 * ang + 5.0 * log(max(rad, 0.06)));

    sum += u_galaxyColor[i] * u_galaxyShape[i].w * (disc * arms + core);
  }
  return sum * GALAXY_CALIBRATION;
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1, 0, 0));
  float n010 = hash13(i + vec3(0, 1, 0));
  float n110 = hash13(i + vec3(1, 1, 0));
  float n001 = hash13(i + vec3(0, 0, 1));
  float n101 = hash13(i + vec3(1, 0, 1));
  float n011 = hash13(i + vec3(0, 1, 1));
  float n111 = hash13(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

float fbm3(vec3 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    v += amp * valueNoise3(p);
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

/**
 * Una capa de estrellas puntuales. Se hashea la celda de una rejilla cubica
 * sobre la esfera de direcciones; cada celda contiene una estrella en posicion
 * aleatoria, con magnitud y temperatura aleatorias.
 *
 * El perfil es una gaussiana estrecha en la distancia angular, lo que hace que
 * las estrellas se estiren correctamente en arcos cuando el lente las deforma:
 * la deformacion la produce el trazado, no un truco de dibujado.
 */
vec3 starLayer(vec3 dir, float scale, float density, float sizeScale) {
  vec3 p = dir * scale;
  vec3 cell = floor(p);
  vec3 rnd = hash33(cell);

  // Solo una fraccion de las celdas contiene estrella.
  if (rnd.x > density) return vec3(0.0);

  // Posicion de la estrella dentro de la celda, proyectada a la esfera.
  // Se confina al 50% central: como solo se consulta la celda que contiene el
  // pixel, una estrella pegada al borde veria su perfil gaussiano cortado en
  // seco y se dibujaria como un bloque en vez de un punto.
  vec3 starPos = cell + 0.25 + 0.5 * vec3(rnd.y, rnd.z, fract(rnd.x * 71.13));
  vec3 starDir = normalize(starPos);

  float cosAng = dot(dir, starDir);
  float ang = acos(clamp(cosAng, -1.0, 1.0));

  // Magnitud: distribucion sesgada a muchas estrellas debiles y pocas brillantes.
  float mag = pow(fract(rnd.y * 313.7 + rnd.z * 71.3), 3.0);
  // El radio se mantiene bien por debajo del cuarto de celda disponible, de modo
  // que la gaussiana cae a cero antes de llegar al borde y no se recorta.
  float radius = sizeScale * (0.35 + 0.65 * mag) / scale;
  float falloff = exp(-(ang * ang) / (radius * radius));
  if (falloff < 1e-4) return vec3(0.0);

  // Temperatura estelar 2500-30000 K, con su color fisico desde la LUT.
  float T = mix(2500.0, 30000.0, pow(fract(rnd.z * 157.31), 1.6));
  vec3 color = blackbodyEmission(T);
  // Normalizar para que la LUT no imponga el brillo: aqui manda \`mag\`.
  color /= max(max(color.r, color.g), max(color.b, 1e-6));

  return color * falloff * (0.05 + 3.0 * mag);
}

/**
 * Banda galactica difusa. Es un realce a lo largo del plano z = 0 en
 * pseudo-cartesianas modulado por ruido, con nubes oscuras de polvo.
 * Da una referencia extensa que hace legibles los anillos de Einstein.
 */
vec3 milkyWay(vec3 dir) {
  // La banda se inclina respecto al eje de espin para que no coincida con el
  // plano del disco y las dos estructuras se distingan.
  vec3 d = normalize(vec3(dir.x, dir.y * 0.94 + dir.z * 0.34, -dir.y * 0.34 + dir.z * 0.94));

  float band = exp(-(d.z * d.z) / 0.045);
  float clouds = fbm3(d * 6.0, 5);
  float dust = smoothstep(0.35, 0.75, fbm3(d * 11.0 + 17.0, 4));

  float bright = band * (0.35 + 0.9 * clouds) * (1.0 - 0.75 * dust);
  vec3 tint = mix(vec3(0.55, 0.62, 0.95), vec3(1.0, 0.92, 0.78), clouds);
  return tint * bright;
}

/** Radiancia del fondo en la direccion asintotica \`dir\`. */
vec3 background(vec3 dir) {
  if (u_useStarCube) {
    return texture(u_starCube, dir).rgb * u_starIntensity;
  }

  vec3 c = vec3(0.0);
  c += starLayer(dir, 140.0, u_starDensity * 0.55, 0.13);
  c += starLayer(dir, 320.0, u_starDensity * 0.45, 0.11);
  c += starLayer(dir, 760.0, u_starDensity * 0.35, 0.10);
  c *= u_starIntensity * STAR_CALIBRATION;
  c += milkyWay(dir) * u_milkyWayIntensity * MW_CALIBRATION;
  c += galaxyLight(dir);
  return c;
}

// ---- end starfield.glsl ----

uniform vec3 u_camPos;   // posicion de la camara, cartesianas isotropas
uniform vec3 u_camRight;
uniform vec3 u_camUp;
uniform vec3 u_camFwd;
uniform float u_tanHalfFov;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform vec2 u_jitter;

uniform int u_maxIter;
uniform float u_tol;
uniform float u_rEscape;
uniform float u_alphaCapture;
uniform float u_hInit;
uniform bool u_markNonConverged;

/** Rejilla sobre el horizonte de cada agujero, para distinguirlos. */
uniform bool u_showHorizonGrid;
uniform float u_layerOpacity;

uniform sampler2D u_prevAccum;
uniform float u_sampleIndex;

out vec4 fragColor;

const int HARD_ITER_CAP = 4096;
const float PI_B = 3.14159265358979;

/** Rejilla de meridianos y paralelos alrededor de una puntura. */
vec3 punctureGrid(vec3 x, vec3 center, vec3 tint) {
  vec3 d = x - center;
  float r = max(length(d), 1e-6);
  float theta = acos(clamp(d.z / r, -1.0, 1.0));
  float phi = atan(d.y, d.x);

  float latSpacing = PI_B / 8.0;
  float lonSpacing = (2.0 * PI_B) / 16.0;
  float kLat = theta / latSpacing;
  float kLon = phi / lonSpacing;
  float dLat = abs(kLat - round(kLat)) * latSpacing;
  float dLon = abs(kLon - round(kLon)) * lonSpacing * max(sin(theta), 0.15);
  float w = 0.05;
  float m = max(
    1.0 - smoothstep(w * 0.4, w, dLat),
    1.0 - smoothstep(w * 0.4, w, dLon)
  );
  return tint * m * u_layerOpacity;
}

void main() {
  vec2 px = gl_FragCoord.xy + u_jitter;
  vec2 ndc = (px / u_resolution) * 2.0 - 1.0;

  // Camara 3D general: sin simetria axial no hay una base privilegiada.
  vec3 dir = normalize(
    u_camFwd +
    u_camRight * (ndc.x * u_tanHalfFov * u_aspect) +
    u_camUp * (ndc.y * u_tanHalfFov)
  );

  float E;
  BinState s = blPhoton(u_camPos, dir, E);

  vec3 radiance = vec3(0.0);
  float h = u_hInit;
  bool resolved = false;

  for (int i = 0; i < HARD_ITER_CAP; i++) {
    if (i >= u_maxIter) break;

    // El paso se limita por la distancia a la puntura mas cercana: es donde la
    // curvatura crece sin cota.
    float hCap = max(1e-5, 0.2 * blNearest(s.x));
    h = min(h, hCap);

    float err;
    BinState next = blStep(s, h, E, err);

    if (err > u_tol && h > 1e-6) {
      h *= max(0.2, 0.9 * pow(u_tol / err, 0.2));
      continue;
    }

    s = next;

    // Captura. Se corta en alpha = u_alphaCapture y no en alpha = 0 porque el
    // termino E^2 d(alpha)/alpha^3 diverge en el horizonte y estancaria el paso
    // adaptativo. Ver ALPHA_CAPTURE en binary.ts.
    float psi = blPsi(s.x);
    if (blLapse(psi) <= u_alphaCapture) {
      if (u_showHorizonGrid) {
        // Se colorea segun cual de los dos capturo el rayo, para que las dos
        // sombras se distingan.
        float d1 = length(s.x - u_bh1Pos);
        float d2 = length(s.x - u_bh2Pos);
        radiance += d1 < d2
          ? punctureGrid(s.x, u_bh1Pos, vec3(0.95, 0.35, 0.30))
          : punctureGrid(s.x, u_bh2Pos, vec3(0.35, 0.60, 1.00));
      }
      resolved = true;
      break;
    }

    // Escape.
    if (length(s.x) >= u_rEscape) {
      BinState d = blRHS(s, E);
      if (dot(s.x, d.x) > 0.0) {
        // A gran distancia psi -> 1, asi que la direccion de la velocidad es la
        // del momento.
        radiance += background(normalize(s.p));
        resolved = true;
        break;
      }
    }

    h *= min(5.0, 0.9 * pow(u_tol / max(err, 1e-12), 0.2));
  }

  if (!resolved) {
    if (u_markNonConverged) {
      radiance += vec3(1.0, 0.0, 0.8);
    } else {
      radiance += background(normalize(s.p)) * 0.5;
    }
  }

  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 prev = texture(u_prevAccum, uv).rgb;
  float n = u_sampleIndex;
  fragColor = vec4(n < 0.5 ? radiance : mix(prev, radiance, 1.0 / (n + 1.0)), 1.0);
}
`,On=`#version 300 es
precision highp float;

// Tonemap final: exposicion -> bloom -> ACES -> codificacion sRGB -> dither.

uniform sampler2D u_accum;
uniform sampler2D u_bloom;
uniform vec2 u_resolution;
uniform float u_exposure;
uniform float u_bloomStrength;
uniform bool u_bloomEnabled;

out vec4 fragColor;

/** Aproximacion filmica de ACES (Narkowicz 2015). */
vec3 acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

/** Codificacion sRGB (el framebuffer por defecto no la aplica). */
vec3 linearToSrgb(vec3 c) {
  c = max(c, vec3(0.0));
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}

float dither(vec2 p) {
  // Ruido de interleaved gradient (Jimenez 2014): rompe el banding a 8 bits.
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_accum, uv).rgb;

  if (u_bloomEnabled) {
    color += texture(u_bloom, uv).rgb * u_bloomStrength;
  }

  color *= u_exposure;
  color = acesFilmic(color);
  color = linearToSrgb(color);

  // El dither se aplica en el espacio de salida, a escala de 1 LSB.
  color += (dither(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(color, 1.0);
}
`,Un=`#version 300 es
precision highp float;

// Bloom en dos etapas sobre un objetivo a media resolucion:
//   u_mode = 0 -> paso de brillo (extrae lo que supera el umbral)
//   u_mode = 1 -> desenfoque gaussiano separable en la direccion u_dir
//
// Su razon de ser es el anillo de fotones: concentra mucha energia en muy pocos
// pixeles, y sin bloom el tonemap lo recorta a blanco plano perdiendo su forma.

uniform sampler2D u_src;
uniform vec2 u_texel; // 1 / tamano de la textura fuente
uniform vec2 u_resolution;
uniform vec2 u_dir; // (1,0) horizontal, (0,1) vertical
uniform float u_threshold;
uniform int u_mode;

out vec4 fragColor;

/** Pesos gaussianos de 9 muestras (sigma ~ 2.2 px). */
const float W0 = 0.2270270270;
const float W1 = 0.1945945946;
const float W2 = 0.1216216216;
const float W3 = 0.0540540541;
const float W4 = 0.0162162162;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  if (u_mode == 0) {
    vec3 c = texture(u_src, uv).rgb;
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // Recorte suave: evita que el bloom aparezca de golpe en el umbral.
    float w = luma <= 0.0 ? 0.0 : max(luma - u_threshold, 0.0) / luma;
    fragColor = vec4(c * w * w, 1.0);
    return;
  }

  vec2 o = u_texel * u_dir;
  vec3 sum = texture(u_src, uv).rgb * W0;
  sum += (texture(u_src, uv + o * 1.0).rgb + texture(u_src, uv - o * 1.0).rgb) * W1;
  sum += (texture(u_src, uv + o * 2.0).rgb + texture(u_src, uv - o * 2.0).rgb) * W2;
  sum += (texture(u_src, uv + o * 3.0).rgb + texture(u_src, uv - o * 3.0).rgb) * W3;
  sum += (texture(u_src, uv + o * 4.0).rgb + texture(u_src, uv - o * 4.0).rgb) * W4;
  fragColor = vec4(sum, 1.0);
}
`;class Hn{constructor(e,t=!1){this.canvas=e;const n=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:t,powerPreference:"high-performance"});if(!n)throw new Error("WebGL2 no disponible en este navegador.");this.gl=n,this.caps=Tn(n),this.caps.colorBufferFloat?(this.colorFormat=n.RGBA16F,this.colorType=n.HALF_FLOAT,this.degraded=!1):(this.colorFormat=n.RGBA8,this.colorType=n.UNSIGNED_BYTE,this.degraded=!0),e.addEventListener("webglcontextlost",o=>{o.preventDefault(),this.contextLost=!0,this.onContextChange?.(!0)},!1),e.addEventListener("webglcontextrestored",()=>{this.contextLost=!1,this.onContextChange?.(!1)},!1),this.progBinary=new le(n,Me,Nn,"trazador binaria Brill-Lindquist"),this.progTrace=new le(n,Me,Bn,"trazador Kerr-Newman"),this.progComposite=new le(n,Me,On,"composite"),this.progBloom=new le(n,Me,Un,"bloom"),this.lut=Pn(n,Kt(),Te),this.dummyCube=In(n),this.vao=n.createVertexArray(),this.overlay=new Cn(n),this.mesh=new qn(n)}gl;caps;degraded;progTrace;progBinary;progComposite;progBloom;orbit={m1:.55,m2:.45,a:40,e:0,nu:0};merged=!1;get binaryOrbit(){return this.orbit}get binaryMerged(){return this.merged}resetOrbit(e,t){this.orbit={m1:t.binaryM1,m2:t.binaryM2,a:e.binarySeparation,e:e.binaryEccentricity,nu:0},this.merged=!1}accum=null;latest=null;bloom=null;lut;dummyCube;vao;sampleIndex=0;internalW=0;internalH=0;currentScale=0;frameMsAvg=0;lastWorkAt=0;colorFormat;colorType;diskBrightness=1;tracedFrames=0;autoScale=1;contextLost=!1;onContextChange=null;onAutoDowngrade=null;downgradeNotified=!1;overlay;mesh;invalidate(){this.sampleIndex=0}get stats(){return{samples:this.sampleIndex,targetSamples:0,internalWidth:this.internalW,internalHeight:this.internalH,scale:this.currentScale,frameMs:this.frameMsAvg,converged:!1}}render(e,t,n){const o=this.gl;if(this.contextLost)return null;const i=this.tracedFrames===0,s=n||i?e.interactiveScale:e.renderScale,r=Math.max(.12,s*this.autoScale),l=this.degraded||n||i?1:Math.max(1,e.targetSamples);if(this.resize(r),!this.accum)return null;if(o.bindVertexArray(this.vao),o.disable(o.BLEND),o.disable(o.DEPTH_TEST),e.mode==="mesh")return o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,this.canvas.width,this.canvas.height),o.clearColor(.016,.02,.035,1),o.clear(o.COLOR_BUFFER_BIT),o.bindVertexArray(null),this.mesh.draw({distance:t.camDistanceRg,inclination:e.inclination,azimuth:e.azimuth,tanHalfFov:Math.tan(e.fov/2),aspect:this.canvas.width/Math.max(this.canvas.height,1)},t.bh,e),this.tracedFrames++,{samples:1,targetSamples:1,internalWidth:this.canvas.width,internalHeight:this.canvas.height,scale:1,frameMs:this.frameMsAvg,converged:!0};if(this.sampleIndex<l){const p=performance.now(),[c,m]=this.sampleIndex%2===0?this.accum:[this.accum[1],this.accum[0]];o.bindFramebuffer(o.FRAMEBUFFER,m.fbo),o.viewport(0,0,this.internalW,this.internalH);const g=e.mode==="binary"?this.progBinary:this.progTrace;g.use(),e.mode==="binary"?this.setBinaryUniforms(e,t,n):this.setTraceUniforms(e,t,n),g.tex("u_prevAccum",0,o.TEXTURE_2D,c.tex),g.tex("u_bbLUT",1,o.TEXTURE_2D,this.lut),g.tex("u_starCube",2,o.TEXTURE_CUBE_MAP,this.dummyCube),g.f("u_sampleIndex",this.sampleIndex),o.drawArrays(o.TRIANGLES,0,3),this.sampleIndex++,this.tracedFrames++,this.latest=m;const b=p-this.lastWorkAt;this.lastWorkAt>0&&b>0&&b<2e4&&(this.frameMsAvg=this.frameMsAvg===0?b:this.frameMsAvg*.85+b*.15,this.applyAutoQuality(e)),this.lastWorkAt=p}const h=this.latest;if(!h)return o.bindVertexArray(null),null;const d=e.bloomEnabled&&this.bloom?this.renderBloom(h,e):null;return o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,this.canvas.width,this.canvas.height),this.progComposite.use(),this.progComposite.v2("u_resolution",this.canvas.width,this.canvas.height),this.progComposite.f("u_exposure",e.exposure),this.progComposite.b("u_bloomEnabled",!!d),this.progComposite.f("u_bloomStrength",e.bloomStrength),this.progComposite.tex("u_accum",0,o.TEXTURE_2D,h.tex),this.progComposite.tex("u_bloom",1,o.TEXTURE_2D,d??h.tex),o.drawArrays(o.TRIANGLES,0,3),o.bindVertexArray(null),e.mode==="single"&&this.overlay&&!this.overlay.isEmpty&&e.showOrbits&&this.overlay.draw({r:t.camDistanceRg,theta:e.inclination,phi:e.azimuth,tanHalfFov:Math.tan(e.fov/2),aspect:this.internalW/Math.max(this.internalH,1)},t.bh,e.orbitOpacity,e.bodyClock),{samples:this.sampleIndex,targetSamples:l,internalWidth:this.internalW,internalHeight:this.internalH,scale:this.currentScale,frameMs:this.frameMsAvg,converged:this.sampleIndex>=l}}applyAutoQuality(e){if(!e.autoQuality){this.autoScale=1;return}const t=this.frameMsAvg,n=this.autoScale;t>900?this.autoScale=Math.max(.2,this.autoScale*.6):t>350?this.autoScale=Math.max(.25,this.autoScale*.85):t<90&&this.autoScale<1&&(this.autoScale=Math.min(1,this.autoScale*1.1)),this.autoScale<n&&!this.downgradeNotified&&this.autoScale<.9&&(this.downgradeNotified=!0,this.onAutoDowngrade?.(this.autoScale,t))}get hasRendered(){return this.tracedFrames>0}get isContextLost(){return this.contextLost}renderBloom(e,t){const n=this.gl;if(!this.bloom)return null;const[o,i]=this.bloom;return n.viewport(0,0,o.width,o.height),this.progBloom.use(),this.progBloom.v2("u_resolution",o.width,o.height),n.bindFramebuffer(n.FRAMEBUFFER,o.fbo),this.progBloom.i("u_mode",0),this.progBloom.f("u_threshold",t.bloomThreshold),this.progBloom.v2("u_texel",1/e.width,1/e.height),this.progBloom.tex("u_src",0,n.TEXTURE_2D,e.tex),n.drawArrays(n.TRIANGLES,0,3),n.bindFramebuffer(n.FRAMEBUFFER,i.fbo),this.progBloom.i("u_mode",1),this.progBloom.v2("u_texel",1/o.width,1/o.height),this.progBloom.v2("u_dir",1,0),this.progBloom.tex("u_src",0,n.TEXTURE_2D,o.tex),n.drawArrays(n.TRIANGLES,0,3),n.bindFramebuffer(n.FRAMEBUFFER,o.fbo),this.progBloom.v2("u_dir",0,1),this.progBloom.tex("u_src",0,n.TEXTURE_2D,i.tex),n.drawArrays(n.TRIANGLES,0,3),o.tex}setBinaryUniforms(e,t,n){const o=this.progBinary,i=this.internalW/Math.max(this.internalH,1),{p1:s,p2:r}=rn(this.orbit);o.v3("u_bh1Pos",s[0],s[1],s[2]),o.v3("u_bh2Pos",r[0],r[1],r[2]),o.f("u_bh1Mass",this.orbit.m1),o.f("u_bh2Mass",this.orbit.m2);const l=t.camDistanceRg,u=Math.sin(e.inclination),h=Math.cos(e.inclination),d=Math.sin(e.azimuth),p=Math.cos(e.azimuth),c=[l*u*p,l*u*d,l*h],m=[-u*p,-u*d,-h];let g=-d,b=p,v=0;const f=Math.hypot(g,b,v)||1;g/=f,b/=f,v/=f;const x=b*m[2]-v*m[1],M=v*m[0]-g*m[2],T=g*m[1]-b*m[0];if(o.v3("u_camPos",c[0],c[1],c[2]),o.v3("u_camFwd",m[0],m[1],m[2]),o.v3("u_camRight",g,b,v),o.v3("u_camUp",x,M,T),o.f("u_tanHalfFov",Math.tan(e.fov/2)),o.f("u_aspect",i),o.v2("u_resolution",this.internalW,this.internalH),n||this.sampleIndex===0)o.v2("u_jitter",0,0);else{const E=this.sampleIndex+1;o.v2("u_jitter",_e(E,2)-.5,_e(E,3)-.5)}o.i("u_maxIter",n?Math.round(e.maxIter*.55):e.maxIter),o.f("u_tol",n?e.tolerance*20:e.tolerance),o.f("u_rEscape",e.rEscape),o.f("u_alphaCapture",vn),o.f("u_hInit",Math.max(.05,l*.02)),o.b("u_markNonConverged",e.markNonConverged),o.b("u_showHorizonGrid",e.binaryShowGrid),o.f("u_layerOpacity",e.layerOpacity),o.b("u_starsEnabled",!0),o.f("u_starIntensity",e.starIntensity),o.f("u_starDensity",e.starDensity),o.f("u_milkyWayIntensity",e.milkyWayIntensity),o.b("u_useStarCube",!1),o.f("u_lutLogTMin",ke),o.f("u_lutLogTMax",Oe),this.setGalaxyUniforms(o,e)}setGalaxyUniforms(e,t){const n=Math.max(0,Math.min(4,Math.round(t.galaxyCount)));if(e.i("u_galaxyCount",n),e.f("u_galaxySpiral",t.galaxySpiral),n===0)return;const o=Math.sin(t.inclination),i=Math.cos(t.inclination),s=Math.sin(t.azimuth),r=Math.cos(t.azimuth),l=[-o*r,-o*s,-i],u=Math.abs(l[2])<.9?[0,0,1]:[1,0,0],h=ha(ua(u,l)),d=ua(l,h),p=[[0,0],[.26,.13],[-.19,.31],[.34,-.29]];for(let c=0;c<n;c++){let[m,g]=p[c];c===0&&!t.galaxyAlignBehind&&(m=.22,g=-.16);const b=ha([l[0]+h[0]*m+d[0]*g,l[1]+h[1]*m+d[1]*g,l[2]+h[2]*m+d[2]*g]);e.v3(`u_galaxyDir[${c}]`,b[0],b[1],b[2]);const v=[1,.65,.85,.5][c],f=[.42,.8,.3,.62][c],x=[.4,1.9,2.7,.9][c],M=[1,.55,.7,.4][c];e.v4(`u_galaxyShape[${c}]`,t.galaxySize*v,f,x,t.galaxyBrightness*M);const T=[[.72,.82,1],[1,.86,.62],[.85,.9,1],[1,.78,.55]];e.v3(`u_galaxyColor[${c}]`,T[c][0],T[c][1],T[c][2])}}setTraceUniforms(e,t,n){const o=this.progTrace,i=this.internalW/Math.max(this.internalH,1);if(o.f("u_a",e.spin),o.f("u_q",e.charge),o.v3("u_camPos",t.camDistanceRg,e.inclination,e.azimuth),o.f("u_tanHalfFov",Math.tan(e.fov/2)),o.f("u_aspect",i),o.v2("u_resolution",this.internalW,this.internalH),n||this.sampleIndex===0)o.v2("u_jitter",0,0);else{const s=this.sampleIndex+1;o.v2("u_jitter",_e(s,2)-.5,_e(s,3)-.5)}o.i("u_maxIter",n?Math.round(e.maxIter*.55):e.maxIter),o.f("u_tol",n?e.tolerance*20:e.tolerance),o.f("u_rEscape",e.rEscape),o.f("u_rCapture",t.rCapture),o.f("u_hInit",Math.max(.05,t.camDistanceRg*.02)),o.b("u_markNonConverged",e.markNonConverged),o.b("u_diskEnabled",e.diskEnabled),o.f("u_diskInner",t.rDiskInner),o.f("u_diskOuter",Math.max(e.diskOuter,t.rDiskInner*1.2)),o.f("u_diskTempMax",t.diskTempMaxK),o.f("u_diskBrightness",this.diskBrightness),o.f("u_diskOpacity",e.diskOpacity),o.f("u_diskTurbulence",e.diskTurbulence?1:0),o.f("u_diskPrograde",e.diskPrograde?1:-1),o.f("u_diskTime",this.diskPhase),o.f("u_lutLogTMin",ke),o.f("u_lutLogTMax",Oe),o.b("u_starsEnabled",e.starsEnabled),o.f("u_starIntensity",e.starIntensity),o.f("u_starDensity",e.starDensity),o.f("u_milkyWayIntensity",e.milkyWayIntensity),o.b("u_useStarCube",!1),this.setGalaxyUniforms(o,e),o.b("u_showHorizon",e.showHorizon),o.b("u_showErgosphere",e.showErgosphere),o.b("u_showPhotonSphere",e.showPhotonSphere),o.b("u_showIsco",e.showIsco),o.b("u_showDragGrid",e.showDragGrid),o.f("u_iscoRadius",t.rDiskInner),o.f("u_photonRadius",e.diskPrograde?t.rPhotonPrograde:t.rPhotonRetrograde),o.f("u_dragGridRadius",e.dragGridRadius),o.f("u_layerOpacity",e.layerOpacity)}diskPhase=0;advanceTime(e,t,n){if(t.mode==="binary"){if(!t.binaryEvolving||this.merged)return!1;const s=.02*Math.pow(this.orbit.a,4)/(this.orbit.m1*this.orbit.m2),r=dn(this.orbit,e*s*t.binaryTimeScale);return this.orbit=r.orbit,this.merged=r.merged,!0}if(!t.diskEnabled||t.timeWarp<=0)return!1;const o=1/(Math.pow(n.rDiskInner,1.5)+(t.diskPrograde?t.spin:-t.spin)),i=2*Math.PI/Math.abs(o);return this.diskPhase+=e/12*i*t.timeWarp,!0}updateCalibration(e,t){const i=Yt(e.autoExposure?Math.max(t.diskTempMaxK,1e3):1e5);this.diskBrightness=i>0?.55/i:1}resize(e){const t=this.gl,n=Math.min(window.devicePixelRatio||1,2),o=Math.max(1,this.canvas.clientWidth),i=Math.max(1,this.canvas.clientHeight),s=Math.round(o*n),r=Math.round(i*n);(this.canvas.width!==s||this.canvas.height!==r)&&(this.canvas.width=s,this.canvas.height=r,this.invalidate());const l=Math.max(16,Math.round(s*e)),u=Math.max(16,Math.round(r*e));if(l===this.internalW&&u===this.internalH&&this.accum)return;Q(t,this.accum?.[0]??null),Q(t,this.accum?.[1]??null),Q(t,this.bloom?.[0]??null),Q(t,this.bloom?.[1]??null),this.internalW=l,this.internalH=u,this.currentScale=e;const h=(c,m)=>kn(t,c,m,this.colorFormat,this.colorType);this.accum=[h(l,u),h(l,u)],this.latest=null;const d=Math.max(8,l>>1),p=Math.max(8,u>>1);this.bloom=[h(d,p),h(d,p)],this.invalidate()}screenshot(){return this.canvas.toDataURL("image/png")}dispose(){const e=this.gl;Q(e,this.accum?.[0]??null),Q(e,this.accum?.[1]??null),Q(e,this.bloom?.[0]??null),Q(e,this.bloom?.[1]??null),e.deleteTexture(this.lut),e.deleteTexture(this.dummyCube),e.deleteVertexArray(this.vao),this.progTrace.dispose(),this.progBinary.dispose(),this.progComposite.dispose(),this.progBloom.dispose(),this.overlay.dispose(),this.mesh.dispose()}}function ua(a,e){return[a[1]*e[2]-a[2]*e[1],a[2]*e[0]-a[0]*e[2],a[0]*e[1]-a[1]*e[0]]}function ha(a){const e=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/e,a[1]/e,a[2]/e]}const pa=40,ma=1200;class ze{ctx=null;osc=null;gain=null;running=!1;last={realHz:0,playedHz:0,octaveShift:0};get state(){return this.last}get isRunning(){return this.running}static toAudible(e){if(!(e>0))return{playedHz:0,octaveShift:0};let t=0,n=e;for(;n<pa&&t<80;)n*=2,t++;for(;n>ma&&t>-80;)n/=2,t--;return{playedHz:n,octaveShift:t}}async start(){if(!this.running){if(!this.ctx){const e=window.AudioContext??window.webkitAudioContext;if(!e)throw new Error("Este navegador no soporta AudioContext");this.ctx=new e}this.ctx.state==="suspended"&&await this.ctx.resume(),this.osc=this.ctx.createOscillator(),this.osc.type="sine",this.gain=this.ctx.createGain(),this.gain.gain.setValueAtTime(0,this.ctx.currentTime),this.gain.gain.linearRampToValueAtTime(.12,this.ctx.currentTime+.05),this.osc.connect(this.gain).connect(this.ctx.destination),this.osc.frequency.setValueAtTime(Math.max(this.last.playedHz,pa),this.ctx.currentTime),this.osc.start(),this.running=!0}}stop(){if(!this.running||!this.ctx||!this.osc||!this.gain)return;const e=this.ctx.currentTime;this.gain.gain.cancelScheduledValues(e),this.gain.gain.setValueAtTime(this.gain.gain.value,e),this.gain.gain.linearRampToValueAtTime(0,e+.08),this.osc.stop(e+.1),this.osc=null,this.gain=null,this.running=!1}update(e){const{playedHz:t,octaveShift:n}=ze.toAudible(e);if(this.last={realHz:e,playedHz:t,octaveShift:n},this.running&&this.ctx&&this.osc&&this.gain&&t>0){const o=this.ctx.currentTime;this.osc.frequency.linearRampToValueAtTime(t,o+.03);const i=.05+.1*Math.min(1,Math.pow(t/ma,2/3));this.gain.gain.linearRampToValueAtTime(i,o+.03)}return this.last}dispose(){this.stop(),this.ctx?.close(),this.ctx=null}}const D=a=>a*Math.PI/180,qa=[{id:"m87",name:"M87*",subtitle:"6.5×10⁹ M☉",info:"Primera imagen de un agujero negro (EHT, 2019). La inclinación de ~17° respecto al eje del chorro hace que la sombra se vea casi circular y el anillo casi uniforme.",params:{massSolar:65e8,spin:.9,charge:0,inclination:D(163),distanceRg:55,fov:D(40),distanceMeters:168e5*ne,diskOuter:18,eddingtonRatio:1e-5,timeWarp:1}},{id:"sgra",name:"Sgr A*",subtitle:"4.3×10⁶ M☉",info:"El agujero negro del centro de la Vía Láctea (EHT, 2022). Visto casi de frente al eje, a 8.2 kpc. Su periodo orbital en el ISCO es de ~30 min: es el único cuyo disco varía en escalas de tiempo humanas.",params:{massSolar:43e5,spin:.94,charge:0,inclination:D(30),distanceRg:52,fov:D(40),distanceMeters:8200*ne,diskOuter:16,eddingtonRatio:1e-8,timeWarp:1}},{id:"cygx1",name:"Cygnus X-1",subtitle:"21 M☉",info:"Agujero negro estelar en un sistema binario, con espín casi extremal (a/M > 0.95) y disco a ~10⁷ K: emite sobre todo en rayos X. En la banda visible el brillo superficial es alto pero la cromaticidad ya está saturada en blanco-azul.",params:{massSolar:21,spin:.97,charge:0,inclination:D(63),distanceRg:50,fov:D(40),distanceMeters:2220*ne,diskOuter:18,eddingtonRatio:.02,timeWarp:1}},{id:"kerr-extremal",name:"Kerr extremal",subtitle:"a/M = 0.998",info:"Límite de Thorne: el máximo espín alcanzable por acreción astrofísica. La sombra muestra su borde plano característico del lado prógrado, el ISCO baja a ~1.24 M y la eficiencia de acreción supera el 30%.",params:{massSolar:1e7,spin:.998,charge:0,inclination:D(85),distanceRg:50,fov:D(40),diskOuter:16,showErgosphere:!0,layerOpacity:.7}},{id:"reissner",name:"Reissner-Nordström",subtitle:"a = 0, Q/M = 0.9",info:"Sin espín y con carga: solución estática y esféricamente simétrica. La sombra es circular pero más pequeña que la de Schwarzschild, porque la carga contrae los horizontes. No es astrofísico (el plasma neutraliza la carga), pero es exacto.",params:{massSolar:1e7,spin:0,charge:.9,inclination:D(80),distanceRg:55,fov:D(40),diskOuter:18,showHorizon:!0,showPhotonSphere:!0,layerOpacity:.7}},{id:"schwarzschild",name:"Schwarzschild",subtitle:"a = 0, Q = 0",info:"El caso más simple: sombra circular de radio exactamente √27 M = 5.196 M, esfera de fotones en 3 M, ISCO en 6 M. Es el caso contra el que se valida el trazador.",params:{massSolar:1e7,spin:0,charge:0,inclination:D(84),distanceRg:58,fov:D(40),diskOuter:20,showPhotonSphere:!0,showIsco:!0,layerOpacity:.7}},{id:"kerr-newman",name:"Kerr-Newman",subtitle:"a=0.7, Q=0.6",info:"La solución general: espín y carga a la vez, con a² + q² = 0.85 cerca del límite extremal. Es el caso que da nombre al simulador.",params:{massSolar:1e8,spin:.7,charge:.6,inclination:D(78),distanceRg:48,fov:D(40),diskOuter:15,showErgosphere:!0,showPhotonSphere:!0,layerOpacity:.7}},{id:"naked",name:"Singularidad desnuda",subtitle:"a² + q² > 1",info:"Régimen sin horizonte: a² + q² > 1. Es matemáticamente una solución válida de las ecuaciones de Einstein-Maxwell, pero viola la conjetura de censura cósmica y no se espera que exista. Sin horizonte no hay sombra: los rayos atraviesan la región central.",params:{massSolar:1e7,spin:.9,charge:.75,inclination:D(80),distanceRg:50,fov:D(40),diskOuter:16,diskEnabled:!0,starsEnabled:!0}}];function y(a,e,t){const n=document.createElement(a);return e&&(n.className=e),t!==void 0&&(n.textContent=t),n}function _(a){const e=y("div","ctl"),t=y("div","ctl-label"),n=y("span","name");n.appendChild(y("span",void 0,a.label)),a.symbol&&n.appendChild(y("span","sym",a.symbol));const o=y("span","ctl-value");t.append(n,o);const i=y("input");i.type="range";const s=u=>a.log?Math.log10(u):u,r=u=>a.log?Math.pow(10,u):u;i.min=String(s(a.min)),i.max=String(s(a.max)),i.step=String(a.log?(Math.log10(a.max)-Math.log10(a.min))/1e3:a.step??.001);const l=u=>{o.textContent=a.format(u);const h=s(u),d=Number(i.min),p=Number(i.max),c=p>d?(h-d)/(p-d)*100:0;i.style.setProperty("--fill",`${c}%`)};return i.value=String(s(a.value)),l(a.value),i.addEventListener("input",()=>{const u=r(Number(i.value));l(u),a.onInput(u)}),e.append(t,i),{root:e,set(u){i.value=String(s(u)),l(u)}}}function w(a,e,t){const n=y("label","toggle"),o=y("span",void 0,a),i=y("input");i.type="checkbox",i.checked=e;const s=y("span","sw");return n.append(o,i,s),i.addEventListener("change",()=>t(i.checked)),{root:n,set(r){i.checked=r}}}function fe(a,e,t){const n=y("div","segmented"),o=new Map;for(const i of a){const s=y("button",void 0,i.label);i.title&&(s.title=i.title),i.value===e&&s.classList.add("active"),s.addEventListener("click",()=>{for(const[,r]of o)r.classList.remove("active");s.classList.add("active"),t(i.value)}),o.set(i.value,s),n.appendChild(s)}return{root:n,set(i){for(const[s,r]of o)r.classList.toggle("active",s===i)}}}function U(a,e=!0){const t=y("div",`section${e?"":" closed"}`),n=y("button","section-head");n.appendChild(y("span","chev","▾")),n.appendChild(y("span",void 0,a));const o=y("div","section-body");return n.addEventListener("click",()=>t.classList.toggle("closed")),t.append(n,o),{root:t,body:o}}function z(a){const e=y("div","note");return e.innerHTML=a,e}function Z(a,e,t){const n=y("button","btn",a);return t&&(n.title=t),n.addEventListener("click",e),n}function Gn(a,e,t){const n=y("div","hud-row"),o=y("div","k");o.appendChild(y("span","sym",a)),o.appendChild(y("span","desc",e)),t&&(n.title=t);const i=y("div","v","—");return n.append(o,i),{root:n,set(s,r=!1){i.textContent=s,i.classList.toggle("dim",r)}}}function J(a){const e=y("div","hud-group");return e.appendChild(y("div","hud-group-title",a)),e}const $n="⁰¹²³⁴⁵⁶⁷⁸⁹";function jn(a){return String(a).split("").map(e=>e==="-"?"⁻":$n[Number(e)]??e).join("")}function W(a,e=3){if(!Number.isFinite(a))return"—";if(a===0)return"0";const t=Math.abs(a);if(t>=.001&&t<1e5)return a.toPrecision(e);const n=Math.floor(Math.log10(t));return`${(a/Math.pow(10,n)).toFixed(e-1)}×10${jn(n)}`}function L(a,e=3){return Number.isFinite(a)?a.toFixed(e):"—"}const V=180/Math.PI;class Xn{constructor(e,t){this.root=e,this.opts=t,this.build(),t.store.subscribe(()=>this.sync())}sliders=new Map;toggles=new Map;distMode;diskDir;orbitDir;modeSeg;bodyClockSeg;bodyKindSel;distSlider;syncing=!1;get p(){return this.opts.store.get()}patch(e){this.syncing||this.opts.store.patch(e)}build(){this.root.append(this.buildMode(),this.buildPresets(),this.buildBinary(),this.buildBlackHole(),this.buildCamera(),this.buildDisk(),this.buildBackground(),this.buildLayers(),this.buildMesh(),this.buildOrbits(),this.buildRender())}buildMesh(){const e=U("Malla del espaciotiempo",!0);e.root.dataset.onlyMode="mesh";const t=w("Superficie del embedding",this.p.meshShowSurface,l=>this.patch({meshShowSurface:l}));this.toggles.set("meshShowSurface",t);const n=w("Colorear por dilatación temporal",this.p.meshShowLapse,l=>this.patch({meshShowLapse:l}));n.root.title="El color es el lapso α = dτ/dt. Es la parte que la cama elástica omite, y la que de verdad explica por qué cae un objeto lento.",this.toggles.set("meshShowLapse",n);const o=w("Superficie del horizonte",this.p.meshShowHorizon,l=>this.patch({meshShowHorizon:l}));o.root.title="Con a/M > √3/2 ≈ 0.866 el horizonte no cabe en espacio euclídeo (Smarr 1973) y se marca en rojo.",this.toggles.set("meshShowHorizon",o);const i=_({label:"Radio exterior",symbol:"r",min:5,max:60,step:.5,value:this.p.meshOuterRadius,format:l=>`${l.toFixed(1)} M`,onInput:l=>this.patch({meshOuterRadius:l})});this.sliders.set("meshOuterRadius",i);const s=_({label:"Exageración vertical",min:.2,max:3,step:.05,value:this.p.meshHeightScale,format:l=>Math.abs(l-1)<.03?"1.00× (isométrico)":`${l.toFixed(2)}×`,onInput:l=>this.patch({meshHeightScale:l})});this.sliders.set("meshHeightScale",s);const r=_({label:"Densidad de la rejilla",min:.3,max:2.5,step:.05,value:this.p.meshGridDensity,format:l=>`${l.toFixed(2)}×`,onInput:l=>this.patch({meshGridDensity:l})});return this.sliders.set("meshGridDensity",r),e.body.append(z("La superficie es el <b>embedding isométrico exacto</b> de la rebanada ecuatorial: <code>z(r) = √(8M(r−2M))</code> para Schwarzschild, que reproduce la métrica inducida <code>dr²/(1−2M/r)</code> sin aproximar. Las distancias medidas sobre ella son distancias propias reales."),t.root,n.root,o.root,i.root,s.root,r.root,z('<b>Cuidado con la cama elástica.</b> Esto es <em>una rebanada espacial</em>, no el espaciotiempo; la altura es una dimensión auxiliar que no existe físicamente, y nada cae "hacia abajo" por ella. Y sobre todo: la curvatura del espacio <b>no</b> es lo que hace caer a los objetos — para velocidades bajas casi toda la gravedad newtoniana sale de la curvatura del <b>tiempo</b>. Por eso el color importa más que la forma: es el gradiente del lapso el que produce la caída.')),e.root}buildOrbits(){const e=U("Órbitas de prueba",!1);e.root.dataset.onlyMode="single";const t=w("Mostrar órbitas",this.p.showOrbits,f=>this.patch({showOrbits:f}));this.toggles.set("showOrbits",t);const n=_({label:"Radio de lanzamiento",symbol:"r₀",min:1.5,max:80,step:.1,value:this.p.orbitLaunchRadius,format:f=>`${f.toFixed(1)} M`,onInput:f=>this.patch({orbitLaunchRadius:f})});this.sliders.set("orbitLaunchRadius",n);const o=_({label:"Inclinación de la órbita",min:0,max:85,step:1,value:this.p.orbitInclination*V,format:f=>`${f.toFixed(0)}°`,onInput:f=>this.patch({orbitInclination:f/V})});this.sliders.set("orbitInclination",o);const i=_({label:"Velocidad",symbol:"v/v_circ",min:.4,max:1.35,step:.005,value:this.p.orbitSpeedFraction,format:f=>`${f.toFixed(3)}×`,onInput:f=>this.patch({orbitSpeedFraction:f})});this.sliders.set("orbitSpeedFraction",i);const s=_({label:"Carga de la partícula",symbol:"e/m",min:-2,max:2,step:.02,value:this.p.orbitCharge,format:f=>f===0?"neutra":f.toFixed(2),onInput:f=>this.patch({orbitCharge:f})});this.sliders.set("orbitCharge",s);const r=_({label:"Revoluciones",min:1,max:40,step:1,value:this.p.orbitRevolutions,format:f=>f.toFixed(0),onInput:f=>this.patch({orbitRevolutions:Math.round(f)})});this.sliders.set("orbitRevolutions",r);const l=_({label:"Opacidad",min:.05,max:1,step:.02,value:this.p.orbitOpacity,format:f=>f.toFixed(2),onInput:f=>this.patch({orbitOpacity:f})});this.sliders.set("orbitOpacity",l);const u=fe([{value:"pro",label:"prógrada"},{value:"retro",label:"retrógrada"}],this.p.orbitPrograde?"pro":"retro",f=>this.patch({orbitPrograde:f==="pro"}));this.orbitDir=u;const h=y("div","ctl"),d=y("div","ctl-label");d.append(y("span","name","Cuerpo"));const p=y("select");p.className="select";for(const[f,x]of Object.entries(Ue)){const M=document.createElement("option");M.value=f,M.textContent=x.label,f===this.p.bodyKind&&(M.selected=!0),p.appendChild(M)}p.addEventListener("change",()=>this.patch({bodyKind:p.value})),this.bodyKindSel=p,h.append(d,p);const c=fe([{value:"proper",label:"reloj del cuerpo",title:"Tiempo propio: cruza el horizonte en tiempo finito"},{value:"coordinate",label:"reloj lejano",title:"Tiempo coordenado: parece frenarse y no cruzar nunca"}],this.p.bodyClock,f=>this.patch({bodyClock:f}));this.bodyClockSeg=c;const m=w("Animación en marcha",this.p.bodyPlaying,f=>this.patch({bodyPlaying:f}));this.toggles.set("bodyPlaying",m);const g=w("Repetir al terminar",this.p.bodyLoop,f=>this.patch({bodyLoop:f}));this.toggles.set("bodyLoop",g);const b=_({label:"Velocidad de la animación",min:1,max:2e3,value:this.p.bodySpeed,log:!0,format:f=>`${f.toPrecision(3)} M/s`,onInput:f=>this.patch({bodySpeed:f})});this.sliders.set("bodySpeed",b);const v=y("div","btn-row");return v.append(Z("Colocar cuerpo",()=>this.opts.onLaunchOrbit()),Z("Reiniciar",()=>this.opts.onRewindBodies()),Z("Borrar todos",()=>this.opts.onClearOrbits())),e.body.append(t.root,z("<b>Vista esquemática.</b> Estas líneas se proyectan suponiendo que la luz viaja en línea recta, mientras que la imagen de fondo sí sigue geodésicas. Son un diagrama en el espacio de coordenadas superpuesto a una observación: una órbita que pase por detrás del agujero <em>debería</em> verse deformada por el lente, y aquí aparece recta. Sí se atenúan al pasar tras el horizonte."),h,n.root,o.root,i.root,u.root,s.root,r.root,z("Un planeta o una estrella orbitando un agujero negro <b>es</b> una partícula de prueba: su masa es despreciable, así que sigue exactamente una geodésica temporal del fondo. Eso es relatividad general exacta, no una aproximación. La estrella <b>S2</b> alrededor de Sgr A* es la comprobación observacional: GRAVITY midió su precesión en 2020."),c.root,z("Los dos relojes divergen: en <b>tiempo propio</b> el cuerpo cruza el horizonte en un tiempo finito y corriente; en <b>tiempo coordenado</b> parece frenarse y no llegar nunca. Ninguno es «el correcto» — son dos preguntas distintas."),m.root,g.root,b.root,l.root,v,z("La carga de la <em>partícula</em> es el único lugar donde <code>Q</code> actúa electromagnéticamente: los fotones son neutros y solo la sienten a través de la métrica. Con <code>Q/M > 0</code> y carga no nula, la partícula se desvía de la geodésica por la fuerza de Lorentz del potencial <code>A_μ = −(Qr/Σ)(dt − a sin²θ dφ)</code>.")),e.root}buildMode(){const e=U("Modo",!0);return this.modeSeg=fe([{value:"single",label:"Un agujero",title:"Kerr-Newman: masa, carga y espín"},{value:"binary",label:"Dos agujeros",title:"Brill-Lindquist + post-newtoniano"},{value:"mesh",label:"Malla",title:"Geometría de la rebanada espacial"}],this.p.mode,t=>this.opts.onModeChange(t)),e.body.append(this.modeSeg.root),e.root}buildBinary(){const e=U("Dos agujeros negros",!0);e.root.dataset.onlyMode="binary";const t=_({label:"Reparto de masa",symbol:"m₁/M",min:.05,max:.95,step:.005,value:this.p.binaryMassRatio,format:h=>`${(h*100).toFixed(1)} / ${((1-h)*100).toFixed(1)} %`,onInput:h=>this.patch({binaryMassRatio:h})});this.sliders.set("binaryMassRatio",t);const n=_({label:"Separación",symbol:"a",min:8,max:200,step:.5,value:this.p.binarySeparation,format:h=>`${h.toFixed(1)} M`,onInput:h=>this.patch({binarySeparation:h})});this.sliders.set("binarySeparation",n);const o=_({label:"Excentricidad",symbol:"e",min:0,max:.9,step:.005,value:this.p.binaryEccentricity,format:h=>h.toFixed(3),onInput:h=>this.patch({binaryEccentricity:h})});this.sliders.set("binaryEccentricity",o);const i=w("Inspiral activo",this.p.binaryEvolving,h=>this.patch({binaryEvolving:h}));i.root.title="La órbita decae por emisión de ondas gravitacionales (ecuaciones de Peters). Mientras evoluciona, la imagen se renderiza en tiempo real y no acumula muestras.",this.toggles.set("binaryEvolving",i);const s=_({label:"Velocidad del inspiral",min:.05,max:20,value:this.p.binaryTimeScale,log:!0,format:h=>`${h.toFixed(2)}×`,onInput:h=>this.patch({binaryTimeScale:h})});this.sliders.set("binaryTimeScale",s);const r=w("Rejilla en los horizontes",this.p.binaryShowGrid,h=>this.patch({binaryShowGrid:h}));r.root.title="Colorea cada sombra según qué agujero capturó el rayo",this.toggles.set("binaryShowGrid",r);const l=w("Chirp audible",this.p.chirpAudio,h=>this.patch({chirpAudio:h}));l.root.title="Sonifica la frecuencia de la onda gravitacional. Para masas estelares cae directamente en el rango audible: es el chirp de LIGO.",this.toggles.set("chirpAudio",l);const u=y("div","btn-row");return u.append(Z("Reiniciar órbita",()=>this.opts.onResetOrbit()),Z("GW150914",()=>this.opts.onGW150914(),"Masas y distancia de la primera detección")),e.body.append(z("<b>No existe solución exacta de Einstein para dos agujeros negros.</b> Lo que se traza aquí son <b>datos iniciales de Brill-Lindquist</b>, que sí son solución exacta de las <em>ligaduras</em>: <code>ψ = 1 + m₁/2r₁ + m₂/2r₂</code>, con la métrica <code>ψ⁴δᵢⱼ</code> y el horizonte en <code>ψ = 2</code>. Las órbitas las da la dinámica post-newtoniana, no Einstein: una secuencia de instantáneas no es una fusión simulada. Con <code>m₂ = 0</code> esto es Schwarzschild isótropo, y el trazador reproduce √27 M por esa vía."),t.root,n.root,o.root,i.root,s.root,r.root,l.root,u,z("En este modo no hay disco: lo interesante es el <b>lente doble</b> sobre el fondo estelar, con dos sombras, imágenes múltiples y anillos de Einstein cruzados. Estos agujeros no giran ni tienen carga: la solución es conformemente plana, luego <code>K_ij = 0</code>.")),e.root}buildPresets(){const e=U("Presets",!0),t=y("div","presets");for(const o of qa){const i=y("button");i.appendChild(y("b",void 0,o.name)),i.appendChild(y("span",void 0,o.subtitle)),i.title=o.info??"",i.addEventListener("click",()=>this.opts.onPreset(o)),t.appendChild(i)}const n=y("div","btn-row");return n.append(Z("Vista inicial",()=>this.opts.onResetView()),Z("Capturar PNG",()=>this.opts.onScreenshot()),Z("HUD",()=>this.opts.onToggleHud(),"Mostrar u ocultar el panel de observables")),e.body.append(t,n),e.root}buildBlackHole(){const e=U("Agujero negro",!0);e.root.dataset.hideMode="binary";const t=_({label:"Masa",symbol:"M",min:1,max:1e11,value:this.p.massSolar,log:!0,format:i=>Ht(i),onInput:i=>this.patch({massSolar:i})});this.sliders.set("massSolar",t);const n=_({label:"Momento angular",symbol:"a/M",min:-Ie,max:Ie,step:.001,value:this.p.spin,format:i=>`${i>=0?"+":""}${i.toFixed(3)}`,onInput:i=>this.patch({spin:i})});this.sliders.set("spin",n);const o=_({label:"Carga eléctrica",symbol:"Q/M",min:0,max:1.2,step:.001,value:this.p.charge,format:i=>i.toFixed(3),onInput:i=>this.patch({charge:i})});return this.sliders.set("charge",o),e.body.append(t.root,z("La <b>forma</b> de la imagen depende solo de <code>a/M</code> y <code>Q/M</code>: la masa es el factor de escala. Actúa por el tamaño angular (en modo distancia física), la temperatura del disco <code>T ∝ M^−1/4</code> y el periodo orbital <code>T ∝ M</code>."),n.root,o.root,z("Los agujeros negros reales son neutros: el plasma circundante los descarga hasta <code>Q/M ~ 10⁻¹⁸</code>. Kerr-Newman es exacto como solución de Einstein-Maxwell, pero no astrofísico. La carga contrae los horizontes vía <code>Δ = r² − 2Mr + a² + Q²</code>.")),e.root}buildCamera(){const e=U("Cámara",!0),t=_({label:"Inclinación",symbol:"i",min:1,max:179,step:.5,value:this.p.inclination*V,format:i=>`${i.toFixed(1)}°`,onInput:i=>this.patch({inclination:i/V})});this.sliders.set("inclination",t),this.distMode=fe([{value:"rg",label:"en radios r_g",title:"La geometría no cambia con la masa"},{value:"physical",label:"distancia física",title:"La masa cambia el tamaño angular"}],this.p.distanceMode,i=>this.patch({distanceMode:i})),this.distSlider=_({label:"Distancia",symbol:"r",min:2.2,max:400,step:.1,value:this.p.distanceRg,format:i=>`${i.toFixed(1)} M`,onInput:i=>this.patch({distanceRg:i})});const n=_({label:"Distancia física",symbol:"D",min:1e9,max:1e26,value:this.p.distanceMeters,log:!0,format:i=>Re(i),onInput:i=>this.patch({distanceMeters:i})});this.sliders.set("distanceMeters",n);const o=_({label:"Campo de visión",symbol:"fov",min:4,max:110,step:.5,value:this.p.fov*V,format:i=>`${i.toFixed(0)}°`,onInput:i=>this.patch({fov:i/V})});return this.sliders.set("fov",o),e.body.append(z("Arrastra sobre la imagen para orbitar. Rueda o pinza para acercarte."),t.root,this.distMode.root,this.distSlider.root,n.root,o.root),this.distSlider.root.dataset.mode="rg",n.root.dataset.mode="physical",e.root}buildDisk(){const e=U("Disco de acreción",!0);e.root.dataset.hideMode="binary mesh";const t=w("Disco activo",this.p.diskEnabled,l=>this.patch({diskEnabled:l}));this.toggles.set("diskEnabled",t);const n=_({label:"Radio externo",symbol:"r_out",min:4,max:120,step:.5,value:this.p.diskOuter,format:l=>`${l.toFixed(1)} M`,onInput:l=>this.patch({diskOuter:l})});this.sliders.set("diskOuter",n);const o=_({label:"Tasa de acreción",symbol:"ṁ/ṁ_E",min:1e-9,max:1,value:this.p.eddingtonRatio,log:!0,format:l=>l>=.01?l.toFixed(3):l.toExponential(1),onInput:l=>this.patch({eddingtonRatio:l})});this.sliders.set("eddingtonRatio",o);const i=_({label:"Opacidad",symbol:"τ",min:.05,max:1,step:.01,value:this.p.diskOpacity,format:l=>l.toFixed(2),onInput:l=>this.patch({diskOpacity:l})});this.sliders.set("diskOpacity",i);const s=_({label:"Velocidad de rotación",symbol:"×t",min:0,max:8,step:.05,value:this.p.timeWarp,format:l=>l===0?"pausado":`${l.toFixed(2)}×`,onInput:l=>this.patch({timeWarp:l})});this.sliders.set("timeWarp",s),this.diskDir=fe([{value:"pro",label:"corrotante",title:"El disco gira con el espín"},{value:"retro",label:"contrarrotante",title:"El disco gira contra el espín"}],this.p.diskPrograde?"pro":"retro",l=>this.patch({diskPrograde:l==="pro"}));const r=w("Estructura turbulenta",this.p.diskTurbulence,l=>this.patch({diskTurbulence:l}));return this.toggles.set("diskTurbulence",r),e.body.append(t.root,z("Borde interno fijado en el <b>ISCO</b>. Perfil de Novikov-Thorne <code>T ∝ r^−3/4 [1−√(r_in/r)]^1/4</code>, color de cuerpo negro por ley de Planck, y corrimiento total <code>g</code> que engloba Doppler y redshift gravitacional: de ahí el lado brillante."),n.root,o.root,z("El contraste del beaming depende de la temperatura. La radiación observada de un cuerpo negro con corrimiento <code>g</code> es exactamente un cuerpo negro a <code>g·T</code>. Si el pico de Wien está muy por debajo del visible (disco caliente), la banda visible está en régimen de Rayleigh-Jeans y el contraste va como <code>g</code>; el conocido <code>g⁴</code> es el valor <b>bolométrico</b>. Baja la tasa de acreción hasta <code>T ~ 6000 K</code> y el pico entra en el visible: la asimetría se vuelve exponencialmente más marcada."),i.root,this.diskDir.root,s.root,r.root),e.root}buildBackground(){const e=U("Fondo estelar",!1),t=w("Estrellas",this.p.starsEnabled,d=>this.patch({starsEnabled:d}));this.toggles.set("starsEnabled",t);const n=_({label:"Brillo estelar",min:0,max:4,step:.05,value:this.p.starIntensity,format:d=>d.toFixed(2),onInput:d=>this.patch({starIntensity:d})});this.sliders.set("starIntensity",n);const o=_({label:"Densidad",min:.05,max:1,step:.01,value:this.p.starDensity,format:d=>d.toFixed(2),onInput:d=>this.patch({starDensity:d})});this.sliders.set("starDensity",o);const i=_({label:"Banda galáctica",min:0,max:2,step:.02,value:this.p.milkyWayIntensity,format:d=>d.toFixed(2),onInput:d=>this.patch({milkyWayIntensity:d})});this.sliders.set("milkyWayIntensity",i);const s=_({label:"Galaxias de fondo",min:0,max:4,step:1,value:this.p.galaxyCount,format:d=>d===0?"ninguna":`${d.toFixed(0)}`,onInput:d=>this.patch({galaxyCount:Math.round(d)})});this.sliders.set("galaxyCount",s);const r=_({label:"Tamaño angular",min:.01,max:.3,step:.005,value:this.p.galaxySize,format:d=>`${(d*180/Math.PI).toFixed(1)}°`,onInput:d=>this.patch({galaxySize:d})});this.sliders.set("galaxySize",r);const l=_({label:"Brillo de las galaxias",min:0,max:4,step:.05,value:this.p.galaxyBrightness,format:d=>d.toFixed(2),onInput:d=>this.patch({galaxyBrightness:d})});this.sliders.set("galaxyBrightness",l);const u=_({label:"Brazos espirales",min:0,max:2,step:.05,value:this.p.galaxySpiral,format:d=>d===0?"elípticas":d.toFixed(2),onInput:d=>this.patch({galaxySpiral:d})});this.sliders.set("galaxySpiral",u);const h=w("Alinear una detrás del agujero",this.p.galaxyAlignBehind,d=>this.patch({galaxyAlignBehind:d}));return h.root.title="Coloca la primera galaxia justo detrás del agujero negro respecto a la cámara: es la configuración que produce un anillo de Einstein completo.",this.toggles.set("galaxyAlignBehind",h),e.body.append(t.root,z("El fondo se deflecta con las geodésicas reales: los arcos y las imágenes múltiples alrededor de la sombra son <b>anillos de Einstein</b>, no un efecto de dibujado. El color de cada estrella sale de la misma LUT de cuerpo negro que el disco."),n.root,o.root,i.root,z("<b>Las galaxias van de fondo, no en órbita.</b> Una galaxia tiene ~10¹¹ masas solares y ~30 kpc de diámetro: es mucho más masiva y más grande que cualquier agujero negro, así que no lo orbita — el agujero está en <em>su</em> centro. Lo que sí es real es su <b>lente gravitacional</b>: arcos, imágenes múltiples y anillos de Einstein. Es lo que observan Hubble y JWST, y aquí lo produce el propio trazado, no un efecto dibujado."),s.root,r.root,l.root,u.root,h.root),e.root}buildLayers(){const e=U("Capas geométricas",!1);e.root.dataset.onlyMode="single";const t=[["showHorizon","Horizonte de sucesos","Rejilla sobre r₊, donde el rayo es capturado"],["showErgosphere","Ergosfera","r_E(θ) = 1 + √(1 − q² − a²cos²θ): se achata con el espín"],["showPhotonSphere","Esfera de fotones","Órbita circular de fotones"],["showIsco","ISCO","Última órbita circular estable"],["showDragGrid","Malla de arrastre","Rejilla de coordenadas coloreada por ω"]];for(const[i,s,r]of t){const l=w(s,this.p[i],u=>this.patch({[i]:u}));l.root.title=r,this.toggles.set(i,l),e.body.appendChild(l.root)}const n=_({label:"Radio de la malla",symbol:"r",min:2,max:40,step:.1,value:this.p.dragGridRadius,format:i=>`${i.toFixed(1)} M`,onInput:i=>this.patch({dragGridRadius:i})});this.sliders.set("dragGridRadius",n);const o=_({label:"Opacidad de capas",min:0,max:1.5,step:.02,value:this.p.layerOpacity,format:i=>i.toFixed(2),onInput:i=>this.patch({layerOpacity:i})});return this.sliders.set("layerOpacity",o),e.body.append(n.root,o.root,z("Estas superficies se detectan <b>dentro</b> del trazador, en los cruces reales del rayo: aparecen con su lente gravitacional correcto, no como un dibujo encima. El horizonte de Cauchy (r₋) no se puede dibujar: está dentro de r₊ y ningún rayo lo alcanza, así que solo se reporta como número.")),e.root}buildRender(){const e=U("Render",!1),t=_({label:"Resolución (reposo)",min:.25,max:1,step:.05,value:this.p.renderScale,format:c=>`${(c*100).toFixed(0)}%`,onInput:c=>this.patch({renderScale:c})});this.sliders.set("renderScale",t);const n=_({label:"Resolución (arrastrando)",min:.15,max:1,step:.05,value:this.p.interactiveScale,format:c=>`${(c*100).toFixed(0)}%`,onInput:c=>this.patch({interactiveScale:c})});this.sliders.set("interactiveScale",n);const o=_({label:"Iteraciones por rayo",symbol:"máx",min:150,max:3e3,step:10,value:this.p.maxIter,format:c=>c.toFixed(0),onInput:c=>this.patch({maxIter:Math.round(c)})});this.sliders.set("maxIter",o);const i=_({label:"Tolerancia del integrador",symbol:"tol",min:1e-7,max:.001,value:this.p.tolerance,log:!0,format:c=>c.toExponential(1),onInput:c=>this.patch({tolerance:c})});this.sliders.set("tolerance",i);const s=_({label:"Muestras acumuladas",symbol:"spp",min:1,max:512,step:1,value:this.p.targetSamples,format:c=>c.toFixed(0),onInput:c=>this.patch({targetSamples:Math.round(c)})});this.sliders.set("targetSamples",s);const r=_({label:"Exposición",min:.02,max:20,value:this.p.exposure,log:!0,format:c=>`${c.toFixed(2)}×`,onInput:c=>this.patch({exposure:c})});this.sliders.set("exposure",r);const l=w("Exposición automática",this.p.autoExposure,c=>this.patch({autoExposure:c}));l.root.title="Compensa que la radiancia visible crece ~lineal con T. Desactívala para ver el brillo relativo físico entre masas.",this.toggles.set("autoExposure",l);const u=w("Bloom",this.p.bloomEnabled,c=>this.patch({bloomEnabled:c}));this.toggles.set("bloomEnabled",u);const h=_({label:"Intensidad del bloom",min:0,max:2,step:.02,value:this.p.bloomStrength,format:c=>c.toFixed(2),onInput:c=>this.patch({bloomStrength:c})});this.sliders.set("bloomStrength",h);const d=w("Calidad adaptativa",this.p.autoQuality,c=>this.patch({autoQuality:c}));d.root.title="Baja la resolución interna si la GPU no llega. Conviene dejarlo activo: un pase demasiado lento puede hacer que el driver reinicie la GPU y el canvas se quede en negro.",this.toggles.set("autoQuality",d);const p=w("Diagnóstico: rayos sin converger",this.p.markNonConverged,c=>this.patch({markNonConverged:c}));return p.root.title="Pinta de magenta los píxeles que agotaron el presupuesto de iteraciones. Si aparecen, sube «Iteraciones por rayo».",this.toggles.set("markNonConverged",p),e.body.append(t.root,n.root,o.root,i.root,s.root,r.root,l.root,u.root,h.root,d.root,p.root,z("El coste es intrínseco: un rayo integrado por píxel. Al arrastrar se baja la resolución y el presupuesto de pasos; al soltar se acumulan muestras jittereadas hasta el objetivo.")),e.root}sync(){this.syncing=!0;const e=this.p;this.sliders.get("massSolar")?.set(e.massSolar),this.sliders.get("spin")?.set(e.spin),this.sliders.get("charge")?.set(e.charge),this.sliders.get("inclination")?.set(e.inclination*V),this.sliders.get("distanceMeters")?.set(e.distanceMeters),this.sliders.get("fov")?.set(e.fov*V),this.sliders.get("diskOuter")?.set(e.diskOuter),this.sliders.get("eddingtonRatio")?.set(e.eddingtonRatio),this.sliders.get("diskOpacity")?.set(e.diskOpacity),this.sliders.get("timeWarp")?.set(e.timeWarp),this.sliders.get("starIntensity")?.set(e.starIntensity),this.sliders.get("starDensity")?.set(e.starDensity),this.sliders.get("milkyWayIntensity")?.set(e.milkyWayIntensity),this.sliders.get("dragGridRadius")?.set(e.dragGridRadius),this.sliders.get("layerOpacity")?.set(e.layerOpacity),this.sliders.get("renderScale")?.set(e.renderScale),this.sliders.get("interactiveScale")?.set(e.interactiveScale),this.sliders.get("maxIter")?.set(e.maxIter),this.sliders.get("tolerance")?.set(e.tolerance),this.sliders.get("targetSamples")?.set(e.targetSamples),this.sliders.get("exposure")?.set(e.exposure),this.sliders.get("bloomStrength")?.set(e.bloomStrength),this.sliders.get("orbitLaunchRadius")?.set(e.orbitLaunchRadius),this.sliders.get("orbitInclination")?.set(e.orbitInclination*V),this.sliders.get("orbitSpeedFraction")?.set(e.orbitSpeedFraction),this.sliders.get("orbitCharge")?.set(e.orbitCharge),this.sliders.get("orbitRevolutions")?.set(e.orbitRevolutions),this.sliders.get("orbitOpacity")?.set(e.orbitOpacity),this.distSlider.set(e.distanceRg);for(const[t,n]of this.toggles)n.set(e[t]);this.distMode?.set(e.distanceMode),this.diskDir?.set(e.diskPrograde?"pro":"retro"),this.orbitDir?.set(e.orbitPrograde?"pro":"retro"),this.sliders.get("binaryMassRatio")?.set(e.binaryMassRatio),this.sliders.get("binarySeparation")?.set(e.binarySeparation),this.sliders.get("binaryEccentricity")?.set(e.binaryEccentricity),this.sliders.get("binaryTimeScale")?.set(e.binaryTimeScale),this.sliders.get("meshOuterRadius")?.set(e.meshOuterRadius),this.sliders.get("meshHeightScale")?.set(e.meshHeightScale),this.sliders.get("meshGridDensity")?.set(e.meshGridDensity),this.sliders.get("bodySpeed")?.set(e.bodySpeed),this.sliders.get("galaxyCount")?.set(e.galaxyCount),this.sliders.get("galaxySize")?.set(e.galaxySize),this.sliders.get("galaxyBrightness")?.set(e.galaxyBrightness),this.sliders.get("galaxySpiral")?.set(e.galaxySpiral),this.modeSeg?.set(e.mode),this.bodyClockSeg?.set(e.bodyClock),this.bodyKindSel&&(this.bodyKindSel.value=e.bodyKind);for(const t of this.root.querySelectorAll("[data-mode]"))t.style.display=t.dataset.mode===e.distanceMode?"":"none";for(const t of this.root.querySelectorAll("[data-only-mode]")){const n=(t.dataset.onlyMode??"").split(/\s+/);t.style.display=n.includes(e.mode)?"":"none"}for(const t of this.root.querySelectorAll("[data-hide-mode]")){const n=(t.dataset.hideMode??"").split(/\s+/);t.style.display=n.includes(e.mode)?"none":""}this.syncing=!1}}class Wn{constructor(e,t){this.root=e,this.build(),t.subscribe((n,o)=>this.update(n,o))}rows=new Map;add(e,t,n,o,i){const s=Gn(n,o,i);this.rows.set(t,s),e.appendChild(s.root)}build(){const e=J("Geometría");this.add(e,"extremality","a²+q²","extremalidad","Debe ser ≤ 1 para que exista horizonte"),this.add(e,"rPlus","r₊","horizonte de sucesos"),this.add(e,"rMinus","r₋","horizonte de Cauchy","Interior a r₊: causalmente inaccesible, no se puede observar"),this.add(e,"rErgoEq","r_E","ergosfera (ecuador)"),this.add(e,"rErgoPole","r_E","ergosfera (polo)","Coincide con r₊ en el eje"),this.add(e,"kappa","κ","gravedad superficial","Vale 1/4 para Schwarzschild"),this.add(e,"area","A_H","área del horizonte");const t=J("Órbitas");this.add(t,"rPhPro","r_ph","fotones (prógrada)","Vale 3 M para Schwarzschild"),this.add(t,"rPhRetro","r_ph","fotones (retrógrada)"),this.add(t,"rIscoPro","r_ISCO","ISCO prógrado","Vale 6 M para Schwarzschild"),this.add(t,"rIscoRetro","r_ISCO","ISCO retrógrado"),this.add(t,"eff","η","eficiencia de acreción","1 − E_ISCO; 5.72% para Schwarzschild"),this.add(t,"iscoPeriod","T_ISCO","periodo orbital");const n=J("Sombra");this.add(n,"shadowAreal","R_s","radio areal","En unidades de M/r_obs. Vale √27 = 5.196 para Schwarzschild"),this.add(n,"shadowAsym","Δ","asimetría","(máx − mín)/(máx + mín); 0 = circular"),this.add(n,"shadowAng","θ_s","radio angular");const o=J("Observador");this.add(o,"camDist","r_obs","distancia"),this.add(o,"camDistPhys","","distancia física"),this.add(o,"lapse","α","dilatación temporal","Lapso ZAMO dτ/dt en la cámara"),this.add(o,"omega","ω","arrastre de marcos","dφ/dt del marco local en la cámara");const i=J("Disco");this.add(i,"tmax","T_máx","temperatura máxima"),this.add(i,"wien","λ_pico","pico de Wien"),this.add(i,"visfrac","f_vis","fracción visible","Parte del flujo bolométrico en 360–830 nm"),this.add(i,"rin","r_in","borde interno");const s=J("Escalas físicas");this.add(s,"rg","r_g","radio gravitacional","GM/c² = 1.477 km × (M/M☉)"),this.add(s,"rs","r_s","radio de Schwarzschild","2GM/c²"),this.add(s,"tg","t_g","tiempo gravitacional","GM/c³"),this.add(s,"thawking","T_H","temperatura de Hawking");const r=J("Binaria");r.dataset.onlyMode="binary",this.add(r,"binM","m₁/m₂","masas de puntura","En unidades de la masa ADM total, que para Brill-Lindquist es m₁+m₂"),this.add(r,"binSep","a","separación coordenada"),this.add(r,"binProper","ℓ","separación propia","Distancia propia entre horizontes: mayor que la coordenada"),this.add(r,"binHor","r₊","horizontes isótropos","Cada uno en r = m/2"),this.add(r,"binMc","M_c","masa de chirp","(m₁m₂)^(3/5)/M^(1/5): el parámetro que fija el inspiral"),this.add(r,"binF","f_gw","frecuencia de la onda"),this.add(r,"binFCut","f_corte","corte del modelo","El inspiral post-newtoniano deja de valer en a = 6M"),this.add(r,"binMerge","t_c","tiempo a la fusión"),this.add(r,"binChirp","♪","chirp audible");const l=J("Malla");l.dataset.onlyMode="mesh",this.add(l,"meshDepth","z","profundidad de la garganta"),this.add(l,"meshProper","ℓ","distancia propia r₊→10M","Comparar con la diferencia de coordenadas: la malla se estira de verdad"),this.add(l,"meshCoord","Δr","diferencia coordenada"),this.add(l,"meshHorEmb","—","horizonte sumergible","Con a/M > √3/2 ≈ 0.866 el horizonte no cabe en espacio euclídeo (Smarr 1973)"),this.add(l,"meshLapseH","α","lapso en r = 3M","Ritmo del tiempo propio frente al coordenado"),this.root.append(e,t,n,o,i,r,l,s)}update(e,t){const n=(u,h,d=!1)=>this.rows.get(u)?.set(h,d),o=!t.hasHorizon;for(const u of this.root.querySelectorAll("[data-only-mode]"))u.style.display=(u.dataset.onlyMode??"").split(/\s+/).includes(e.mode)?"":"none";n("extremality",L(t.extremality,4),!1);const i=this.rows.get("extremality");i&&(i.root.style.color=t.extremality>1?"var(--danger)":""),n("rPlus",o?"sin horizonte":`${L(t.rPlus)} M`,o),n("rMinus",o?"sin horizonte":`${L(t.rMinus)} M`,!0),n("rErgoEq",`${L(t.rErgoEquator)} M`),n("rErgoPole",`${L(t.rErgoPole)} M`),n("kappa",o?"—":`${L(t.surfaceGravity,4)} /M`,o),n("area",o?"—":`${L(4*Math.PI*(t.rPlus*t.rPlus+t.bh.a*t.bh.a),2)} M²`,o),n("rPhPro",`${L(t.rPhotonPrograde)} M`),n("rPhRetro",`${L(t.rPhotonRetrograde)} M`),n("rIscoPro",`${L(t.rIscoPrograde)} M`),n("rIscoRetro",`${L(t.rIscoRetrograde)} M`),n("eff",`${(t.efficiency*100).toFixed(2)} %`),n("iscoPeriod",Fe(t.iscoPeriodSeconds)),n("shadowAreal",o?"no hay sombra":`${L(t.shadowArealRadius)} M`,o),n("shadowAsym",o?"—":L(t.shadowAsymmetry,4),o);const s=Ut(t.shadowAngularRad);if(n("shadowAng",o?"—":s<1e3?`${W(s)} µas`:`${W(t.shadowAngularRad*1e3)} mrad`,o),n("camDist",`${L(t.camDistanceRg,2)} M`),n("camDistPhys",Re(t.camDistanceRg*t.rgMeters),!0),n("lapse",L(t.camLapse,4)),n("omega",`${W(t.camOmega)} /M`),e.diskEnabled)n("tmax",`${W(t.diskTempMaxK)} K`),n("wien",`${W(Vt(t.diskTempMaxK)*1e9)} nm`),n("visfrac",`${(Qt(t.diskTempMaxK)*100).toPrecision(3)} %`),n("rin",`${L(t.rDiskInner)} M`);else for(const u of["tmax","wien","visfrac","rin"])n(u,"disco apagado",!0);n("binM",`${t.binaryM1.toFixed(3)} / ${t.binaryM2.toFixed(3)}`),n("binSep",`${e.binarySeparation.toFixed(1)} M`),n("binProper",`${t.binaryProperSeparation.toFixed(1)} M`),n("binHor",`${t.binaryR1.toFixed(3)} / ${t.binaryR2.toFixed(3)} M`),n("binMc",`${t.chirpMassGeom.toFixed(4)} M · ${W(t.chirpMassSolar)} M☉`),n("binF",`${W(t.gwFrequencyHz)} Hz`),n("binFCut",`${W(t.cutoffFrequencyHz)} Hz`),n("binMerge",t.mergerTimeSeconds>0?Fe(t.mergerTimeSeconds):"ya en fusión",t.mergerTimeSeconds<=0);const r=ze.toAudible(t.gwFrequencyHz);n("binChirp",e.chirpAudio?r.octaveShift===0?`${r.playedHz.toFixed(1)} Hz (real)`:`${r.playedHz.toFixed(1)} Hz (${r.octaveShift>0?"+":""}${r.octaveShift} oct)`:"apagado",!e.chirpAudio),n("meshDepth",`${L(t.meshDepth,2)} M`),n("meshProper",Number.isFinite(t.properDistanceToTen)?`${L(t.properDistanceToTen,2)} M`:"—"),n("meshCoord",t.hasHorizon?`${L(10-t.rPlus,2)} M`:"—",!0),n("meshHorEmb",t.hasHorizon?t.horizonEmbeddingFails?"NO (a/M > √3/2)":"sí":"—");const l=this.rows.get("meshHorEmb");l&&(l.root.style.color=t.horizonEmbeddingFails?"var(--warn)":""),n("meshLapseH",L(Da(3,t.bh),4)),n("rg",Re(t.rgMeters)),n("rs",Re(2*t.rgMeters)),n("tg",Fe(t.tgSeconds)),n("thawking",Number.isFinite(t.hawkingTempK)?`${W(t.hawkingTempK)} K`:"—",!Number.isFinite(t.hawkingTempK))}}class Vn{constructor(e,t){this.root=e,this.store=t,t.subscribe(()=>this.render())}transient=new Map;flash(e,t,n,o=9e3,i="ℹ"){this.transient.set(e,{def:{id:e,level:t,icon:i,html:n},until:Date.now()+o}),this.render(),window.setTimeout(()=>{const s=this.transient.get(e);s&&Date.now()>=s.until&&(this.transient.delete(e),this.render())},o+50)}compute(e,t){const n=[];return t.hasHorizon?t.extremality>.995&&n.push({id:"extremal",level:"warn",icon:"⚠",html:`<b>Régimen casi extremal</b> — <code>a² + q² = ${t.extremality.toFixed(4)}</code>. Los dos horizontes casi coinciden y la precisión de coma flotante de 32 bits del shader se degrada junto a <code>r₊</code>. Los observables del HUD (calculados en doble precisión) siguen siendo fiables.`}):n.push({id:"naked",level:"danger",icon:"⚠",html:`<b>Singularidad desnuda</b> — <code>a² + q² = ${t.extremality.toFixed(3)} > 1</code>. Sin horizonte de sucesos y por tanto sin sombra. Es una solución exacta de Einstein-Maxwell, pero viola la censura cósmica: no se espera que exista. Los rayos se terminan cerca de la singularidad en anillo, que es una elección de renderizado, no física.`}),t.hasHorizon&&t.camDistanceRg<t.rErgoEquator*1.05&&n.push({id:"ergo",level:"info",icon:"◉",html:"<b>Cámara dentro de la ergosfera</b> — aquí no existe ningún observador estático: el arrastre de marcos obliga a co-rotar. La cámara es un <b>ZAMO</b>, que sí existe, y por eso la imagen sigue siendo consistente."}),e.charge>.01&&n.push({id:"charge",level:"info",icon:"ℹ",html:`<b>Carga no astrofísica</b> — <code>Q/M = ${e.charge.toFixed(3)}</code>. Los agujeros negros reales se descargan hasta <code>Q/M ~ 10⁻¹⁸</code> por el plasma circundante. La geometría es exacta; el escenario no es observable.`}),e.markNonConverged&&n.push({id:"diag",level:"info",icon:"⬤",html:"<b>Modo diagnóstico</b> — los píxeles magenta son rayos que agotaron el presupuesto de iteraciones sin caer ni escapar. Si aparecen alrededor del anillo de fotones, sube «Iteraciones por rayo»."}),e.autoExposure||n.push({id:"autoexp",level:"info",icon:"◐",html:"<b>Exposición física</b> — sin compensación automática. El brillo superficial visible de un cuerpo negro crece aproximadamente <code>∝ T</code> en la banda visible, así que al bajar la masa (<code>T ∝ M^−1/4</code>) el disco se ve genuinamente más brillante."}),n}render(){const e=this.store.get(),t=this.store.getDerived(),n=Date.now(),o=[...[...this.transient.values()].filter(i=>i.until>n).map(i=>i.def),...this.compute(e,t)];this.root.replaceChildren();for(const i of o){const s=y("div",`warning ${i.level}`);s.appendChild(y("span","icon",i.icon));const r=y("span");r.innerHTML=i.html,s.appendChild(r),this.root.appendChild(s)}}}const Ba=document.getElementById("view"),He=document.getElementById("notice"),Kn=document.getElementById("panel"),Yn=document.getElementById("panel-body"),Ae=document.getElementById("panel-toggle"),Na=document.getElementById("hud"),Qn=document.getElementById("hud-body"),Zn=document.getElementById("warnings"),Jn=document.getElementById("stats");function Ye(a,e,t){He.hidden=!1;const n=y("div","notice-inner");n.appendChild(y("h2",void 0,a));const o=y("p");o.innerHTML=e,n.appendChild(o),t&&n.appendChild(y("pre",void 0,t)),He.replaceChildren(n)}let k;const A=new En(q),eo=new URLSearchParams(location.search).get("capture")==="1";try{k=new Hn(Ba,eo)}catch(a){throw Ye("No se pudo inicializar WebGL2","Este simulador integra geodésicas en la GPU y necesita <code>WebGL2</code>. Prueba con una versión reciente de Chrome, Edge, Firefox o Safari 15+, y comprueba que la aceleración por hardware esté activada.",a instanceof Error?a.message:String(a)),a}const F=new Vn(Zn,A);k.onContextChange=a=>{a?Ye("Se perdió el contexto WebGL","La GPU reinició el driver mientras se trazaba la imagen. En Windows esto lo provoca el <code>watchdog TDR</code> cuando un solo dibujado tarda más de unos dos segundos, y es la causa habitual de una pantalla en negro sin ningún error. <b>Recarga la página</b>; al arrancar se reduce la calidad automáticamente. Si vuelve a pasar, baja «Resolución (reposo)» e «Iteraciones por rayo» en el panel de Render.",`GPU: ${k.caps.renderer}`):He.hidden=!0};k.onAutoDowngrade=(a,e)=>{F.flash("autoquality","warn",`<b>Calidad reducida automáticamente</b> — un pase tardaba ${e.toFixed(0)} ms, así que la resolución interna se bajó al ${(a*100).toFixed(0)} % de la elegida. Esto evita que el driver reinicie la GPU. Puedes desactivarlo en Render → «Calidad adaptativa».`,14e3,"⚠")};function Oa(){if(!(k.hasRendered||k.isContextLost)){if(document.visibilityState!=="visible"){document.addEventListener("visibilitychange",function a(){document.visibilityState==="visible"&&(document.removeEventListener("visibilitychange",a),window.setTimeout(Oa,1e4))});return}Ye("No se ha podido dibujar ningún frame","El trazador se inicializó (los shaders compilaron correctamente) pero no ha completado ningún pase. Suele deberse a una GPU sin aceleración por hardware o a un contexto bloqueado. Prueba a recargar; si persiste, comprueba que la aceleración por hardware esté activada en el navegador.",`GPU: ${k.caps.renderer}
EXT_color_buffer_float: ${k.caps.colorBufferFloat}`)}}window.setTimeout(Oa,1e4);k.degraded&&F.flash("degraded","warn","<b>Sin objetivos de coma flotante</b> — falta <code>EXT_color_buffer_float</code>. Se renderiza en 8 bits por canal y sin acumulación progresiva: la imagen tendrá más ruido y menos rango dinámico. La física del trazado no cambia.",2e4,"⚠");let de=!1;const ue=new Rn(Ba,{inclination:q.inclination,azimuth:q.azimuth,distance:q.distanceRg},{minDistance:Fa(q.spin,q.charge),onChange:a=>{if(de)return;if(de=!0,A.get().distanceMode==="physical"){const t=A.getDerived();A.patch({inclination:a.inclination,azimuth:a.azimuth,distanceMeters:a.distance*t.rgMeters})}else A.patch({inclination:a.inclination,azimuth:a.azimuth,distanceRg:a.distance});de=!1}});A.subscribe((a,e)=>{if(k.updateCalibration(a,e),ue.setDistanceLimits(Fa(a.spin,a.charge),4e3),de)return;const t=ue.get(),n=1e-9,o=e.camDistanceRg;(Math.abs(t.inclination-a.inclination)>n||Math.abs(t.azimuth-a.azimuth)>n||Math.abs(t.distance-o)>n)&&(de=!0,ue.set({inclination:a.inclination,azimuth:a.azimuth,distance:o}),de=!1)});A.subscribe(()=>k.invalidate());function ao(a){const e=A.get();if(a===e.mode)return;const t=a==="binary"?{distanceMode:"rg",distanceRg:Math.max(2.4*e.binarySeparation,60),inclination:22*Math.PI/180,fov:45*Math.PI/180}:a==="mesh"?{distanceMode:"rg",distanceRg:45,inclination:65*Math.PI/180,fov:45*Math.PI/180}:{distanceMode:"rg",distanceRg:q.distanceRg,inclination:q.inclination,fov:q.fov};A.patch({mode:a,...t}),a==="binary"&&k.resetOrbit(A.get(),A.getDerived())}function Ua(a){A.patch(a.params),a.info&&F.flash(`preset-${a.id}`,"info",`<b>${a.name}</b> — ${a.info}`,14e3,"★")}const fa=[[.45,1,.62],[1,.78,.32],[.55,.72,1],[1,.48,.72],[.72,1,.95],[.9,.6,1]];function Ha(){const a=A.get(),e=A.getDerived(),t=e.bh,n=a.orbitLaunchRadius,o=Math.PI/2-a.orbitInclination,i=to(n,o,t,a.orbitPrograde);if(!Number.isFinite(i)){F.flash("orbit-fail","warn",`<b>No hay órbita circular en r = ${n.toFixed(1)} M</b> — está por dentro de la órbita de fotones. Prueba un radio mayor.`,8e3,"⚠");return}const s=Math.min(.9995,i*a.orbitSpeedFraction),r=a.orbitPrograde?1:-1;try{const{y:l,k:u}=Pt(n,o,[0,0,r*s],t,a.orbitCharge),h=2*Math.PI*Math.pow(n,1.5),d=It(l,u,t,{tauMax:a.orbitRevolutions*h,maxSteps:12e4}),p=fa[k.overlay.list.length%fa.length],c=Ue[a.bodyKind]??Ue.sun,m=nn(c,a.massSolar,e.rPlus,d.rMin),g=c.albedo??(()=>{const M=ge(c.temperatureK),T=Math.max(M.chroma[0],M.chroma[1],M.chroma[2],1e-6);return[M.chroma[0]/T,M.chroma[1]/T,M.chroma[2]/T]})();if(k.overlay.add({label:`${c.label} · r₀=${n.toFixed(1)}M`,color:p,points:zn(d),info:{outcome:d.outcome,rMin:d.rMin,rMax:d.rMax,charged:a.orbitCharge!==0,eps:a.orbitCharge,orbits:Math.abs(d.phiTotal)/(2*Math.PI)},body:{result:d,radiusRg:on(c,a.massSolar),tidalRg:m.swallowedWhole?NaN:m.rTidal,bodyColor:g,time:0,durationProper:aa(d,"proper"),durationCoordinate:aa(d,"coordinate")}}),ia(c,a.massSolar)>sn&&F.flash("testparticle","warn",`<b>Fuera del régimen de partícula de prueba</b> — ${c.label} tiene una masa de ${(ia(c,a.massSolar)*100).toPrecision(3)} % la del agujero negro. Por encima del 0.1 % el cuerpo perturba la métrica y tratarlo como geodésica del fondo fijo deja de ser defendible. Sube la masa del agujero para volver al régimen válido.`,16e3,"⚠"),m.swallowedWhole)F.flash("tidal","info",`<b>${c.label} caería entera</b> — su radio de marea (${m.rTidal.toPrecision(3)} M) queda DENTRO del horizonte (${e.rPlus.toFixed(2)} M). Es lo que pasa en los agujeros supermasivos: <code>r_t/r_g ∝ M⁻²ᐟ³</code>, así que cuanto más masivo el agujero, más adentro queda el radio de marea. Por eso no se ven eventos de disrupción en los más grandes.`,16e3,"ℹ");else if(m.disrupts){const M=Lt(d,m.rTidal,a.bodyClock);F.flash("tidal","warn",`<b>${c.label} se desgarra por marea</b> — cruza su radio de marea de ${m.rTidal.toPrecision(3)} M`+(M?` tras ${M.time.toPrecision(3)} M de tiempo ${a.bodyClock==="proper"?"propio":"coordenado"}`:"")+". El marcador se pone rojo a partir de ahí. La app no simula los restos: modelar la disrupción exige hidrodinámica, no una geodésica.",16e3,"⚠")}const b={captured:"cae al agujero",escaped:"escapa al infinito",complete:"órbita acotada",maxSteps:"integración truncada",stopped:"detenida"}[d.outcome],v=wt(d),f=zt(d),x=[`<b>Partícula lanzada</b> — ${b}`,`r ∈ [${d.rMin.toFixed(2)}, ${d.rMax.toFixed(2)}] M`,`${(Math.abs(d.phiTotal)/(2*Math.PI)).toFixed(1)} vueltas`];v!==null&&x.push(`precesión del periastro ${(v*180/Math.PI).toFixed(2)}°/órbita`),f!==null&&Math.abs(f)>1e-4&&x.push(`precesión nodal (Lense-Thirring) ${(f*180/Math.PI).toFixed(3)}°/órbita`),a.orbitCharge!==0&&a.charge>0&&x.push("con fuerza de Lorentz activa"),F.flash("orbit","info",x.join(" · "),12e3,"◠")}catch(l){F.flash("orbit-fail","warn",`<b>No se pudo trazar la órbita</b> — ${l instanceof Error?l.message:String(l)}`,8e3,"⚠")}}function to(a,e,t,n){const o=$e(a,t,n);if(!Number.isFinite(o))return NaN;const i=Ge(a,e,t),s=ya(a,e,t);if(s<=0)return NaN;const r=Le(a,e,t),l=Math.abs((o-i)*Math.sqrt(Math.max(r.g_phiphi,0))/s);return l<1?l:NaN}const ce=new ze;A.subscribe(a=>{a.chirpAudio&&a.mode==="binary"&&!ce.isRunning?ce.start().catch(e=>{F.flash("audio","warn",`<b>No se pudo iniciar el audio</b> — ${e instanceof Error?e.message:String(e)}`,6e3,"⚠"),A.patch({chirpAudio:!1})}):(!a.chirpAudio||a.mode!=="binary")&&ce.isRunning&&ce.stop()});new Xn(Yn,{store:A,onPreset:Ua,onModeChange:ao,onLaunchOrbit:Ha,onResetOrbit:()=>{k.resetOrbit(A.get(),A.getDerived()),k.invalidate(),F.flash("orbit-reset","info","<b>Órbita reiniciada</b>",3e3,"↺")},onGW150914:()=>{A.patch({mode:"binary",massSolar:65,binaryMassRatio:36/65,binarySeparation:60,binaryEccentricity:0,binaryEvolving:!0,distanceMode:"rg",distanceRg:70,inclination:70*Math.PI/180}),k.resetOrbit(A.get(),A.getDerived());const a=A.getDerived();F.flash("gw150914","info",`<b>GW150914</b> — la primera detección directa de ondas gravitacionales (2015): 36 + 29 M☉ a 410 Mpc. Masa de chirp ${a.chirpMassSolar.toFixed(1)} M☉. El modelo de inspiral corta en ${a.cutoffFrequencyHz.toFixed(0)} Hz; el pico observado fue de ~250 Hz, que ya es la fusión propiamente dicha y requiere relatividad numérica.`,18e3,"★")},onClearOrbits:()=>{k.overlay.clear(),F.flash("orbit","info","<b>Órbitas borradas</b>",3e3,"◠")},onRewindBodies:()=>k.overlay.rewind(),onResetView:()=>{A.patch({inclination:q.inclination,azimuth:q.azimuth,distanceRg:q.distanceRg,fov:q.fov,distanceMode:"rg"})},onScreenshot:()=>{const a=k.screenshot(),e=document.createElement("a"),t=A.get();e.href=a,e.download=`kerr-newman_a${t.spin.toFixed(3)}_q${t.charge.toFixed(3)}.png`,e.click(),F.flash("shot","info","<b>Captura guardada</b> — PNG del canvas en su estado actual.",4e3,"⬇")},onToggleHud:()=>Na.classList.toggle("hidden")});new Wn(Qn,A);Ae.addEventListener("click",()=>{const a=Kn.classList.toggle("collapsed");Ae.textContent=a?"›":"‹",Ae.title=a?"Mostrar panel (H)":"Ocultar panel (H)"});window.addEventListener("keydown",a=>{a.target instanceof HTMLInputElement||((a.key==="h"||a.key==="H")&&Ae.click(),(a.key==="j"||a.key==="J")&&Na.classList.toggle("hidden"),a.key===" "&&(a.preventDefault(),A.patch({timeWarp:A.get().timeWarp===0?1:0})))});const K={res:y("span"),spp:y("span"),ms:y("span"),gpu:y("span")};K.gpu.textContent=no(k.caps.renderer);K.gpu.title=`${k.caps.renderer}
EXT_color_buffer_float: ${k.caps.colorBufferFloat}`;Jn.append(K.res,K.spp,K.ms,K.gpu);function no(a){const e=a.match(/ANGLE \(([^,]+), ([^,)]+)/);return e?e[2].replace(/ Direct3D.*| \(0x[0-9A-Fa-f]+\)| vs_\d+_\d+.*/g,"").trim():a.slice(0,42)}function oo(a,e=!1){a&&(K.res.innerHTML=`<span class="s-val">${a.internalWidth}×${a.internalHeight}</span> @ ${(a.scale*100).toFixed(0)}%`,K.spp.innerHTML=e?`<span class="s-val">${a.samples} spp</span> · cuerpo en movimiento`:a.converged?`<span class="conv">${a.samples} spp · convergido</span>`:`<span class="s-val">${a.samples}/${a.targetSamples}</span> spp`,K.ms.innerHTML=`<span class="s-val">${a.frameMs.toFixed(1)}</span> ms`)}let ga=performance.now(),ba=!1,Ga=null;window.__sim={store:A,renderer:k,camera:ue,presets:qa,applyPreset:Ua,launchOrbit:Ha,get lastStats(){return Ga}};function $a(a){const e=Math.min((a-ga)/1e3,.1);ga=a,ue.update();const t=A.get(),n=A.getDerived(),o=k.advanceTime(e,t,n);if(o&&k.invalidate(),t.mode==="binary"&&ce.isRunning){const l=k.binaryOrbit;ce.update(2*We(l.a,t.massSolar))}let i=!1;t.mode==="single"&&t.showOrbits&&t.bodyPlaying&&(i=k.overlay.advance(e*t.bodySpeed,t.bodyClock,t.bodyLoop));const s=ue.isInteracting||o;s!==ba&&(k.invalidate(),ba=s);const r=k.render(t,n,s);r&&(Ga=r),oo(r,i),requestAnimationFrame($a)}requestAnimationFrame($a);window.addEventListener("resize",()=>k.invalidate());
