(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=a(o);fetch(o.href,s)}})();function xt(t,e,a,n=1e-12,o=200){let s=t(e),r=t(a);if(s===0)return e;if(r===0)return a;if(s*r>0)return NaN;let i=e,c=s,l=a-e,u=l;for(let d=0;d<o;d++){Math.abs(c)<Math.abs(r)&&(e=a,a=i,i=e,s=r,r=c,c=s);const p=2*Number.EPSILON*Math.abs(a)+.5*n,h=.5*(i-a);if(Math.abs(h)<=p||r===0)return a;if(Math.abs(u)>=p&&Math.abs(s)>Math.abs(r)){let m,g;const x=r/s;if(e===i)m=2*h*x,g=1-x;else{const y=s/c,_=r/c;m=x*(2*h*y*(y-_)-(a-e)*(_-1)),g=(y-1)*(_-1)*(x-1)}m>0&&(g=-g),m=Math.abs(m),2*m<Math.min(3*h*g-Math.abs(p*g),Math.abs(u*g))?(u=l,l=m/g):(l=h,u=l)}else l=h,u=l;e=a,s=r,a+=Math.abs(l)>p?l:h>0?p:-p,r=t(a),r*c>0&&(i=e,c=s,u=a-e,l=u)}return a}function Ve(t,e,a,n=512,o=!1,s=1e-12){const r=(a-e)/n,i=[];for(let u=0;u<=n;u++)i.push(e+u*r);o&&i.reverse();let c=i[0],l=t(c);for(let u=1;u<i.length;u++){const d=i[u],p=t(d);if(Number.isFinite(l)&&Number.isFinite(p)&&l*p<=0){const[h,m]=c<d?[c,d]:[d,c];return xt(t,h,m,s)}c=d,l=p}return NaN}function _t(t,e,a,n=1e-10,o=400){const s=(Math.sqrt(5)-1)/2;let r=a-s*(a-e),i=e+s*(a-e),c=t(r),l=t(i);for(let u=0;u<o&&a-e>n;u++)c<l?(a=i,i=r,l=c,r=a-s*(a-e),c=t(r)):(e=r,r=i,c=l,i=e+s*(a-e),l=t(i));return .5*(e+a)}function z(t,e){return t*t-2*t+e.a*e.a+e.q*e.q}function J(t,e,a){const n=Math.cos(e);return t*t+a.a*a.a*n*n}function ee(t,e,a){const n=Math.sin(e),o=t*t+a.a*a.a;return o*o-a.a*a.a*z(t,a)*n*n}function te(t){const e=1-t.a*t.a-t.q*t.q;if(e<0)return{rPlus:NaN,rMinus:NaN,hasHorizon:!1,isExtremal:!1};const a=Math.sqrt(e);return{rPlus:1+a,rMinus:1-a,hasHorizon:!0,isExtremal:e<1e-12}}function Fe(t,e){const a=Math.cos(t),n=1-e.q*e.q-e.a*e.a*a*a;return n<0?NaN:1+Math.sqrt(n)}function yt(t){const e=te(t);return e.hasHorizon?(e.rPlus-e.rMinus)/(2*(e.rPlus*e.rPlus+t.a*t.a)):NaN}function pe(t,e,a){const n=Math.sin(e),o=n*n,s=J(t,e,a),r=z(t,a),i=ee(t,e,a),c=a.a;return{g_tt:-(r-c*c*o)/s,g_tphi:-c*o*(t*t+c*c-r)/s,g_phiphi:i*o/s,g_rr:s/r,g_thth:s}}function Ke(t,e,a){const n=Math.sin(e),o=n*n,s=J(t,e,a),r=z(t,a),i=ee(t,e,a),c=a.a;return{gtt:-i/(s*r),gtphi:-c*(t*t+c*c-r)/(s*r),gphiphi:(r-c*c*o)/(s*r*o),grr:r/s,gthth:1/s}}function Me(t,e,a){return a.a*(t*t+a.a*a.a-z(t,a))/ee(t,e,a)}function Ye(t,e,a){const n=z(t,a)*J(t,e,a)/ee(t,e,a);return n<=0?0:Math.sqrt(n)}function Et(t,e,a){const n=Math.max(Math.abs(Math.sin(e)),1e-9),o=J(t,e,a),s=z(t,a),r=ee(t,e,a),i=Me(t,e,a),c=Math.sqrt(r/(s*o));return{e0:[c,0,0,c*i],er:[0,Math.sqrt(s/o),0,0],eth:[0,0,1/Math.sqrt(o),0],ephi:[0,0,0,Math.sqrt(o)/(Math.sqrt(r)*n)]}}function Mt(t,e){const a=e.a,n=e.q*e.q,o=t*t,s=o*t,r=-2/o+2*n/s,i=-a*r,c=2*t-2*a*a/o+2*a*a*n/s;return{dg_tt:r,dg_tphi:i,dg_phiphi:c}}function Se(t,e,a=!0){const{dg_tt:n,dg_tphi:o,dg_phiphi:s}=Mt(t,e),r=o*o-n*s;if(r<0)return NaN;const i=a?1:-1;return(-o+i*Math.sqrt(r))/s}function St(t,e,a=!0){const n=Se(t,e,a),o=pe(t,Math.PI/2,e);return o.g_tt+2*n*o.g_tphi+n*n*o.g_phiphi}function G(t,e=!0){const a=te(t),n=a.hasHorizon?a.rPlus+1e-9:1e-6;return Ve(o=>St(o,t,e),n,12,4096,!0)}function Qe(t,e,a=!0){const n=Se(t,e,a),o=pe(t,Math.PI/2,e),s=o.g_tt+2*n*o.g_tphi+n*n*o.g_phiphi;return s>=0?NaN:-(1/Math.sqrt(-s))*(o.g_tt+n*o.g_tphi)}function xe(t,e=!0){const a=G(t,e);if(!Number.isFinite(a))return NaN;const n=a*(1+1e-6)+1e-9;return _t(r=>{const i=Qe(r,t,e);return Number.isFinite(i)?i:1e9},n,60,1e-12)}function Tt(t,e=!0){const a=xe(t,e);return 1-Qe(a,t,e)}function Te(t,e,a){const n=J(t,e,a),o=Math.sin(e);return{A_t:-a.q*t/n,A_phi:a.q*t*a.a*o*o/n}}function Rt(t,e=.001){const a=te(t);return a.hasHorizon?a.rPlus*(1+e):.001}const kt=1/5,Pt=3/40,It=9/40,wt=3/10,Lt=-9/10,At=6/5,Ct=-11/54,Dt=5/2,Ft=-70/27,qt=35/27,zt=1631/55296,Ot=175/512,Nt=575/13824,Bt=44275/110592,Ut=253/4096,Ht=37/378,$t=250/621,Gt=125/594,Xt=512/1771,Wt=2825/27648,jt=18575/48384,Vt=13525/55296,Kt=277/14336,Yt=1/4;function U(t,e,...a){const n=[...t];for(const[o,s]of a)for(let r=0;r<6;r++)n[r]+=e*o*s[r];return n}const Qt=.001;function Zt(t,e,a){const n=a(t),o=a(U(t,e,[kt,n])),s=a(U(t,e,[Pt,n],[It,o])),r=a(U(t,e,[wt,n],[Lt,o],[At,s])),i=a(U(t,e,[Ct,n],[Dt,o],[Ft,s],[qt,r])),c=a(U(t,e,[zt,n],[Ot,o],[Nt,s],[Bt,r],[Ut,i])),l=U(t,e,[Ht,n],[$t,s],[Gt,r],[Xt,c]),u=U(t,e,[Wt,n],[jt,s],[Vt,r],[Kt,i],[Yt,c]);let d=0;for(let p=1;p<6;p++){const h=Math.abs(t[p])+Math.abs(l[p])+Qt;d=Math.max(d,Math.abs(l[p]-u[p])/h)}return{y5:l,err:d}}const ge=1e-7;function Ze(t){const e=Math.sin(t);return Math.abs(e)>=ge?t:Math.cos(t)>0?ge:Math.PI-ge}function _e(t,e,a){const n=t[1],o=t[2],s=Ke(n,Ze(o),a),r=Te(n,o,a),i=-e.E-e.eps*r.A_t,c=e.L-e.eps*r.A_phi,l=t[4],u=t[5];return .5*(s.gtt*i*i+2*s.gtphi*i*c+s.gphiphi*c*c+s.grr*l*l+s.gthth*u*u)}const qe=.001,Jt=1e-10;function ze(t,e,a,n,o){const s=r=>{const i=[...t];return i[n]+=r,_e(i,e,a)};return(-s(2*o)+8*s(o)-8*s(-o)+s(-2*o))/(12*o)}function ea(t,e,a){const n=t[1],o=t[2],s=Ke(n,Ze(o),a),r=Te(n,o,a),i=-e.E-e.eps*r.A_t,c=e.L-e.eps*r.A_phi,l=s.gtt*i+s.gtphi*c,u=s.grr*t[4],d=s.gthth*t[5],p=s.gtphi*i+s.gphiphi*c,h=qe*Math.max(1,n),m=qe;return[l,u,d,p,-ze(t,e,a,1,h),-ze(t,e,a,2,m)]}function ta(t,e,a,n,o=0){const s=a[0]**2+a[1]**2+a[2]**2;if(s>=1)throw new Error(`velocidad local |v| = ${Math.sqrt(s)} >= c`);const r=1/Math.sqrt(1-s),i=Et(t,e,n),c=r*i.e0[0],l=r*a[0]*i.er[1],u=r*a[1]*i.eth[2],d=r*(i.e0[3]+a[2]*i.ephi[3]),p=pe(t,e,n),h=p.g_tt*c+p.g_tphi*d,m=p.g_rr*l,g=p.g_thth*u,x=p.g_tphi*c+p.g_phiphi*d,y=Te(t,e,n);return{y:[0,t,e,0,m,g],k:{E:-(h+o*y.A_t),L:x+o*y.A_phi,eps:o,mu:1}}}function aa(t,e,a,n={}){const o=Math.max(n.tol??1e-9,Jt),s=n.maxSteps??2e5,r=n.tauMax??2e3,i=n.stride??1,c=1-a.a*a.a-a.q*a.q,l=c>=0?1+Math.sqrt(c):0,u=n.rCapture??(l>0?l*(1+.001):.001),d=n.rEscape??1e4,p=C=>ea(C,e,a),h=_e(t,e,a);let m=[...t],g=.05,x=0,y=0,_="maxSteps",O=0,k=m[1],N=m[1];const B=[[...m]];for(;y<s&&x<r;){const C=Math.max(1e-9,.2*(m[1]-u));g>C&&(g=C);const{y5:me,err:Y}=Zt(m,g,p);if(Y>o&&g>1e-12){g*=Math.max(.2,.9*Math.pow(o/Y,.2));continue}if(m=me,x+=g,y++,k=Math.min(k,m[1]),N=Math.max(N,m[1]),O=Math.max(O,Math.abs(_e(m,e,a)-h)),y%i===0&&B.push([...m]),m[1]<=u){_="captured";break}if(m[1]>=d){_="escaped";break}g*=Math.min(5,.9*Math.pow(o/Math.max(Y,1e-18),.2))}return _==="maxSteps"&&x>=r&&(_="complete"),{outcome:_,path:B,cartesian:B.map(se),steps:y,tau:x,maxHamiltonianDrift:O,rMin:k,rMax:N,phiTotal:m[3]-t[3]}}function se(t){const e=t[1],a=t[2],n=t[3];return[e*Math.sin(a)*Math.cos(n),e*Math.sin(a)*Math.sin(n),e*Math.cos(a)]}function na(t){return Je(oa(t))}function Je(t){if(t.length<2)return null;let e=0;for(let n=1;n<t.length;n++)e+=t[n]-t[n-1];const a=e/(t.length-1);return a-2*Math.PI*Math.sign(a)}function oa(t,e){const a=t.path,n=[];for(let o=1;o<a.length;o++){const s=a[o-1][4],r=a[o][4];if(!(s<0&&r>=0))continue;const c=s/(s-r);n.push(a[o-1][3]+c*(a[o][3]-a[o-1][3]))}return n}function sa(t){const e=t.path,a=[];for(let n=1;n<e.length;n++){const o=Math.cos(e[n-1][2]),s=Math.cos(e[n][2]);if(o>0&&s<=0){const r=o/(o-s);a.push(e[n-1][3]+r*(e[n][3]-e[n-1][3]))}}return Je(a)}function Re(t,e){const a=e.a,n=z(t,e),o=t-1,s=((t*t+a*a)*o-2*t*n)/(a*o),r=4*t*t*n/(o*o)-(s-a)*(s-a);return{xi:s,eta:r}}function ra(t,e,a){const{xi:n,eta:o}=Re(t,a),s=Math.sin(e),r=Math.cos(e);if(Math.abs(s)<1e-9){if(Math.abs(n)>1e-6)return null;const l=o+a.a*a.a;return l<0?null:{alpha:Math.sqrt(l),beta:0}}const i=-n/s,c=o+a.a*a.a*r*r-n*n*r*r/(s*s);return c<0?null:{alpha:i,beta:Math.sqrt(c)}}function ia(t,e,a=512){const n=l=>{const u=[];for(let d=0;d<=a;d++){const p=Math.PI*d/a;u.push({alpha:l*Math.cos(p),beta:l*Math.sin(p)})}return u};if(Math.abs(t.a)<1e-7)return n(ke(t));if(Math.abs(Math.sin(e))<1e-6)return n(da(t));const o=G(t,!0),s=G(t,!1),r=Math.min(o,s),i=Math.max(o,s),c=[];for(let l=0;l<=a;l++){const u=r+(i-r)*l/a,d=ra(u,e,t);d&&c.push(d)}return c}function ke(t){const e=(3+Math.sqrt(9-8*t.q*t.q))/2,a=z(e,t),n=e-1;return Math.sqrt(4*e*e*a/(n*n))}function et(t,e,a=1024){const n=ia(t,e,a);if(n.length===0)return{rMax:NaN,rMin:NaN,rAreal:NaN,centroidAlpha:NaN,asymmetry:NaN};const o=[...n,...n.slice(0,-1).reverse().map(d=>({alpha:d.alpha,beta:-d.beta}))];let s=0,r=0;for(let d=0;d<o.length;d++){const p=o[d],h=o[(d+1)%o.length],m=p.alpha*h.beta-h.alpha*p.beta;s+=m,r+=(p.alpha+h.alpha)*m}const i=Math.abs(s/2),c=s!==0?r/(3*s):0;let l=-1/0,u=1/0;for(const d of o){const p=Math.hypot(d.alpha-c,d.beta);p>l&&(l=p),p<u&&(u=p)}return{rMax:l,rMin:u,rAreal:Math.sqrt(i/Math.PI),centroidAlpha:c,asymmetry:(l-u)/(l+u)}}function ca(t,e,a=Math.PI/2){const n=Math.abs(e.a)<1e-7?ke(e):et(e,a,256).rAreal,o=1-2/t+e.q*e.q/(t*t);if(o<=0)return NaN;const s=n/t*Math.sqrt(o);return s>=1?Math.PI/2:Math.asin(s)}function la(t){if(Math.abs(t.a)<1e-9)return(3+Math.sqrt(9-8*t.q*t.q))/2;const e=G(t,!0),a=G(t,!1);return Ve(n=>Re(n,t).xi,Math.min(e,a),Math.max(e,a),2048)}function da(t){if(Math.abs(t.a)<1e-7)return ke(t);const e=la(t);if(!Number.isFinite(e))return NaN;const{eta:a}=Re(e,t),n=a+t.a*t.a;return n<0?NaN:Math.sqrt(n)}const ua=66743e-15,T=299792458,re=662607015e-42,tt=1380649e-29,ha=re/(2*Math.PI),pa=198892e25,Oe=149597870700,H=0x6da012f95c9e88;function Pe(t){return ua*t*pa/(T*T)}function ma(t){return Pe(t)/T}const fa=1e7,ga=10,Ne=.1;function ba(t,e=Ne,a=1){return fa*Math.pow(t/ga,-.25)*Math.pow(e/Ne,.25)*a}function va(t,e){const a=t/Pe(e)*T*T;return ha*a/(2*Math.PI*tt*T)}function xa(t){return t*(180/Math.PI)*3600*1e6}function ie(t){const e=Math.abs(t);return e<1e3?`${t.toPrecision(4)} m`:e<.01*Oe?`${(t/1e3).toPrecision(4)} km`:e<.1*H?`${(t/Oe).toPrecision(4)} AU`:e<1e3*H?`${(t/H).toPrecision(4)} pc`:`${(t/(1e6*H)).toPrecision(4)} Mpc`}function Be(t){const e=Math.abs(t);return e<1e-6?`${(t*1e9).toPrecision(3)} ns`:e<.001?`${(t*1e6).toPrecision(3)} µs`:e<1?`${(t*1e3).toPrecision(3)} ms`:e<120?`${t.toPrecision(3)} s`:e<7200?`${(t/60).toPrecision(3)} min`:e<2*86400?`${(t/3600).toPrecision(3)} h`:e<3*365.25*86400?`${(t/86400).toPrecision(3)} d`:`${(t/(365.25*86400)).toPrecision(3)} yr`}function _a(t){if(t<1e3)return`${t.toPrecision(3)} M☉`;const e=Math.floor(Math.log10(t));return`${(t/Math.pow(10,e)).toFixed(2)}×10${Ea(e)} M☉`}const ya="⁰¹²³⁴⁵⁶⁷⁸⁹";function Ea(t){return String(t).split("").map(e=>e==="-"?"⁻":ya[Number(e)]??e).join("")}const ue=.998,R={massSolar:65e8,spin:.9,charge:0,distanceRg:60,distanceMeters:523e21,distanceMode:"rg",inclination:78*Math.PI/180,azimuth:0,fov:40*Math.PI/180,diskEnabled:!0,diskOuter:18,eddingtonRatio:.1,diskOpacity:1,diskTurbulence:!0,diskPrograde:!0,timeWarp:0,starsEnabled:!0,starIntensity:1,starDensity:.5,milkyWayIntensity:.35,showHorizon:!1,showErgosphere:!1,showPhotonSphere:!1,showIsco:!1,showDragGrid:!1,dragGridRadius:8,layerOpacity:.8,showOrbits:!0,orbitOpacity:.9,orbitLaunchRadius:14,orbitInclination:25*Math.PI/180,orbitSpeedFraction:.97,orbitCharge:0,orbitPrograde:!0,orbitRevolutions:6,renderScale:1,interactiveScale:.4,maxIter:900,tolerance:1e-5,rEscape:300,targetSamples:192,exposure:1,autoExposure:!0,bloomEnabled:!0,bloomStrength:.55,bloomThreshold:1,markNonConverged:!1,autoQuality:!0};function Ue(t){const e={a:t.spin,q:t.charge},a=te(e),n=t.diskPrograde,o=xe(e,!0),s=xe(e,!1),r=n?o:s,i=Pe(t.massSolar),c=t.distanceMode==="rg"?t.distanceRg:Math.max(t.distanceMeters/i,2.2),l=yt(e),u=et(e,t.inclination,256),d=ba(t.massSolar,t.eddingtonRatio),p=ma(t.massSolar),h=1/(Math.pow(r,1.5)+(n?e.a:-e.a)),m=2*Math.PI/Math.abs(h)*p;return{bh:e,extremality:e.a*e.a+e.q*e.q,hasHorizon:a.hasHorizon,isExtremal:a.isExtremal,rPlus:a.rPlus,rMinus:a.rMinus,rErgoEquator:Fe(Math.PI/2,e),rErgoPole:Fe(0,e),rPhotonPrograde:G(e,!0),rPhotonRetrograde:G(e,!1),rIscoPrograde:o,rIscoRetrograde:s,rDiskInner:r,surfaceGravity:l,hawkingTempK:Number.isFinite(l)?va(l,t.massSolar):NaN,efficiency:Tt(e,n),shadowArealRadius:u.rAreal,shadowAsymmetry:u.asymmetry,shadowAngularRad:ca(c,e,t.inclination),rgMeters:i,tgSeconds:p,camDistanceRg:c,camLapse:Ye(c,t.inclination,e),camOmega:Me(c,t.inclination,e),diskTempMaxK:d,iscoPeriodSeconds:m,rCapture:Rt(e)}}class Ma{params;derived;listeners=new Set;constructor(e=R){this.params={...e},this.derived=Ue(this.params)}get(){return this.params}getDerived(){return this.derived}patch(e){let a=!1;for(const[n,o]of Object.entries(e))this.params[n]!==o&&(this.params[n]=o,a=!0);if(a){this.clampSpin(),this.derived=Ue(this.params);for(const n of this.listeners)n(this.params,this.derived)}}clampSpin(){this.params.spin=Math.max(-ue,Math.min(ue,this.params.spin)),this.params.charge=Math.max(0,Math.min(1.4,this.params.charge))}subscribe(e){return this.listeners.add(e),e(this.params,this.derived),()=>this.listeners.delete(e)}}const Sa={minDistance:2.2,maxDistance:4e3,rotateSpeed:.006,damping:.86},He=.02;class Ta{constructor(e,a,n){this.canvas=e,this.opts={...Sa,...n},this.state={...a},this.attach()}opts;state;velIncl=0;velAzim=0;velZoom=0;dragging=!1;pointers=new Map;lastPinchDist=0;lastX=0;lastY=0;idleFrames=0;disposed=!1;detach=[];get(){return this.state}set(e,a=!0){Object.assign(this.state,e),this.clamp(),a&&(this.velIncl=0,this.velAzim=0,this.velZoom=0),this.opts.onChange(this.state,!1)}setDistanceLimits(e,a){this.opts.minDistance=e,this.opts.maxDistance=a,this.clamp()}get isInteracting(){return this.dragging||this.idleFrames<2}attach(){const e=this.canvas,a=i=>{e.setPointerCapture(i.pointerId),this.pointers.set(i.pointerId,{x:i.clientX,y:i.clientY}),this.pointers.size===1?(this.dragging=!0,this.lastX=i.clientX,this.lastY=i.clientY,this.velIncl=0,this.velAzim=0):this.pointers.size===2&&(this.lastPinchDist=this.pinchDistance()),e.style.cursor="grabbing"},n=i=>{if(!this.pointers.has(i.pointerId))return;if(this.pointers.set(i.pointerId,{x:i.clientX,y:i.clientY}),this.pointers.size>=2){const u=this.pinchDistance();if(this.lastPinchDist>0&&u>0){const d=this.lastPinchDist/u;this.state.distance*=d,this.clamp(),this.emit(!0)}this.lastPinchDist=u;return}if(!this.dragging)return;const c=i.clientX-this.lastX,l=i.clientY-this.lastY;this.lastX=i.clientX,this.lastY=i.clientY,this.velAzim=-c*this.opts.rotateSpeed,this.velIncl=-l*this.opts.rotateSpeed,this.state.azimuth+=this.velAzim,this.state.inclination+=this.velIncl,this.clamp(),this.emit(!0)},o=i=>{this.pointers.delete(i.pointerId),e.hasPointerCapture(i.pointerId)&&e.releasePointerCapture(i.pointerId),this.pointers.size===0&&(this.dragging=!1,e.style.cursor="grab"),this.pointers.size<2&&(this.lastPinchDist=0)},s=i=>{i.preventDefault();const c=i.deltaMode===1?16:i.deltaMode===2?100:1;this.velZoom+=i.deltaY*c/900},r=i=>i.preventDefault();e.addEventListener("pointerdown",a),e.addEventListener("pointermove",n),e.addEventListener("pointerup",o),e.addEventListener("pointercancel",o),e.addEventListener("wheel",s,{passive:!1}),e.addEventListener("contextmenu",r),e.style.cursor="grab",e.style.touchAction="none",this.detach=[()=>e.removeEventListener("pointerdown",a),()=>e.removeEventListener("pointermove",n),()=>e.removeEventListener("pointerup",o),()=>e.removeEventListener("pointercancel",o),()=>e.removeEventListener("wheel",s),()=>e.removeEventListener("contextmenu",r)]}update(){if(this.disposed)return!1;let e=!1;return!this.dragging&&(Math.abs(this.velIncl)>1e-6||Math.abs(this.velAzim)>1e-6)&&(this.state.azimuth+=this.velAzim,this.state.inclination+=this.velIncl,this.velAzim*=this.opts.damping,this.velIncl*=this.opts.damping,e=!0),Math.abs(this.velZoom)>1e-5&&(this.state.distance*=Math.exp(this.velZoom),this.velZoom*=this.opts.damping,e=!0),e?(this.clamp(),this.emit(!0),this.idleFrames=0):this.dragging?this.idleFrames=0:this.idleFrames++,e}emit(e){this.idleFrames=0,this.opts.onChange(this.state,e)}pinchDistance(){const e=[...this.pointers.values()];return e.length<2?0:Math.hypot(e[0].x-e[1].x,e[0].y-e[1].y)}clamp(){this.state.inclination=Math.max(He,Math.min(Math.PI-He,this.state.inclination)),this.state.distance=Math.max(this.opts.minDistance,Math.min(this.opts.maxDistance,this.state.distance));const e=Math.PI*2;this.state.azimuth=(this.state.azimuth%e+e)%e}dispose(){this.disposed=!0;for(const e of this.detach)e();this.detach=[]}}function at(t,e){const a=1-t*t-e*e,n=a>=0?1+Math.sqrt(a):0;return Math.max(2.2,n*1.35)}function Ra(t){const e=!!t.getExtension("EXT_color_buffer_float"),a=!!t.getExtension("OES_texture_float_linear"),n=t.getExtension("WEBGL_debug_renderer_info"),o=n?String(t.getParameter(n.UNMASKED_RENDERER_WEBGL)):"desconocido";return{colorBufferFloat:e,floatLinear:a,maxTextureSize:t.getParameter(t.MAX_TEXTURE_SIZE),renderer:o}}function $e(t,e,a,n){const o=t.createShader(e);if(t.shaderSource(o,a),t.compileShader(o),!t.getShaderParameter(o,t.COMPILE_STATUS)){const s=t.getShaderInfoLog(o)??"";throw t.deleteShader(o),new Error(`Error compilando ${n}:
${s}
${ka(a,s)}`)}return o}function ka(t,e){const a=new Set;for(const s of e.matchAll(/:(\d+):/g))a.add(Number(s[1]));if(a.size===0)return"";const n=t.split(`
`),o=[];for(const s of[...a].sort((r,i)=>r-i)){for(let r=Math.max(1,s-2);r<=Math.min(n.length,s+2);r++)o.push(`${r===s?">":" "} ${String(r).padStart(4)} | ${n[r-1]}`);o.push("")}return o.join(`
`)}class ce{constructor(e,a,n,o){this.gl=e,this.label=o;const s=$e(e,e.VERTEX_SHADER,a,`${o} (vertex)`),r=$e(e,e.FRAGMENT_SHADER,n,`${o} (fragment)`),i=e.createProgram();if(e.attachShader(i,s),e.attachShader(i,r),e.linkProgram(i),e.deleteShader(s),e.deleteShader(r),!e.getProgramParameter(i,e.LINK_STATUS)){const c=e.getProgramInfoLog(i);throw e.deleteProgram(i),new Error(`Error enlazando ${o}: ${c}`)}this.handle=i}handle;locs=new Map;use(){this.gl.useProgram(this.handle)}loc(e){let a=this.locs.get(e);return a===void 0&&(a=this.gl.getUniformLocation(this.handle,e),this.locs.set(e,a)),a}f(e,a){const n=this.loc(e);n&&this.gl.uniform1f(n,a)}i(e,a){const n=this.loc(e);n&&this.gl.uniform1i(n,a)}b(e,a){const n=this.loc(e);n&&this.gl.uniform1i(n,a?1:0)}v2(e,a,n){const o=this.loc(e);o&&this.gl.uniform2f(o,a,n)}v3(e,a,n,o){const s=this.loc(e);s&&this.gl.uniform3f(s,a,n,o)}tex(e,a,n,o){const s=this.gl;s.activeTexture(s.TEXTURE0+a),s.bindTexture(n,o),this.i(e,a)}dispose(){this.gl.deleteProgram(this.handle)}}function Pa(t,e,a,n,o,s=t.LINEAR){const r=t.createTexture();t.bindTexture(t.TEXTURE_2D,r),t.texImage2D(t.TEXTURE_2D,0,n,e,a,0,t.RGBA,o,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,s),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,s),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);const i=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,i),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,r,0);const c=t.checkFramebufferStatus(t.FRAMEBUFFER);if(t.bindFramebuffer(t.FRAMEBUFFER,null),c!==t.FRAMEBUFFER_COMPLETE)throw new Error(`Framebuffer incompleto (0x${c.toString(16)})`);return{fbo:i,tex:r,width:e,height:a}}function D(t,e){e&&(t.deleteFramebuffer(e.fbo),t.deleteTexture(e.tex))}function Ia(t,e,a){const n=t.createTexture();return t.bindTexture(t.TEXTURE_2D,n),t.texImage2D(t.TEXTURE_2D,0,t.RGBA16F,a,1,0,t.RGBA,t.FLOAT,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),n}function wa(t){const e=t.createTexture();t.bindTexture(t.TEXTURE_CUBE_MAP,e);const a=new Uint8Array([0,0,0,255]),n=[t.TEXTURE_CUBE_MAP_POSITIVE_X,t.TEXTURE_CUBE_MAP_NEGATIVE_X,t.TEXTURE_CUBE_MAP_POSITIVE_Y,t.TEXTURE_CUBE_MAP_NEGATIVE_Y,t.TEXTURE_CUBE_MAP_POSITIVE_Z,t.TEXTURE_CUBE_MAP_NEGATIVE_Z];for(const o of n)t.texImage2D(o,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,a);return t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_CUBE_MAP,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),e}function Ge(t,e){let a=1,n=0,o=t;for(;o>0;)a/=e,n+=a*(o%e),o=Math.floor(o/e);return n}const La=`#version 300 es
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
`,Aa=`#version 300 es
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
`;class Ca{constructor(e){this.gl=e,this.prog=new ce(e,La,Aa,"overlay de orbitas"),this.vao=e.createVertexArray(),this.vbo=e.createBuffer(),e.bindVertexArray(this.vao),e.bindBuffer(e.ARRAY_BUFFER,this.vbo),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,12,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,1,e.FLOAT,!1,12,8),e.bindVertexArray(null)}prog;vao;vbo;traces=[];nextId=1;scratch=new Float32Array(0);get list(){return this.traces}add(e){const a={...e,id:this.nextId++};return this.traces.push(a),a}clear(){this.traces=[]}remove(e){this.traces=this.traces.filter(a=>a.id!==e)}get isEmpty(){return this.traces.length===0}draw(e,a,n){if(this.traces.length===0||n<=0)return;const o=this.gl,s=Math.sin(e.theta),r=Math.cos(e.theta),i=Math.sin(e.phi),c=Math.cos(e.phi),l=[e.r*s*c,e.r*s*i,e.r*r],u=[s*c,s*i,r],d=[r*c,r*i,-s],p=[-i,c,0],h=te(a),m=h.hasHorizon?h.rPlus:0;o.bindVertexArray(this.vao),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),this.prog.use(),this.prog.f("u_opacity",n);for(const g of this.traces){const x=g.points.length;if(x<2)continue;this.scratch.length<x*3&&(this.scratch=new Float32Array(x*3));const y=this.scratch;let _=0;for(let O=0;O<x;O++){const k=g.points[O],N=k[0]-l[0],B=k[1]-l[1],C=k[2]-l[2],me=N*u[0]+B*u[1]+C*u[2],Y=N*d[0]+B*d[1]+C*d[2],ft=N*p[0]+B*p[1]+C*p[2],fe=-me;if(fe<=1e-6){y[_*3]=0,y[_*3+1]=0,y[_*3+2]=0,_++;continue}const gt=ft/(fe*e.tanHalfFov*e.aspect),bt=-Y/(fe*e.tanHalfFov);let we=1;if(m>0){const ae=k[0]-l[0],ne=k[1]-l[1],oe=k[2]-l[2],Le=ae*ae+ne*ne+oe*oe;if(Le>1e-12){const Q=-(l[0]*ae+l[1]*ne+l[2]*oe)/Le;if(Q>0&&Q<1){const Ae=l[0]+Q*ae,Ce=l[1]+Q*ne,De=l[2]+Q*oe,vt=Math.sqrt(Ae*Ae+Ce*Ce+De*De);we=Math.min(1,Math.max(0,(vt-m)/(.6*m)))}}}y[_*3]=gt,y[_*3+1]=bt,y[_*3+2]=we,_++}o.bindBuffer(o.ARRAY_BUFFER,this.vbo),o.bufferData(o.ARRAY_BUFFER,y.subarray(0,_*3),o.DYNAMIC_DRAW),this.prog.v3("u_color",g.color[0],g.color[1],g.color[2]),o.drawArrays(o.LINE_STRIP,0,_)}o.disable(o.BLEND),o.bindVertexArray(null)}dispose(){this.gl.deleteBuffer(this.vbo),this.gl.deleteVertexArray(this.vao),this.prog.dispose()}}function Da(t,e=4e3){const a=t.path;if(a.length<=e)return a.map(se);const n=Math.ceil(a.length/e),o=[];for(let s=0;s<a.length;s+=n)o.push(se(a[s]));return o.push(se(a[a.length-1])),o}function $(t,e,a,n){const o=(t-e)/(t<e?a:n);return Math.exp(-.5*o*o)}function Fa(t){return 1.056*$(t,599.8,37.9,31)+.362*$(t,442,16,26.7)-.065*$(t,501.1,20.4,26.2)}function qa(t){return .821*$(t,568.8,46.9,40.5)+.286*$(t,530.9,16.3,31.1)}function za(t){return 1.217*$(t,437,11.8,36)+.681*$(t,459,26,13.8)}function nt(t,e){const a=Math.pow(t,5),n=re*T/(t*tt*e);return n>700?2*re*T*T/a*Math.exp(-n):2*re*T*T/(a*Math.expm1(n))}function Oa(t){return .002897771955/t}const ot=360,st=830,j=2,I=[[3.2406,-1.5372,-.4986],[-.9689,1.8758,.0415],[.0557,-.204,1.057]];function he(t){let e=0,a=0,n=0;for(let p=ot;p<=st;p+=j){const h=nt(p*1e-9,t);e+=h*Fa(p),a+=h*qa(p),n+=h*za(p)}e*=j,a*=j,n*=j;const o=e+a+n;if(!(o>0)||!Number.isFinite(o))return{chroma:[1,1,1],visibleRadiance:0};const s=e/a,r=n/a;let i=I[0][0]*s+I[0][1]*1+I[0][2]*r,c=I[1][0]*s+I[1][1]*1+I[1][2]*r,l=I[2][0]*s+I[2][1]*1+I[2][2]*r;const u=Math.min(i,c,l);u<0&&(i-=u,c-=u,l-=u);const d=.2126*i+.7152*c+.0722*l;return d>0&&(i/=d,c/=d,l/=d),{chroma:[i,c,l],visibleRadiance:a}}const ye=2.5,rt=9,le=512,it=1e4;function Na(){const t=new Float32Array(le*4),e=he(it).visibleRadiance;for(let a=0;a<le;a++){const n=ye+(rt-ye)*a/(le-1),o=he(Math.pow(10,n)),s=e>0?o.visibleRadiance/e:0;t[a*4+0]=o.chroma[0],t[a*4+1]=o.chroma[1],t[a*4+2]=o.chroma[2],t[a*4+3]=s>0?Math.log10(s):-30}return t}function Ba(t){const e=he(it).visibleRadiance,a=he(Math.max(t,1)).visibleRadiance;return e>0?a/e:0}function Ua(t){let e=0;for(let n=ot;n<=st;n+=j)e+=nt(n*1e-9,t)*j*1e-9;const a=5670374419e-17*Math.pow(t,4)/Math.PI;return a>0?e/a:0}const be=`#version 300 es
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
`,Ha=`#version 300 es
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
// ---- begin disk.glsl ----
// ---------------------------------------------------------------------------
// Disco de acrecion delgado: perfil de Novikov-Thorne, cinematica kepleriana,
// corrimiento total (Doppler + gravitacional) y color de cuerpo negro.
//
// Requiere metric.glsl.
// ---------------------------------------------------------------------------

uniform sampler2D u_bbLUT;   // RGB = cromaticidad, A = log10(radiancia visible)
uniform float u_lutLogTMin;
uniform float u_lutLogTMax;

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

const float LN10 = 2.302585092994046;

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
// Color de cuerpo negro desde la LUT
// ---------------------------------------------------------------------------

/**
 * Emision visible de un cuerpo negro a temperatura T (kelvin), en RGB lineal.
 * La LUT guarda la cromaticidad con luminancia unidad y, en el canal alfa, el
 * log10 de la radiancia visible relativa: en logaritmo la interpolacion lineal
 * de la textura es fiel a lo largo de las ~20 decadas que cubre el rango.
 */
vec3 blackbodyEmission(float T) {
  if (T <= 0.0) return vec3(0.0);
  float logT = log(T) / LN10;
  float idx = (logT - u_lutLogTMin) / (u_lutLogTMax - u_lutLogTMin);
  vec4 s = texture(u_bbLUT, vec2(clamp(idx, 0.001, 0.999), 0.5));
  return s.rgb * pow(10.0, s.a);
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
`,$a=`#version 300 es
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
`,Ga=`#version 300 es
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
`;class Xa{constructor(e,a=!1){this.canvas=e;const n=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:a,powerPreference:"high-performance"});if(!n)throw new Error("WebGL2 no disponible en este navegador.");this.gl=n,this.caps=Ra(n),this.caps.colorBufferFloat?(this.colorFormat=n.RGBA16F,this.colorType=n.HALF_FLOAT,this.degraded=!1):(this.colorFormat=n.RGBA8,this.colorType=n.UNSIGNED_BYTE,this.degraded=!0),e.addEventListener("webglcontextlost",o=>{o.preventDefault(),this.contextLost=!0,this.onContextChange?.(!0)},!1),e.addEventListener("webglcontextrestored",()=>{this.contextLost=!1,this.onContextChange?.(!1)},!1),this.progTrace=new ce(n,be,Ha,"trazador Kerr-Newman"),this.progComposite=new ce(n,be,$a,"composite"),this.progBloom=new ce(n,be,Ga,"bloom"),this.lut=Ia(n,Na(),le),this.dummyCube=wa(n),this.vao=n.createVertexArray(),this.overlay=new Ca(n)}gl;caps;degraded;progTrace;progComposite;progBloom;accum=null;latest=null;bloom=null;lut;dummyCube;vao;sampleIndex=0;internalW=0;internalH=0;currentScale=0;frameMsAvg=0;lastWorkAt=0;colorFormat;colorType;diskBrightness=1;tracedFrames=0;autoScale=1;contextLost=!1;onContextChange=null;onAutoDowngrade=null;downgradeNotified=!1;overlay;invalidate(){this.sampleIndex=0}get stats(){return{samples:this.sampleIndex,targetSamples:0,internalWidth:this.internalW,internalHeight:this.internalH,scale:this.currentScale,frameMs:this.frameMsAvg,converged:!1}}render(e,a,n){const o=this.gl;if(this.contextLost)return null;const s=this.tracedFrames===0,r=n||s?e.interactiveScale:e.renderScale,i=Math.max(.12,r*this.autoScale),c=this.degraded||n||s?1:Math.max(1,e.targetSamples);if(this.resize(i),!this.accum)return null;if(o.bindVertexArray(this.vao),o.disable(o.BLEND),o.disable(o.DEPTH_TEST),this.sampleIndex<c){const p=performance.now(),[h,m]=this.sampleIndex%2===0?this.accum:[this.accum[1],this.accum[0]];o.bindFramebuffer(o.FRAMEBUFFER,m.fbo),o.viewport(0,0,this.internalW,this.internalH),this.progTrace.use(),this.setTraceUniforms(e,a,n),this.progTrace.tex("u_prevAccum",0,o.TEXTURE_2D,h.tex),this.progTrace.tex("u_bbLUT",1,o.TEXTURE_2D,this.lut),this.progTrace.tex("u_starCube",2,o.TEXTURE_CUBE_MAP,this.dummyCube),this.progTrace.f("u_sampleIndex",this.sampleIndex),o.drawArrays(o.TRIANGLES,0,3),this.sampleIndex++,this.tracedFrames++,this.latest=m;const g=p-this.lastWorkAt;this.lastWorkAt>0&&g>0&&g<2e4&&(this.frameMsAvg=this.frameMsAvg===0?g:this.frameMsAvg*.85+g*.15,this.applyAutoQuality(e)),this.lastWorkAt=p}const u=this.latest;if(!u)return o.bindVertexArray(null),null;const d=e.bloomEnabled&&this.bloom?this.renderBloom(u,e):null;return o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,this.canvas.width,this.canvas.height),this.progComposite.use(),this.progComposite.v2("u_resolution",this.canvas.width,this.canvas.height),this.progComposite.f("u_exposure",e.exposure),this.progComposite.b("u_bloomEnabled",!!d),this.progComposite.f("u_bloomStrength",e.bloomStrength),this.progComposite.tex("u_accum",0,o.TEXTURE_2D,u.tex),this.progComposite.tex("u_bloom",1,o.TEXTURE_2D,d??u.tex),o.drawArrays(o.TRIANGLES,0,3),o.bindVertexArray(null),this.overlay&&!this.overlay.isEmpty&&e.showOrbits&&this.overlay.draw({r:a.camDistanceRg,theta:e.inclination,phi:e.azimuth,tanHalfFov:Math.tan(e.fov/2),aspect:this.internalW/Math.max(this.internalH,1)},a.bh,e.orbitOpacity),{samples:this.sampleIndex,targetSamples:c,internalWidth:this.internalW,internalHeight:this.internalH,scale:this.currentScale,frameMs:this.frameMsAvg,converged:this.sampleIndex>=c}}applyAutoQuality(e){if(!e.autoQuality){this.autoScale=1;return}const a=this.frameMsAvg,n=this.autoScale;a>900?this.autoScale=Math.max(.2,this.autoScale*.6):a>350?this.autoScale=Math.max(.25,this.autoScale*.85):a<90&&this.autoScale<1&&(this.autoScale=Math.min(1,this.autoScale*1.1)),this.autoScale<n&&!this.downgradeNotified&&this.autoScale<.9&&(this.downgradeNotified=!0,this.onAutoDowngrade?.(this.autoScale,a))}get hasRendered(){return this.tracedFrames>0}get isContextLost(){return this.contextLost}renderBloom(e,a){const n=this.gl;if(!this.bloom)return null;const[o,s]=this.bloom;return n.viewport(0,0,o.width,o.height),this.progBloom.use(),this.progBloom.v2("u_resolution",o.width,o.height),n.bindFramebuffer(n.FRAMEBUFFER,o.fbo),this.progBloom.i("u_mode",0),this.progBloom.f("u_threshold",a.bloomThreshold),this.progBloom.v2("u_texel",1/e.width,1/e.height),this.progBloom.tex("u_src",0,n.TEXTURE_2D,e.tex),n.drawArrays(n.TRIANGLES,0,3),n.bindFramebuffer(n.FRAMEBUFFER,s.fbo),this.progBloom.i("u_mode",1),this.progBloom.v2("u_texel",1/o.width,1/o.height),this.progBloom.v2("u_dir",1,0),this.progBloom.tex("u_src",0,n.TEXTURE_2D,o.tex),n.drawArrays(n.TRIANGLES,0,3),n.bindFramebuffer(n.FRAMEBUFFER,o.fbo),this.progBloom.v2("u_dir",0,1),this.progBloom.tex("u_src",0,n.TEXTURE_2D,s.tex),n.drawArrays(n.TRIANGLES,0,3),o.tex}setTraceUniforms(e,a,n){const o=this.progTrace,s=this.internalW/Math.max(this.internalH,1);if(o.f("u_a",e.spin),o.f("u_q",e.charge),o.v3("u_camPos",a.camDistanceRg,e.inclination,e.azimuth),o.f("u_tanHalfFov",Math.tan(e.fov/2)),o.f("u_aspect",s),o.v2("u_resolution",this.internalW,this.internalH),n||this.sampleIndex===0)o.v2("u_jitter",0,0);else{const r=this.sampleIndex+1;o.v2("u_jitter",Ge(r,2)-.5,Ge(r,3)-.5)}o.i("u_maxIter",n?Math.round(e.maxIter*.55):e.maxIter),o.f("u_tol",n?e.tolerance*20:e.tolerance),o.f("u_rEscape",e.rEscape),o.f("u_rCapture",a.rCapture),o.f("u_hInit",Math.max(.05,a.camDistanceRg*.02)),o.b("u_markNonConverged",e.markNonConverged),o.b("u_diskEnabled",e.diskEnabled),o.f("u_diskInner",a.rDiskInner),o.f("u_diskOuter",Math.max(e.diskOuter,a.rDiskInner*1.2)),o.f("u_diskTempMax",a.diskTempMaxK),o.f("u_diskBrightness",this.diskBrightness),o.f("u_diskOpacity",e.diskOpacity),o.f("u_diskTurbulence",e.diskTurbulence?1:0),o.f("u_diskPrograde",e.diskPrograde?1:-1),o.f("u_diskTime",this.diskPhase),o.f("u_lutLogTMin",ye),o.f("u_lutLogTMax",rt),o.b("u_starsEnabled",e.starsEnabled),o.f("u_starIntensity",e.starIntensity),o.f("u_starDensity",e.starDensity),o.f("u_milkyWayIntensity",e.milkyWayIntensity),o.b("u_useStarCube",!1),o.b("u_showHorizon",e.showHorizon),o.b("u_showErgosphere",e.showErgosphere),o.b("u_showPhotonSphere",e.showPhotonSphere),o.b("u_showIsco",e.showIsco),o.b("u_showDragGrid",e.showDragGrid),o.f("u_iscoRadius",a.rDiskInner),o.f("u_photonRadius",e.diskPrograde?a.rPhotonPrograde:a.rPhotonRetrograde),o.f("u_dragGridRadius",e.dragGridRadius),o.f("u_layerOpacity",e.layerOpacity)}diskPhase=0;advanceTime(e,a,n){if(!a.diskEnabled||a.timeWarp<=0)return!1;const o=1/(Math.pow(n.rDiskInner,1.5)+(a.diskPrograde?a.spin:-a.spin)),s=2*Math.PI/Math.abs(o);return this.diskPhase+=e/12*s*a.timeWarp,!0}updateCalibration(e,a){const s=Ba(e.autoExposure?Math.max(a.diskTempMaxK,1e3):1e5);this.diskBrightness=s>0?.55/s:1}resize(e){const a=this.gl,n=Math.min(window.devicePixelRatio||1,2),o=Math.max(1,this.canvas.clientWidth),s=Math.max(1,this.canvas.clientHeight),r=Math.round(o*n),i=Math.round(s*n);(this.canvas.width!==r||this.canvas.height!==i)&&(this.canvas.width=r,this.canvas.height=i,this.invalidate());const c=Math.max(16,Math.round(r*e)),l=Math.max(16,Math.round(i*e));if(c===this.internalW&&l===this.internalH&&this.accum)return;D(a,this.accum?.[0]??null),D(a,this.accum?.[1]??null),D(a,this.bloom?.[0]??null),D(a,this.bloom?.[1]??null),this.internalW=c,this.internalH=l,this.currentScale=e;const u=(h,m)=>Pa(a,h,m,this.colorFormat,this.colorType);this.accum=[u(c,l),u(c,l)],this.latest=null;const d=Math.max(8,c>>1),p=Math.max(8,l>>1);this.bloom=[u(d,p),u(d,p)],this.invalidate()}screenshot(){return this.canvas.toDataURL("image/png")}dispose(){const e=this.gl;D(e,this.accum?.[0]??null),D(e,this.accum?.[1]??null),D(e,this.bloom?.[0]??null),D(e,this.bloom?.[1]??null),e.deleteTexture(this.lut),e.deleteTexture(this.dummyCube),e.deleteVertexArray(this.vao),this.progTrace.dispose(),this.progComposite.dispose(),this.progBloom.dispose(),this.overlay.dispose()}}const M=t=>t*Math.PI/180,ct=[{id:"m87",name:"M87*",subtitle:"6.5×10⁹ M☉",info:"Primera imagen de un agujero negro (EHT, 2019). La inclinación de ~17° respecto al eje del chorro hace que la sombra se vea casi circular y el anillo casi uniforme.",params:{massSolar:65e8,spin:.9,charge:0,inclination:M(163),distanceRg:55,fov:M(40),distanceMeters:168e5*H,diskOuter:18,eddingtonRatio:1e-5,timeWarp:1}},{id:"sgra",name:"Sgr A*",subtitle:"4.3×10⁶ M☉",info:"El agujero negro del centro de la Vía Láctea (EHT, 2022). Visto casi de frente al eje, a 8.2 kpc. Su periodo orbital en el ISCO es de ~30 min: es el único cuyo disco varía en escalas de tiempo humanas.",params:{massSolar:43e5,spin:.94,charge:0,inclination:M(30),distanceRg:52,fov:M(40),distanceMeters:8200*H,diskOuter:16,eddingtonRatio:1e-8,timeWarp:1}},{id:"cygx1",name:"Cygnus X-1",subtitle:"21 M☉",info:"Agujero negro estelar en un sistema binario, con espín casi extremal (a/M > 0.95) y disco a ~10⁷ K: emite sobre todo en rayos X. En la banda visible el brillo superficial es alto pero la cromaticidad ya está saturada en blanco-azul.",params:{massSolar:21,spin:.97,charge:0,inclination:M(63),distanceRg:50,fov:M(40),distanceMeters:2220*H,diskOuter:18,eddingtonRatio:.02,timeWarp:1}},{id:"kerr-extremal",name:"Kerr extremal",subtitle:"a/M = 0.998",info:"Límite de Thorne: el máximo espín alcanzable por acreción astrofísica. La sombra muestra su borde plano característico del lado prógrado, el ISCO baja a ~1.24 M y la eficiencia de acreción supera el 30%.",params:{massSolar:1e7,spin:.998,charge:0,inclination:M(85),distanceRg:50,fov:M(40),diskOuter:16,showErgosphere:!0,layerOpacity:.7}},{id:"reissner",name:"Reissner-Nordström",subtitle:"a = 0, Q/M = 0.9",info:"Sin espín y con carga: solución estática y esféricamente simétrica. La sombra es circular pero más pequeña que la de Schwarzschild, porque la carga contrae los horizontes. No es astrofísico (el plasma neutraliza la carga), pero es exacto.",params:{massSolar:1e7,spin:0,charge:.9,inclination:M(80),distanceRg:55,fov:M(40),diskOuter:18,showHorizon:!0,showPhotonSphere:!0,layerOpacity:.7}},{id:"schwarzschild",name:"Schwarzschild",subtitle:"a = 0, Q = 0",info:"El caso más simple: sombra circular de radio exactamente √27 M = 5.196 M, esfera de fotones en 3 M, ISCO en 6 M. Es el caso contra el que se valida el trazador.",params:{massSolar:1e7,spin:0,charge:0,inclination:M(84),distanceRg:58,fov:M(40),diskOuter:20,showPhotonSphere:!0,showIsco:!0,layerOpacity:.7}},{id:"kerr-newman",name:"Kerr-Newman",subtitle:"a=0.7, Q=0.6",info:"La solución general: espín y carga a la vez, con a² + q² = 0.85 cerca del límite extremal. Es el caso que da nombre al simulador.",params:{massSolar:1e8,spin:.7,charge:.6,inclination:M(78),distanceRg:48,fov:M(40),diskOuter:15,showErgosphere:!0,showPhotonSphere:!0,layerOpacity:.7}},{id:"naked",name:"Singularidad desnuda",subtitle:"a² + q² > 1",info:"Régimen sin horizonte: a² + q² > 1. Es matemáticamente una solución válida de las ecuaciones de Einstein-Maxwell, pero viola la conjetura de censura cósmica y no se espera que exista. Sin horizonte no hay sombra: los rayos atraviesan la región central.",params:{massSolar:1e7,spin:.9,charge:.75,inclination:M(80),distanceRg:50,fov:M(40),diskOuter:16,diskEnabled:!0,starsEnabled:!0}}];function f(t,e,a){const n=document.createElement(t);return e&&(n.className=e),a!==void 0&&(n.textContent=a),n}function b(t){const e=f("div","ctl"),a=f("div","ctl-label"),n=f("span","name");n.appendChild(f("span",void 0,t.label)),t.symbol&&n.appendChild(f("span","sym",t.symbol));const o=f("span","ctl-value");a.append(n,o);const s=f("input");s.type="range";const r=l=>t.log?Math.log10(l):l,i=l=>t.log?Math.pow(10,l):l;s.min=String(r(t.min)),s.max=String(r(t.max)),s.step=String(t.log?(Math.log10(t.max)-Math.log10(t.min))/1e3:t.step??.001);const c=l=>{o.textContent=t.format(l);const u=r(l),d=Number(s.min),p=Number(s.max),h=p>d?(u-d)/(p-d)*100:0;s.style.setProperty("--fill",`${h}%`)};return s.value=String(r(t.value)),c(t.value),s.addEventListener("input",()=>{const l=i(Number(s.value));c(l),t.onInput(l)}),e.append(a,s),{root:e,set(l){s.value=String(r(l)),c(l)}}}function w(t,e,a){const n=f("label","toggle"),o=f("span",void 0,t),s=f("input");s.type="checkbox",s.checked=e;const r=f("span","sw");return n.append(o,s,r),s.addEventListener("change",()=>a(s.checked)),{root:n,set(i){s.checked=i}}}function ve(t,e,a){const n=f("div","segmented"),o=new Map;for(const s of t){const r=f("button",void 0,s.label);s.title&&(r.title=s.title),s.value===e&&r.classList.add("active"),r.addEventListener("click",()=>{for(const[,i]of o)i.classList.remove("active");r.classList.add("active"),a(s.value)}),o.set(s.value,r),n.appendChild(r)}return{root:n,set(s){for(const[r,i]of o)i.classList.toggle("active",r===s)}}}function F(t,e=!0){const a=f("div",`section${e?"":" closed"}`),n=f("button","section-head");n.appendChild(f("span","chev","▾")),n.appendChild(f("span",void 0,t));const o=f("div","section-body");return n.addEventListener("click",()=>a.classList.toggle("closed")),a.append(n,o),{root:a,body:o}}function P(t){const e=f("div","note");return e.innerHTML=t,e}function Z(t,e,a){const n=f("button","btn",t);return a&&(n.title=a),n.addEventListener("click",e),n}function Wa(t,e,a){const n=f("div","hud-row"),o=f("div","k");o.appendChild(f("span","sym",t)),o.appendChild(f("span","desc",e)),a&&(n.title=a);const s=f("div","v","—");return n.append(o,s),{root:n,set(r,i=!1){s.textContent=r,s.classList.toggle("dim",i)}}}function X(t){const e=f("div","hud-group");return e.appendChild(f("div","hud-group-title",t)),e}const ja="⁰¹²³⁴⁵⁶⁷⁸⁹";function Va(t){return String(t).split("").map(e=>e==="-"?"⁻":ja[Number(e)]??e).join("")}function W(t,e=3){if(!Number.isFinite(t))return"—";if(t===0)return"0";const a=Math.abs(t);if(a>=.001&&a<1e5)return t.toPrecision(e);const n=Math.floor(Math.log10(a));return`${(t/Math.pow(10,n)).toFixed(e-1)}×10${Va(n)}`}function S(t,e=3){return Number.isFinite(t)?t.toFixed(e):"—"}const L=180/Math.PI;class Ka{constructor(e,a){this.root=e,this.opts=a,this.build(),a.store.subscribe(()=>this.sync())}sliders=new Map;toggles=new Map;distMode;diskDir;orbitDir;distSlider;syncing=!1;get p(){return this.opts.store.get()}patch(e){this.syncing||this.opts.store.patch(e)}build(){this.root.append(this.buildPresets(),this.buildBlackHole(),this.buildCamera(),this.buildDisk(),this.buildBackground(),this.buildLayers(),this.buildOrbits(),this.buildRender())}buildOrbits(){const e=F("Órbitas de prueba",!1),a=w("Mostrar órbitas",this.p.showOrbits,d=>this.patch({showOrbits:d}));this.toggles.set("showOrbits",a);const n=b({label:"Radio de lanzamiento",symbol:"r₀",min:1.5,max:80,step:.1,value:this.p.orbitLaunchRadius,format:d=>`${d.toFixed(1)} M`,onInput:d=>this.patch({orbitLaunchRadius:d})});this.sliders.set("orbitLaunchRadius",n);const o=b({label:"Inclinación de la órbita",min:0,max:85,step:1,value:this.p.orbitInclination*L,format:d=>`${d.toFixed(0)}°`,onInput:d=>this.patch({orbitInclination:d/L})});this.sliders.set("orbitInclination",o);const s=b({label:"Velocidad",symbol:"v/v_circ",min:.4,max:1.35,step:.005,value:this.p.orbitSpeedFraction,format:d=>`${d.toFixed(3)}×`,onInput:d=>this.patch({orbitSpeedFraction:d})});this.sliders.set("orbitSpeedFraction",s);const r=b({label:"Carga de la partícula",symbol:"e/m",min:-2,max:2,step:.02,value:this.p.orbitCharge,format:d=>d===0?"neutra":d.toFixed(2),onInput:d=>this.patch({orbitCharge:d})});this.sliders.set("orbitCharge",r);const i=b({label:"Revoluciones",min:1,max:40,step:1,value:this.p.orbitRevolutions,format:d=>d.toFixed(0),onInput:d=>this.patch({orbitRevolutions:Math.round(d)})});this.sliders.set("orbitRevolutions",i);const c=b({label:"Opacidad",min:.05,max:1,step:.02,value:this.p.orbitOpacity,format:d=>d.toFixed(2),onInput:d=>this.patch({orbitOpacity:d})});this.sliders.set("orbitOpacity",c);const l=ve([{value:"pro",label:"prógrada"},{value:"retro",label:"retrógrada"}],this.p.orbitPrograde?"pro":"retro",d=>this.patch({orbitPrograde:d==="pro"}));this.orbitDir=l;const u=f("div","btn-row");return u.append(Z("Lanzar partícula",()=>this.opts.onLaunchOrbit()),Z("Borrar todas",()=>this.opts.onClearOrbits())),e.body.append(a.root,P("<b>Vista esquemática.</b> Estas líneas se proyectan suponiendo que la luz viaja en línea recta, mientras que la imagen de fondo sí sigue geodésicas. Son un diagrama en el espacio de coordenadas superpuesto a una observación: una órbita que pase por detrás del agujero <em>debería</em> verse deformada por el lente, y aquí aparece recta. Sí se atenúan al pasar tras el horizonte."),n.root,o.root,s.root,l.root,r.root,i.root,c.root,u,P("La carga de la <em>partícula</em> es el único lugar donde <code>Q</code> actúa electromagnéticamente: los fotones son neutros y solo la sienten a través de la métrica. Con <code>Q/M > 0</code> y carga no nula, la partícula se desvía de la geodésica por la fuerza de Lorentz del potencial <code>A_μ = −(Qr/Σ)(dt − a sin²θ dφ)</code>.")),e.root}buildPresets(){const e=F("Presets",!0),a=f("div","presets");for(const o of ct){const s=f("button");s.appendChild(f("b",void 0,o.name)),s.appendChild(f("span",void 0,o.subtitle)),s.title=o.info??"",s.addEventListener("click",()=>this.opts.onPreset(o)),a.appendChild(s)}const n=f("div","btn-row");return n.append(Z("Vista inicial",()=>this.opts.onResetView()),Z("Capturar PNG",()=>this.opts.onScreenshot()),Z("HUD",()=>this.opts.onToggleHud(),"Mostrar u ocultar el panel de observables")),e.body.append(a,n),e.root}buildBlackHole(){const e=F("Agujero negro",!0),a=b({label:"Masa",symbol:"M",min:1,max:1e11,value:this.p.massSolar,log:!0,format:s=>_a(s),onInput:s=>this.patch({massSolar:s})});this.sliders.set("massSolar",a);const n=b({label:"Momento angular",symbol:"a/M",min:-ue,max:ue,step:.001,value:this.p.spin,format:s=>`${s>=0?"+":""}${s.toFixed(3)}`,onInput:s=>this.patch({spin:s})});this.sliders.set("spin",n);const o=b({label:"Carga eléctrica",symbol:"Q/M",min:0,max:1.2,step:.001,value:this.p.charge,format:s=>s.toFixed(3),onInput:s=>this.patch({charge:s})});return this.sliders.set("charge",o),e.body.append(a.root,P("La <b>forma</b> de la imagen depende solo de <code>a/M</code> y <code>Q/M</code>: la masa es el factor de escala. Actúa por el tamaño angular (en modo distancia física), la temperatura del disco <code>T ∝ M^−1/4</code> y el periodo orbital <code>T ∝ M</code>."),n.root,o.root,P("Los agujeros negros reales son neutros: el plasma circundante los descarga hasta <code>Q/M ~ 10⁻¹⁸</code>. Kerr-Newman es exacto como solución de Einstein-Maxwell, pero no astrofísico. La carga contrae los horizontes vía <code>Δ = r² − 2Mr + a² + Q²</code>.")),e.root}buildCamera(){const e=F("Cámara",!0),a=b({label:"Inclinación",symbol:"i",min:1,max:179,step:.5,value:this.p.inclination*L,format:s=>`${s.toFixed(1)}°`,onInput:s=>this.patch({inclination:s/L})});this.sliders.set("inclination",a),this.distMode=ve([{value:"rg",label:"en radios r_g",title:"La geometría no cambia con la masa"},{value:"physical",label:"distancia física",title:"La masa cambia el tamaño angular"}],this.p.distanceMode,s=>this.patch({distanceMode:s})),this.distSlider=b({label:"Distancia",symbol:"r",min:2.2,max:400,step:.1,value:this.p.distanceRg,format:s=>`${s.toFixed(1)} M`,onInput:s=>this.patch({distanceRg:s})});const n=b({label:"Distancia física",symbol:"D",min:1e9,max:1e26,value:this.p.distanceMeters,log:!0,format:s=>ie(s),onInput:s=>this.patch({distanceMeters:s})});this.sliders.set("distanceMeters",n);const o=b({label:"Campo de visión",symbol:"fov",min:4,max:110,step:.5,value:this.p.fov*L,format:s=>`${s.toFixed(0)}°`,onInput:s=>this.patch({fov:s/L})});return this.sliders.set("fov",o),e.body.append(P("Arrastra sobre la imagen para orbitar. Rueda o pinza para acercarte."),a.root,this.distMode.root,this.distSlider.root,n.root,o.root),this.distSlider.root.dataset.mode="rg",n.root.dataset.mode="physical",e.root}buildDisk(){const e=F("Disco de acreción",!0),a=w("Disco activo",this.p.diskEnabled,c=>this.patch({diskEnabled:c}));this.toggles.set("diskEnabled",a);const n=b({label:"Radio externo",symbol:"r_out",min:4,max:120,step:.5,value:this.p.diskOuter,format:c=>`${c.toFixed(1)} M`,onInput:c=>this.patch({diskOuter:c})});this.sliders.set("diskOuter",n);const o=b({label:"Tasa de acreción",symbol:"ṁ/ṁ_E",min:1e-9,max:1,value:this.p.eddingtonRatio,log:!0,format:c=>c>=.01?c.toFixed(3):c.toExponential(1),onInput:c=>this.patch({eddingtonRatio:c})});this.sliders.set("eddingtonRatio",o);const s=b({label:"Opacidad",symbol:"τ",min:.05,max:1,step:.01,value:this.p.diskOpacity,format:c=>c.toFixed(2),onInput:c=>this.patch({diskOpacity:c})});this.sliders.set("diskOpacity",s);const r=b({label:"Velocidad de rotación",symbol:"×t",min:0,max:8,step:.05,value:this.p.timeWarp,format:c=>c===0?"pausado":`${c.toFixed(2)}×`,onInput:c=>this.patch({timeWarp:c})});this.sliders.set("timeWarp",r),this.diskDir=ve([{value:"pro",label:"corrotante",title:"El disco gira con el espín"},{value:"retro",label:"contrarrotante",title:"El disco gira contra el espín"}],this.p.diskPrograde?"pro":"retro",c=>this.patch({diskPrograde:c==="pro"}));const i=w("Estructura turbulenta",this.p.diskTurbulence,c=>this.patch({diskTurbulence:c}));return this.toggles.set("diskTurbulence",i),e.body.append(a.root,P("Borde interno fijado en el <b>ISCO</b>. Perfil de Novikov-Thorne <code>T ∝ r^−3/4 [1−√(r_in/r)]^1/4</code>, color de cuerpo negro por ley de Planck, y corrimiento total <code>g</code> que engloba Doppler y redshift gravitacional: de ahí el lado brillante."),n.root,o.root,P("El contraste del beaming depende de la temperatura. La radiación observada de un cuerpo negro con corrimiento <code>g</code> es exactamente un cuerpo negro a <code>g·T</code>. Si el pico de Wien está muy por debajo del visible (disco caliente), la banda visible está en régimen de Rayleigh-Jeans y el contraste va como <code>g</code>; el conocido <code>g⁴</code> es el valor <b>bolométrico</b>. Baja la tasa de acreción hasta <code>T ~ 6000 K</code> y el pico entra en el visible: la asimetría se vuelve exponencialmente más marcada."),s.root,this.diskDir.root,r.root,i.root),e.root}buildBackground(){const e=F("Fondo estelar",!1),a=w("Estrellas",this.p.starsEnabled,r=>this.patch({starsEnabled:r}));this.toggles.set("starsEnabled",a);const n=b({label:"Brillo estelar",min:0,max:4,step:.05,value:this.p.starIntensity,format:r=>r.toFixed(2),onInput:r=>this.patch({starIntensity:r})});this.sliders.set("starIntensity",n);const o=b({label:"Densidad",min:.05,max:1,step:.01,value:this.p.starDensity,format:r=>r.toFixed(2),onInput:r=>this.patch({starDensity:r})});this.sliders.set("starDensity",o);const s=b({label:"Banda galáctica",min:0,max:2,step:.02,value:this.p.milkyWayIntensity,format:r=>r.toFixed(2),onInput:r=>this.patch({milkyWayIntensity:r})});return this.sliders.set("milkyWayIntensity",s),e.body.append(a.root,P("El fondo se deflecta con las geodésicas reales: los arcos y las imágenes múltiples alrededor de la sombra son <b>anillos de Einstein</b>, no un efecto de dibujado. El color de cada estrella sale de la misma LUT de cuerpo negro que el disco."),n.root,o.root,s.root),e.root}buildLayers(){const e=F("Capas geométricas",!1),a=[["showHorizon","Horizonte de sucesos","Rejilla sobre r₊, donde el rayo es capturado"],["showErgosphere","Ergosfera","r_E(θ) = 1 + √(1 − q² − a²cos²θ): se achata con el espín"],["showPhotonSphere","Esfera de fotones","Órbita circular de fotones"],["showIsco","ISCO","Última órbita circular estable"],["showDragGrid","Malla de arrastre","Rejilla de coordenadas coloreada por ω"]];for(const[s,r,i]of a){const c=w(r,this.p[s],l=>this.patch({[s]:l}));c.root.title=i,this.toggles.set(s,c),e.body.appendChild(c.root)}const n=b({label:"Radio de la malla",symbol:"r",min:2,max:40,step:.1,value:this.p.dragGridRadius,format:s=>`${s.toFixed(1)} M`,onInput:s=>this.patch({dragGridRadius:s})});this.sliders.set("dragGridRadius",n);const o=b({label:"Opacidad de capas",min:0,max:1.5,step:.02,value:this.p.layerOpacity,format:s=>s.toFixed(2),onInput:s=>this.patch({layerOpacity:s})});return this.sliders.set("layerOpacity",o),e.body.append(n.root,o.root,P("Estas superficies se detectan <b>dentro</b> del trazador, en los cruces reales del rayo: aparecen con su lente gravitacional correcto, no como un dibujo encima. El horizonte de Cauchy (r₋) no se puede dibujar: está dentro de r₊ y ningún rayo lo alcanza, así que solo se reporta como número.")),e.root}buildRender(){const e=F("Render",!1),a=b({label:"Resolución (reposo)",min:.25,max:1,step:.05,value:this.p.renderScale,format:h=>`${(h*100).toFixed(0)}%`,onInput:h=>this.patch({renderScale:h})});this.sliders.set("renderScale",a);const n=b({label:"Resolución (arrastrando)",min:.15,max:1,step:.05,value:this.p.interactiveScale,format:h=>`${(h*100).toFixed(0)}%`,onInput:h=>this.patch({interactiveScale:h})});this.sliders.set("interactiveScale",n);const o=b({label:"Iteraciones por rayo",symbol:"máx",min:150,max:3e3,step:10,value:this.p.maxIter,format:h=>h.toFixed(0),onInput:h=>this.patch({maxIter:Math.round(h)})});this.sliders.set("maxIter",o);const s=b({label:"Tolerancia del integrador",symbol:"tol",min:1e-7,max:.001,value:this.p.tolerance,log:!0,format:h=>h.toExponential(1),onInput:h=>this.patch({tolerance:h})});this.sliders.set("tolerance",s);const r=b({label:"Muestras acumuladas",symbol:"spp",min:1,max:512,step:1,value:this.p.targetSamples,format:h=>h.toFixed(0),onInput:h=>this.patch({targetSamples:Math.round(h)})});this.sliders.set("targetSamples",r);const i=b({label:"Exposición",min:.02,max:20,value:this.p.exposure,log:!0,format:h=>`${h.toFixed(2)}×`,onInput:h=>this.patch({exposure:h})});this.sliders.set("exposure",i);const c=w("Exposición automática",this.p.autoExposure,h=>this.patch({autoExposure:h}));c.root.title="Compensa que la radiancia visible crece ~lineal con T. Desactívala para ver el brillo relativo físico entre masas.",this.toggles.set("autoExposure",c);const l=w("Bloom",this.p.bloomEnabled,h=>this.patch({bloomEnabled:h}));this.toggles.set("bloomEnabled",l);const u=b({label:"Intensidad del bloom",min:0,max:2,step:.02,value:this.p.bloomStrength,format:h=>h.toFixed(2),onInput:h=>this.patch({bloomStrength:h})});this.sliders.set("bloomStrength",u);const d=w("Calidad adaptativa",this.p.autoQuality,h=>this.patch({autoQuality:h}));d.root.title="Baja la resolución interna si la GPU no llega. Conviene dejarlo activo: un pase demasiado lento puede hacer que el driver reinicie la GPU y el canvas se quede en negro.",this.toggles.set("autoQuality",d);const p=w("Diagnóstico: rayos sin converger",this.p.markNonConverged,h=>this.patch({markNonConverged:h}));return p.root.title="Pinta de magenta los píxeles que agotaron el presupuesto de iteraciones. Si aparecen, sube «Iteraciones por rayo».",this.toggles.set("markNonConverged",p),e.body.append(a.root,n.root,o.root,s.root,r.root,i.root,c.root,l.root,u.root,d.root,p.root,P("El coste es intrínseco: un rayo integrado por píxel. Al arrastrar se baja la resolución y el presupuesto de pasos; al soltar se acumulan muestras jittereadas hasta el objetivo.")),e.root}sync(){this.syncing=!0;const e=this.p;this.sliders.get("massSolar")?.set(e.massSolar),this.sliders.get("spin")?.set(e.spin),this.sliders.get("charge")?.set(e.charge),this.sliders.get("inclination")?.set(e.inclination*L),this.sliders.get("distanceMeters")?.set(e.distanceMeters),this.sliders.get("fov")?.set(e.fov*L),this.sliders.get("diskOuter")?.set(e.diskOuter),this.sliders.get("eddingtonRatio")?.set(e.eddingtonRatio),this.sliders.get("diskOpacity")?.set(e.diskOpacity),this.sliders.get("timeWarp")?.set(e.timeWarp),this.sliders.get("starIntensity")?.set(e.starIntensity),this.sliders.get("starDensity")?.set(e.starDensity),this.sliders.get("milkyWayIntensity")?.set(e.milkyWayIntensity),this.sliders.get("dragGridRadius")?.set(e.dragGridRadius),this.sliders.get("layerOpacity")?.set(e.layerOpacity),this.sliders.get("renderScale")?.set(e.renderScale),this.sliders.get("interactiveScale")?.set(e.interactiveScale),this.sliders.get("maxIter")?.set(e.maxIter),this.sliders.get("tolerance")?.set(e.tolerance),this.sliders.get("targetSamples")?.set(e.targetSamples),this.sliders.get("exposure")?.set(e.exposure),this.sliders.get("bloomStrength")?.set(e.bloomStrength),this.sliders.get("orbitLaunchRadius")?.set(e.orbitLaunchRadius),this.sliders.get("orbitInclination")?.set(e.orbitInclination*L),this.sliders.get("orbitSpeedFraction")?.set(e.orbitSpeedFraction),this.sliders.get("orbitCharge")?.set(e.orbitCharge),this.sliders.get("orbitRevolutions")?.set(e.orbitRevolutions),this.sliders.get("orbitOpacity")?.set(e.orbitOpacity),this.distSlider.set(e.distanceRg);for(const[a,n]of this.toggles)n.set(e[a]);this.distMode?.set(e.distanceMode),this.diskDir?.set(e.diskPrograde?"pro":"retro"),this.orbitDir?.set(e.orbitPrograde?"pro":"retro");for(const a of this.root.querySelectorAll("[data-mode]"))a.style.display=a.dataset.mode===e.distanceMode?"":"none";this.syncing=!1}}class Ya{constructor(e,a){this.root=e,this.build(),a.subscribe((n,o)=>this.update(n,o))}rows=new Map;add(e,a,n,o,s){const r=Wa(n,o,s);this.rows.set(a,r),e.appendChild(r.root)}build(){const e=X("Geometría");this.add(e,"extremality","a²+q²","extremalidad","Debe ser ≤ 1 para que exista horizonte"),this.add(e,"rPlus","r₊","horizonte de sucesos"),this.add(e,"rMinus","r₋","horizonte de Cauchy","Interior a r₊: causalmente inaccesible, no se puede observar"),this.add(e,"rErgoEq","r_E","ergosfera (ecuador)"),this.add(e,"rErgoPole","r_E","ergosfera (polo)","Coincide con r₊ en el eje"),this.add(e,"kappa","κ","gravedad superficial","Vale 1/4 para Schwarzschild"),this.add(e,"area","A_H","área del horizonte");const a=X("Órbitas");this.add(a,"rPhPro","r_ph","fotones (prógrada)","Vale 3 M para Schwarzschild"),this.add(a,"rPhRetro","r_ph","fotones (retrógrada)"),this.add(a,"rIscoPro","r_ISCO","ISCO prógrado","Vale 6 M para Schwarzschild"),this.add(a,"rIscoRetro","r_ISCO","ISCO retrógrado"),this.add(a,"eff","η","eficiencia de acreción","1 − E_ISCO; 5.72% para Schwarzschild"),this.add(a,"iscoPeriod","T_ISCO","periodo orbital");const n=X("Sombra");this.add(n,"shadowAreal","R_s","radio areal","En unidades de M/r_obs. Vale √27 = 5.196 para Schwarzschild"),this.add(n,"shadowAsym","Δ","asimetría","(máx − mín)/(máx + mín); 0 = circular"),this.add(n,"shadowAng","θ_s","radio angular");const o=X("Observador");this.add(o,"camDist","r_obs","distancia"),this.add(o,"camDistPhys","","distancia física"),this.add(o,"lapse","α","dilatación temporal","Lapso ZAMO dτ/dt en la cámara"),this.add(o,"omega","ω","arrastre de marcos","dφ/dt del marco local en la cámara");const s=X("Disco");this.add(s,"tmax","T_máx","temperatura máxima"),this.add(s,"wien","λ_pico","pico de Wien"),this.add(s,"visfrac","f_vis","fracción visible","Parte del flujo bolométrico en 360–830 nm"),this.add(s,"rin","r_in","borde interno");const r=X("Escalas físicas");this.add(r,"rg","r_g","radio gravitacional","GM/c² = 1.477 km × (M/M☉)"),this.add(r,"rs","r_s","radio de Schwarzschild","2GM/c²"),this.add(r,"tg","t_g","tiempo gravitacional","GM/c³"),this.add(r,"thawking","T_H","temperatura de Hawking"),this.root.append(e,a,n,o,s,r)}update(e,a){const n=(i,c,l=!1)=>this.rows.get(i)?.set(c,l),o=!a.hasHorizon;n("extremality",S(a.extremality,4),!1);const s=this.rows.get("extremality");s&&(s.root.style.color=a.extremality>1?"var(--danger)":""),n("rPlus",o?"sin horizonte":`${S(a.rPlus)} M`,o),n("rMinus",o?"sin horizonte":`${S(a.rMinus)} M`,!0),n("rErgoEq",`${S(a.rErgoEquator)} M`),n("rErgoPole",`${S(a.rErgoPole)} M`),n("kappa",o?"—":`${S(a.surfaceGravity,4)} /M`,o),n("area",o?"—":`${S(4*Math.PI*(a.rPlus*a.rPlus+a.bh.a*a.bh.a),2)} M²`,o),n("rPhPro",`${S(a.rPhotonPrograde)} M`),n("rPhRetro",`${S(a.rPhotonRetrograde)} M`),n("rIscoPro",`${S(a.rIscoPrograde)} M`),n("rIscoRetro",`${S(a.rIscoRetrograde)} M`),n("eff",`${(a.efficiency*100).toFixed(2)} %`),n("iscoPeriod",Be(a.iscoPeriodSeconds)),n("shadowAreal",o?"no hay sombra":`${S(a.shadowArealRadius)} M`,o),n("shadowAsym",o?"—":S(a.shadowAsymmetry,4),o);const r=xa(a.shadowAngularRad);if(n("shadowAng",o?"—":r<1e3?`${W(r)} µas`:`${W(a.shadowAngularRad*1e3)} mrad`,o),n("camDist",`${S(a.camDistanceRg,2)} M`),n("camDistPhys",ie(a.camDistanceRg*a.rgMeters),!0),n("lapse",S(a.camLapse,4)),n("omega",`${W(a.camOmega)} /M`),e.diskEnabled)n("tmax",`${W(a.diskTempMaxK)} K`),n("wien",`${W(Oa(a.diskTempMaxK)*1e9)} nm`),n("visfrac",`${(Ua(a.diskTempMaxK)*100).toPrecision(3)} %`),n("rin",`${S(a.rDiskInner)} M`);else for(const i of["tmax","wien","visfrac","rin"])n(i,"disco apagado",!0);n("rg",ie(a.rgMeters)),n("rs",ie(2*a.rgMeters)),n("tg",Be(a.tgSeconds)),n("thawking",Number.isFinite(a.hawkingTempK)?`${W(a.hawkingTempK)} K`:"—",!Number.isFinite(a.hawkingTempK))}}class Qa{constructor(e,a){this.root=e,this.store=a,a.subscribe(()=>this.render())}transient=new Map;flash(e,a,n,o=9e3,s="ℹ"){this.transient.set(e,{def:{id:e,level:a,icon:s,html:n},until:Date.now()+o}),this.render(),window.setTimeout(()=>{const r=this.transient.get(e);r&&Date.now()>=r.until&&(this.transient.delete(e),this.render())},o+50)}compute(e,a){const n=[];return a.hasHorizon?a.extremality>.995&&n.push({id:"extremal",level:"warn",icon:"⚠",html:`<b>Régimen casi extremal</b> — <code>a² + q² = ${a.extremality.toFixed(4)}</code>. Los dos horizontes casi coinciden y la precisión de coma flotante de 32 bits del shader se degrada junto a <code>r₊</code>. Los observables del HUD (calculados en doble precisión) siguen siendo fiables.`}):n.push({id:"naked",level:"danger",icon:"⚠",html:`<b>Singularidad desnuda</b> — <code>a² + q² = ${a.extremality.toFixed(3)} > 1</code>. Sin horizonte de sucesos y por tanto sin sombra. Es una solución exacta de Einstein-Maxwell, pero viola la censura cósmica: no se espera que exista. Los rayos se terminan cerca de la singularidad en anillo, que es una elección de renderizado, no física.`}),a.hasHorizon&&a.camDistanceRg<a.rErgoEquator*1.05&&n.push({id:"ergo",level:"info",icon:"◉",html:"<b>Cámara dentro de la ergosfera</b> — aquí no existe ningún observador estático: el arrastre de marcos obliga a co-rotar. La cámara es un <b>ZAMO</b>, que sí existe, y por eso la imagen sigue siendo consistente."}),e.charge>.01&&n.push({id:"charge",level:"info",icon:"ℹ",html:`<b>Carga no astrofísica</b> — <code>Q/M = ${e.charge.toFixed(3)}</code>. Los agujeros negros reales se descargan hasta <code>Q/M ~ 10⁻¹⁸</code> por el plasma circundante. La geometría es exacta; el escenario no es observable.`}),e.markNonConverged&&n.push({id:"diag",level:"info",icon:"⬤",html:"<b>Modo diagnóstico</b> — los píxeles magenta son rayos que agotaron el presupuesto de iteraciones sin caer ni escapar. Si aparecen alrededor del anillo de fotones, sube «Iteraciones por rayo»."}),e.autoExposure||n.push({id:"autoexp",level:"info",icon:"◐",html:"<b>Exposición física</b> — sin compensación automática. El brillo superficial visible de un cuerpo negro crece aproximadamente <code>∝ T</code> en la banda visible, así que al bajar la masa (<code>T ∝ M^−1/4</code>) el disco se ve genuinamente más brillante."}),n}render(){const e=this.store.get(),a=this.store.getDerived(),n=Date.now(),o=[...[...this.transient.values()].filter(s=>s.until>n).map(s=>s.def),...this.compute(e,a)];this.root.replaceChildren();for(const s of o){const r=f("div",`warning ${s.level}`);r.appendChild(f("span","icon",s.icon));const i=f("span");i.innerHTML=s.html,r.appendChild(i),this.root.appendChild(r)}}}const lt=document.getElementById("view"),Ee=document.getElementById("notice"),Za=document.getElementById("panel"),Ja=document.getElementById("panel-body"),de=document.getElementById("panel-toggle"),dt=document.getElementById("hud"),en=document.getElementById("hud-body"),tn=document.getElementById("warnings"),an=document.getElementById("stats");function Ie(t,e,a){Ee.hidden=!1;const n=f("div","notice-inner");n.appendChild(f("h2",void 0,t));const o=f("p");o.innerHTML=e,n.appendChild(o),a&&n.appendChild(f("pre",void 0,a)),Ee.replaceChildren(n)}let v;const E=new Ma(R),nn=new URLSearchParams(location.search).get("capture")==="1";try{v=new Xa(lt,nn)}catch(t){throw Ie("No se pudo inicializar WebGL2","Este simulador integra geodésicas en la GPU y necesita <code>WebGL2</code>. Prueba con una versión reciente de Chrome, Edge, Firefox o Safari 15+, y comprueba que la aceleración por hardware esté activada.",t instanceof Error?t.message:String(t)),t}const q=new Qa(tn,E);v.onContextChange=t=>{t?Ie("Se perdió el contexto WebGL","La GPU reinició el driver mientras se trazaba la imagen. En Windows esto lo provoca el <code>watchdog TDR</code> cuando un solo dibujado tarda más de unos dos segundos, y es la causa habitual de una pantalla en negro sin ningún error. <b>Recarga la página</b>; al arrancar se reduce la calidad automáticamente. Si vuelve a pasar, baja «Resolución (reposo)» e «Iteraciones por rayo» en el panel de Render.",`GPU: ${v.caps.renderer}`):Ee.hidden=!0};v.onAutoDowngrade=(t,e)=>{q.flash("autoquality","warn",`<b>Calidad reducida automáticamente</b> — un pase tardaba ${e.toFixed(0)} ms, así que la resolución interna se bajó al ${(t*100).toFixed(0)} % de la elegida. Esto evita que el driver reinicie la GPU. Puedes desactivarlo en Render → «Calidad adaptativa».`,14e3,"⚠")};window.setTimeout(()=>{v.hasRendered||v.isContextLost||Ie("No se ha podido dibujar ningún frame","El trazador se inicializó (los shaders compilaron correctamente) pero no ha completado ningún pase. Suele deberse a una GPU sin aceleración por hardware o a un contexto bloqueado. Prueba a recargar; si persiste, comprueba que la aceleración por hardware esté activada en el navegador.",`GPU: ${v.caps.renderer}
EXT_color_buffer_float: ${v.caps.colorBufferFloat}`)},1e4);v.degraded&&q.flash("degraded","warn","<b>Sin objetivos de coma flotante</b> — falta <code>EXT_color_buffer_float</code>. Se renderiza en 8 bits por canal y sin acumulación progresiva: la imagen tendrá más ruido y menos rango dinámico. La física del trazado no cambia.",2e4,"⚠");let V=!1;const K=new Ta(lt,{inclination:R.inclination,azimuth:R.azimuth,distance:R.distanceRg},{minDistance:at(R.spin,R.charge),onChange:t=>{if(V)return;if(V=!0,E.get().distanceMode==="physical"){const a=E.getDerived();E.patch({inclination:t.inclination,azimuth:t.azimuth,distanceMeters:t.distance*a.rgMeters})}else E.patch({inclination:t.inclination,azimuth:t.azimuth,distanceRg:t.distance});V=!1}});E.subscribe((t,e)=>{if(v.updateCalibration(t,e),K.setDistanceLimits(at(t.spin,t.charge),4e3),V)return;const a=K.get(),n=1e-9,o=e.camDistanceRg;(Math.abs(a.inclination-t.inclination)>n||Math.abs(a.azimuth-t.azimuth)>n||Math.abs(a.distance-o)>n)&&(V=!0,K.set({inclination:t.inclination,azimuth:t.azimuth,distance:o}),V=!1)});E.subscribe(()=>v.invalidate());function ut(t){E.patch(t.params),t.info&&q.flash(`preset-${t.id}`,"info",`<b>${t.name}</b> — ${t.info}`,14e3,"★")}const Xe=[[.45,1,.62],[1,.78,.32],[.55,.72,1],[1,.48,.72],[.72,1,.95],[.9,.6,1]];function ht(){const t=E.get(),a=E.getDerived().bh,n=t.orbitLaunchRadius,o=Math.PI/2-t.orbitInclination,s=on(n,o,a,t.orbitPrograde);if(!Number.isFinite(s)){q.flash("orbit-fail","warn",`<b>No hay órbita circular en r = ${n.toFixed(1)} M</b> — está por dentro de la órbita de fotones. Prueba un radio mayor.`,8e3,"⚠");return}const r=Math.min(.9995,s*t.orbitSpeedFraction),i=t.orbitPrograde?1:-1;try{const{y:c,k:l}=ta(n,o,[0,0,i*r],a,t.orbitCharge),u=2*Math.PI*Math.pow(n,1.5),d=aa(c,l,a,{tauMax:t.orbitRevolutions*u,maxSteps:12e4}),p=Xe[v.overlay.list.length%Xe.length];v.overlay.add({label:`r₀=${n.toFixed(1)}M`,color:p,points:Da(d),info:{outcome:d.outcome,rMin:d.rMin,rMax:d.rMax,charged:t.orbitCharge!==0,eps:t.orbitCharge,orbits:Math.abs(d.phiTotal)/(2*Math.PI)}});const h={captured:"cae al agujero",escaped:"escapa al infinito",complete:"órbita acotada",maxSteps:"integración truncada",stopped:"detenida"}[d.outcome],m=na(d),g=sa(d),x=[`<b>Partícula lanzada</b> — ${h}`,`r ∈ [${d.rMin.toFixed(2)}, ${d.rMax.toFixed(2)}] M`,`${(Math.abs(d.phiTotal)/(2*Math.PI)).toFixed(1)} vueltas`];m!==null&&x.push(`precesión del periastro ${(m*180/Math.PI).toFixed(2)}°/órbita`),g!==null&&Math.abs(g)>1e-4&&x.push(`precesión nodal (Lense-Thirring) ${(g*180/Math.PI).toFixed(3)}°/órbita`),t.orbitCharge!==0&&t.charge>0&&x.push("con fuerza de Lorentz activa"),q.flash("orbit","info",x.join(" · "),12e3,"◠")}catch(c){q.flash("orbit-fail","warn",`<b>No se pudo trazar la órbita</b> — ${c instanceof Error?c.message:String(c)}`,8e3,"⚠")}}function on(t,e,a,n){const o=Se(t,a,n);if(!Number.isFinite(o))return NaN;const s=Me(t,e,a),r=Ye(t,e,a);if(r<=0)return NaN;const i=pe(t,e,a),c=Math.abs((o-s)*Math.sqrt(Math.max(i.g_phiphi,0))/r);return c<1?c:NaN}new Ka(Ja,{store:E,onPreset:ut,onLaunchOrbit:ht,onClearOrbits:()=>{v.overlay.clear(),q.flash("orbit","info","<b>Órbitas borradas</b>",3e3,"◠")},onResetView:()=>{E.patch({inclination:R.inclination,azimuth:R.azimuth,distanceRg:R.distanceRg,fov:R.fov,distanceMode:"rg"})},onScreenshot:()=>{const t=v.screenshot(),e=document.createElement("a"),a=E.get();e.href=t,e.download=`kerr-newman_a${a.spin.toFixed(3)}_q${a.charge.toFixed(3)}.png`,e.click(),q.flash("shot","info","<b>Captura guardada</b> — PNG del canvas en su estado actual.",4e3,"⬇")},onToggleHud:()=>dt.classList.toggle("hidden")});new Ya(en,E);de.addEventListener("click",()=>{const t=Za.classList.toggle("collapsed");de.textContent=t?"›":"‹",de.title=t?"Mostrar panel (H)":"Ocultar panel (H)"});window.addEventListener("keydown",t=>{t.target instanceof HTMLInputElement||((t.key==="h"||t.key==="H")&&de.click(),(t.key==="j"||t.key==="J")&&dt.classList.toggle("hidden"),t.key===" "&&(t.preventDefault(),E.patch({timeWarp:E.get().timeWarp===0?1:0})))});const A={res:f("span"),spp:f("span"),ms:f("span"),gpu:f("span")};A.gpu.textContent=sn(v.caps.renderer);A.gpu.title=`${v.caps.renderer}
EXT_color_buffer_float: ${v.caps.colorBufferFloat}`;an.append(A.res,A.spp,A.ms,A.gpu);function sn(t){const e=t.match(/ANGLE \(([^,]+), ([^,)]+)/);return e?e[2].replace(/ Direct3D.*| \(0x[0-9A-Fa-f]+\)| vs_\d+_\d+.*/g,"").trim():t.slice(0,42)}function rn(t){t&&(A.res.innerHTML=`<span class="s-val">${t.internalWidth}×${t.internalHeight}</span> @ ${(t.scale*100).toFixed(0)}%`,A.spp.innerHTML=t.converged?`<span class="conv">${t.samples} spp · convergido</span>`:`<span class="s-val">${t.samples}/${t.targetSamples}</span> spp`,A.ms.innerHTML=`<span class="s-val">${t.frameMs.toFixed(1)}</span> ms`)}let We=performance.now(),je=!1,pt=null;window.__sim={store:E,renderer:v,camera:K,presets:ct,applyPreset:ut,launchOrbit:ht,get lastStats(){return pt}};function mt(t){const e=Math.min((t-We)/1e3,.1);We=t,K.update();const a=E.get(),n=E.getDerived(),o=v.advanceTime(e,a,n);o&&v.invalidate();const s=K.isInteracting||o;s!==je&&(v.invalidate(),je=s);const r=v.render(a,n,s);r&&(pt=r),rn(r),requestAnimationFrame(mt)}requestAnimationFrame(mt);window.addEventListener("resize",()=>v.invalidate());
