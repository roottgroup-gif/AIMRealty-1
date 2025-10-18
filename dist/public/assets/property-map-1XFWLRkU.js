import{c as je,u as Ne,b as Te,r as m,I as ze,j as n,B as Pe,q as de}from"./index-gVtgMtKL.js";import{f as Ee,g as Me}from"./use-properties-BAMJa5MG.js";import{M as Se}from"./map-pin-BZWIKE3O.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=je("Navigation",[["polygon",{points:"3 11 22 2 13 21 11 13 3 11",key:"1ltx0t"}]]);function Ze({properties:x,filters:Q={},onFilterChange:V,onPropertyClick:Ie,onPropertySelect:U,userId:M,className:ue}){const{t:p,getLocalized:pe,language:b}=Ne(),{preferredCurrency:N}=Te(),J=b==="ar"||b==="kur",ae=J?"space-x-3 sm:space-x-4":"space-x-2 sm:space-x-3",H=J?"space-x-3":"space-x-2",P=m.useRef(null),a=m.useRef(null),E=m.useRef([]),T=m.useRef([]),[O,q]=m.useState(!1),[Ae,ge]=m.useState(!1),fe=Ee(),me=Me(),se=ze(),[f,ie]=m.useState(Q||{}),K=m.useRef(!1),ee=m.useRef(null),R=e=>pe(e.title,e.title||"Untitled Property"),[Y,he]=m.useState({}),le=m.useRef({}),_=e=>{const t=Y[e.id]??le.current[e.id];return t!==void 0?de(e.price,e.currency,e.listingType,N,t,p):de(e.price,e.currency,e.listingType,e.currency,parseFloat(e.price),p)};m.useEffect(()=>{const e=()=>{const o=document.documentElement.classList.contains("dark");ge(o),T.current.length>0&&D(T.current)};e();const t=new MutationObserver(e);return t.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]}),()=>t.disconnect()},[]),m.useEffect(()=>{(async()=>{if(console.log("🔄 Currency conversion triggered:",{propertiesCount:(x==null?void 0:x.length)||0,preferredCurrency:N,properties:x==null?void 0:x.map(o=>({id:o.id,price:o.price,currency:o.currency}))}),!x||x.length===0){console.log("❌ No properties to convert");return}const t={};for(const o of x)if(o.currency===N)console.log("✅ Same currency for",o.id,":",o.currency),t[o.id]=parseFloat(o.price);else try{console.log("💱 Converting",o.id,":",o.price,o.currency,"→",N);const r=await fetch(`/api/currency/convert?amount=${o.price}&from=${o.currency}&to=${N}`);if(r.ok){const l=await r.json();console.log("✅ Converted",o.id,":",l.convertedAmount),t[o.id]=l.convertedAmount}else console.log("❌ Conversion failed for",o.id,"- using original price"),t[o.id]=parseFloat(o.price)}catch(r){console.log("❌ Conversion error for",o.id,":",r),t[o.id]=parseFloat(o.price)}console.log("📊 Final converted prices:",t),he(t),le.current={...t}})()},[x,N]);const xe=()=>{T.current.forEach(e=>{const t=document.getElementById(`popup-price-${e.id}`);if(t){const o=_(e);t.innerHTML=o}})};m.useEffect(()=>{T.current.length>0&&(D(T.current),xe())},[N,Y]),m.useEffect(()=>{if(K.current){K.current=!1;return}ie(Q||{})},[Q]),m.useEffect(()=>(window.changeSlide=(e,t)=>{try{const o=document.getElementById(e);if(!o)return;const r=o.querySelectorAll(".popup-slide"),l=o.querySelector(".slide-counter");if(!r||r.length===0)return;let s=0;r.forEach((h,v)=>{h&&h.style.opacity==="1"&&(s=v)});let i=s+t;i>=r.length&&(i=0),i<0&&(i=r.length-1),r.forEach(h=>{h&&(h.style.opacity="0")}),r[i]&&(r[i].style.opacity="1"),l&&(l.textContent=(i+1).toString())}catch(o){console.warn("Error in changeSlide function:",o)}},window.toggleFavoriteFromMap=async e=>{if(!M){console.warn("User not logged in, cannot toggle favorite");return}try{const t=se.getQueryData(["/api/favorites/check",{userId:M,propertyId:e}]),o=(t==null?void 0:t.isFavorite)||!1;o?await me.mutateAsync({userId:M,propertyId:e}):await fe.mutateAsync({userId:M,propertyId:e});const r=document.querySelector(`#heart-btn-${e}`);if(r){const l=!o;r.innerHTML=l?'<i class="fas fa-heart" style="color: #ef4444; font-size: 14px;"></i>':'<i class="far fa-heart" style="color: #6b7280; font-size: 14px;"></i>',r.style.backgroundColor=l?"#fee2e2":"#f3f4f6"}}catch(t){console.error("Failed to toggle favorite:",t)}},window.viewPropertyFromMap=e=>{try{const t=x.find(i=>i.id===e),o=(t==null?void 0:t.slug)||e;console.log("Navigating to property:",e,"using identifier:",o);const l=window.location.pathname.match(/^\/(en|ar|kur)\//),s=l?`/${l[1]}`:"/en";if(window.location){window.location.href=`${s}/property/${o}`;return}window.open(`${s}/property/${o}`,"_self")}catch(t){console.error("Navigation failed:",t);const o=x.find(h=>h.id===e),r=(o==null?void 0:o.slug)||e,s=window.location.pathname.match(/^\/(en|ar|kur)\//),i=s?`/${s[1]}`:"/en";window.open(`${i}/property/${r}`,"_blank")}},window.zoomToPropertyFromCluster=(e,t,o)=>{if(a.current&&t&&o){const r=parseFloat(t),l=parseFloat(o),s=window.L,i=document.querySelector(`[onclick*="${e}"]`);i&&(i.style.background="linear-gradient(135deg, #FF7800 0%, #e56600 100%)",i.style.color="white",i.style.transform="scale(1.02)",i.style.transition="all 0.3s ease",setTimeout(()=>{i&&(i.style.background="transparent",i.style.color="",i.style.transform="scale(1)")},1500)),a.current.closePopup();const h=a.current.getZoom(),v=Math.min(Math.max(14,h+1),17);if(setTimeout(()=>{a.current&&(a.current.flyTo([r,l],v,{animate:!0,duration:1.5,easeLinearity:.1}),setTimeout(()=>{if(a.current&&s){const w=s.divIcon({html:`
                    <div style="
                      width: 60px;
                      height: 60px;
                      border-radius: 50%;
                      background: radial-gradient(circle, rgba(255, 120, 0, 0.8) 0%, rgba(255, 120, 0, 0.4) 50%, transparent 70%);
                      animation: pulseAnimation 2s ease-out;
                      pointer-events: none;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <div style="
                        width: 20px;
                        height: 20px;
                        background: #FF7800;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                      "></div>
                    </div>
                    <style>
                      @keyframes pulseAnimation {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(1); opacity: 0.8; }
                      }
                    </style>
                  `,className:"pulse-marker",iconSize:[60,60],iconAnchor:[30,30]}),g=s.marker([r,l],{icon:w}).addTo(a.current);setTimeout(()=>{g&&a.current&&a.current.removeLayer(g)},2e3)}},800))},200),U){const w=x.find(g=>g.id===e);w&&setTimeout(()=>{U(w)},1e3)}}},()=>{window.changeSlide&&delete window.changeSlide,window.toggleFavoriteFromMap&&delete window.toggleFavoriteFromMap,window.viewPropertyFromMap&&delete window.viewPropertyFromMap,window.zoomToPropertyFromCluster&&delete window.zoomToPropertyFromCluster}),[]),m.useEffect(()=>{if(!P.current)return;const e=()=>{if(typeof window<"u"&&window.L&&P.current&&!a.current){const t=window.L;try{if(a.current&&(a.current.remove(),a.current=null),P.current._leaflet_id&&delete P.current._leaflet_id,!P.current||!P.current.offsetParent){setTimeout(e,100);return}const r=window.innerHeight<600?6:4,l=18;a.current=t.map(P.current,{zoomControl:!1,attributionControl:!1,minZoom:r,maxZoom:l,zoomSnap:.5,zoomDelta:.5}).setView([36.1911,44.0093],13),t.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a.current),a.current.on("zoomend",()=>{D(T.current)}),setTimeout(()=>{a.current&&a.current.invalidateSize()},100),console.log("Map initialized successfully")}catch(o){console.error("Error initializing map:",o)}}};if(e(),!window.L){const t=setInterval(()=>{window.L&&(clearInterval(t),e())},100);return()=>{clearInterval(t),a.current&&a.current.remove()}}return()=>{if(a.current){try{a.current.remove()}catch(t){console.warn("Error cleaning up map:",t)}a.current=null}E.current.forEach(t=>{try{t&&t.remove&&t.remove()}catch{}}),E.current=[]}},[]),m.useEffect(()=>{const e=()=>{a.current&&a.current.invalidateSize()};window.addEventListener("resize",e);const t=setTimeout(()=>{a.current&&a.current.invalidateSize()},300);return()=>{window.removeEventListener("resize",e),clearTimeout(t)}},[]);const be=(e,t)=>t<7?we(e):t<9?ve(e):(t<12,ce(e,t)),we=e=>{const t={};return e.forEach(o=>{if(!o.latitude||!o.longitude)return;const r=o.country||"Unknown Country";t[r]||(t[r]=[]),t[r].push(o)}),Object.entries(t).map(([o,r])=>({properties:r,country:o,clusterType:"country",center:{lat:r.reduce((l,s)=>l+parseFloat(s.latitude||"0"),0)/r.length,lng:r.reduce((l,s)=>l+parseFloat(s.longitude||"0"),0)/r.length}}))},ve=e=>{const t={};return e.forEach(o=>{if(!o.latitude||!o.longitude)return;const r=o.city||"Unknown City";t[r]||(t[r]=[]),t[r].push(o)}),Object.entries(t).map(([o,r])=>({properties:r,city:o,clusterType:"city",center:{lat:r.reduce((l,s)=>l+parseFloat(s.latitude||"0"),0)/r.length,lng:r.reduce((l,s)=>l+parseFloat(s.longitude||"0"),0)/r.length}}))},ce=(e,t)=>{const o=[],r=new Set,l=t>15?.003:t>13?.005:t>11?.01:t>9?.03:.05;return e.forEach((s,i)=>{if(r.has(i)||!s.latitude||!s.longitude)return;const h=parseFloat(s.latitude),v=parseFloat(s.longitude),w=[s];r.add(i),e.forEach((g,y)=>{if(r.has(y)||!g.latitude||!g.longitude)return;const S=parseFloat(g.latitude),z=parseFloat(g.longitude);Math.sqrt(Math.pow(h-S,2)+Math.pow(v-z,2))<=l&&(w.push(g),r.add(y))}),o.push({properties:w,center:{lat:w.reduce((g,y)=>g+parseFloat(y.latitude||"0"),0)/w.length,lng:w.reduce((g,y)=>g+parseFloat(y.longitude||"0"),0)/w.length}})}),o},te=e=>{switch(e){case"house":return"fas fa-home";case"apartment":return"fas fa-building";case"villa":return"fas fa-university";case"land":return"fas fa-mountain";default:return"fas fa-home"}},ye=e=>{const t={};return e.forEach(o=>{const r=o.type||"house";t[r]=(t[r]||0)+1}),t},ke=(e,t,o=!1)=>{const r=e.properties.length,{lat:l,lng:s}=e.center,i=document.documentElement.classList.contains("dark"),h="linear-gradient(135deg, #f97316 0%, #ea580c 100%)",v="rgba(249, 115, 22, 0.4)",w="#ffffff",g=ye(e.properties),y=f.type&&f.type!=="all",S=y&&g[f.type]>0;let z="fas fa-home";if(y&&S)z=te(f.type);else if(Object.keys(g).length===1){const u=Object.keys(g)[0];z=te(u)}const F=r>10,k=o?F?60:50:44,oe=o?F?"12px":"11px":"14px",X=o?"10px":"12px",G=t.divIcon({html:`
        <div class="cluster-marker" style="
          background: ${h};
          width: ${k}px;
          height: ${k}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: ${o?"column":"row"};
          box-shadow: 0 10px 30px ${v}, 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.2);
          border: 3px solid ${w};
          cursor: pointer;
          font-weight: 700;
          color: white;
          font-size: ${oe};
          position: relative;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          transform: translateZ(0) rotateX(8deg) rotateY(8deg);
          transform-style: preserve-3d;
        "
        onmouseover="this.style.transform='scale(1.2) translateZ(15px) rotateX(15deg) rotateY(15deg)'; this.style.boxShadow='0 20px 50px ${v}, 0 12px 25px rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)';"
        onmouseout="this.style.transform='translateZ(0) rotateX(8deg) rotateY(8deg)'; this.style.boxShadow='0 10px 30px ${v}, 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.2)';">
          ${e.clusterType==="country"?(()=>{if(y&&S)return`<i class="${z}" style="font-size: 12px; margin-bottom: 2px; color: white;"></i>
                        <div style="font-size: 10px; line-height: 1; color: white;">${r}</div>`;{const u=Object.keys(g),j=u.length<=4?u:u.slice(0,4);return`<div style="display: grid; grid-template-columns: ${j.length===1?"1fr":(j.length===2,"1fr 1fr")}; gap: 1px; margin-bottom: 2px;">
                        ${j.map(B=>`<i class="${te(B)}" style="font-size: 8px; color: white;"></i>`).join("")}
                        </div>
                        <div style="font-size: 10px; line-height: 1; color: white;">${r}</div>`}})():e.clusterType==="city"?`<i class="fas fa-city" style="font-size: ${X}; margin-bottom: 2px; color: white;"></i>
             <div style="font-size: 10px; line-height: 1; color: white;">${r}</div>`:`<i class="${z}" style="margin-right: 4px; font-size: ${X}; color: white;"></i><span style="color: white;">${r}</span>`}
        </div>
      `,className:"custom-cluster-marker",iconSize:[k,k],iconAnchor:[k/2,k/2]}),Z=t.marker([l,s],{icon:G}).addTo(a.current),re=i?"#1f2937":"#ffffff",c=i?"#ffffff":"#000000",d=i?"#d1d5db":"#666666",C=i?"#374151":"#e5e7eb";let $;e.clusterType==="country"&&e.country?$=`${r} ${p("map.propertiesIn")} ${e.country}`:e.clusterType==="city"&&e.city?$=`${r} ${p("map.propertiesIn")} ${e.city}`:$=`${r} ${p("map.propertiesInThisArea")}`;const I=`
      <div class="cluster-popup responsive-cluster-popup" style="
        width: 100%; 
        max-width: min(400px, 90vw); 
        min-width: min(280px, 85vw); 
        background: ${re}; 
        color: ${c}; 
        border-radius: 12px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        transform: translateZ(15px) rotateX(3deg);
        transform-style: preserve-3d;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #FF7800 0%, #e56600 100%); 
          color: white; 
          padding: clamp(12px, 4vw, 16px); 
          margin: 0; 
          border-radius: 12px 12px 0 0; 
          font-weight: 600; 
          text-align: center; 
          font-size: clamp(13px, 3vw, 15px);
          letter-spacing: 0.3px;
          word-wrap: break-word;
          border-bottom: 1px solid rgba(255, 120, 0, 0.2);
        ">
          ${$}
        </div>
        <div style="
          max-height: min(350px, 60vh); 
          overflow-y: auto; 
          padding: clamp(6px, 2vw, 8px); 
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 transparent;
        ">
          <style>
            .cluster-popup::-webkit-scrollbar { width: 6px; }
            .cluster-popup::-webkit-scrollbar-track { background: transparent; }
            .cluster-popup::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
            .cluster-popup::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
          </style>
          ${e.properties.map(u=>{const j=u.images&&u.images.length>0?u.images[0]:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&crop=center";return`
                <div style="
                  display: flex; 
                  gap: clamp(8px, 2vw, 12px); 
                  padding: clamp(8px, 2vw, 12px); 
                  border-bottom: 1px solid ${C}; 
                  cursor: pointer; 
                  color: ${c}; 
                  border-radius: 8px;
                  transition: background-color 0.2s ease;
                  margin-bottom: clamp(4px, 1vw, 8px);
                " 
                onclick="window.zoomToPropertyFromCluster('${u.id}', ${u.latitude}, ${u.longitude})"
                onmouseover="this.style.backgroundColor='${i?"#374151":"#f8fafc"}'"
                onmouseout="this.style.backgroundColor='transparent'">
                  
                  <div style="
                    width: clamp(60px, 15vw, 80px); 
                    height: clamp(45px, 12vw, 60px); 
                    border-radius: 6px; 
                    overflow: hidden; 
                    flex-shrink: 0;
                    background: #e2e8f0;
                  ">
                    <img src="${j}" 
                         alt="${R(u)}" 
                         style="
                           width: 100%; 
                           height: 100%; 
                           object-fit: cover;
                         " 
                         onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&crop=center';" />
                  </div>
                  
                  <div style="flex: 1; min-width: 0;">
                    <div style="
                      font-weight: 600; 
                      font-size: clamp(12px, 3vw, 14px); 
                      margin-bottom: 4px; 
                      color: ${c};
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      line-height: 1.3;
                    ">${R(u)}</div>
                    
                    <div style="
                      font-size: clamp(10px, 2.5vw, 12px); 
                      color: ${d}; 
                      margin-bottom: 6px;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      line-height: 1.3;
                    ">${u.address}</div>
                    
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      margin-bottom: 4px;
                    ">
                      <div id="popup-price-${u.id}" style="
                        font-weight: 700; 
                        color: #FF7800; 
                        font-size: clamp(11px, 3vw, 13px);
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        line-height: 1.3;
                      ">
                        ${_(u)}
                      </div>
                      <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 3px;
                        padding: 2px 6px;
                        border-radius: 12px;
                        font-size: clamp(8px, 2vw, 10px);
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        ${u.listingType==="rent"?"background: rgba(34, 197, 94, 0.15); color: #059669; border: 1px solid rgba(34, 197, 94, 0.3);":"background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);"}
                      ">
                        ${u.listingType==="rent"?`<span style="color: #059669;"></span><span>${p("filter.forRent")}</span>`:`<span style="color: #dc2626;"></span><span>${p("filter.forSale")}</span>`}
                      </div>
                    </div>
                  </div>
                </div>
              `}).join("")}
        </div>
      </div>
    `;Z.addTo(a.current),Z.bindPopup(I,{maxWidth:350,className:"custom-cluster-popup"}),E.current.push(Z)},$e=e=>{if(!M)return!1;const t=se.getQueryData(["/api/favorites/check",{userId:M,propertyId:e}]);return(t==null?void 0:t.isFavorite)||!1},Fe=(e,t)=>{const o=parseFloat(e.latitude||"0"),r=parseFloat(e.longitude||"0"),l=(c,d,C=!1,$=!1)=>{const I=document.documentElement.classList.contains("dark");let u=d==="sale"?"#dc2626":"#059669",j="#ffffff",A=d==="sale"?I?"rgba(220, 38, 38, 0.4)":"rgba(220, 38, 38, 0.3)":I?"rgba(5, 150, 105, 0.4)":"rgba(5, 150, 105, 0.3)",B=C?"premium-marker":"",ne=c==="apartment"?"fa-building":c==="land"?"fa-map-marked-alt":c==="villa"?"fa-university":"fa-home";const W=$?`
        <div class="wave-circle" style="
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border-radius: 50%;
          border: 3px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite;
        "></div>
        <div class="wave-circle" style="
          position: absolute;
          top: -16px;
          left: -16px;
          right: -16px;
          bottom: -16px;
          border-radius: 50%;
          border: 2px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite 0.5s;
          opacity: 0.7;
        "></div>
        <div class="wave-circle" style="
          position: absolute;
          top: -24px;
          left: -24px;
          right: -24px;
          bottom: -24px;
          border-radius: 50%;
          border: 1px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite 1s;
          opacity: 0.4;
        "></div>
        <style>
          @keyframes wave-pulse {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        </style>
      `:"";return t.divIcon({html:`
          <div class="property-marker-icon ${B}" style="
            background: ${u};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px ${A}, 0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid ${j};
            cursor: pointer;
            position: relative;
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateZ(0) rotateX(5deg) rotateY(5deg);
            transform-style: preserve-3d;
          "
          onmouseover="this.style.transform='scale(1.15) translateZ(10px) rotateX(10deg) rotateY(10deg)'; this.style.zIndex='1001'; this.style.boxShadow='0 15px 35px ${A}, 0 8px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)';"
          onmouseout="this.style.transform='translateZ(0) rotateX(5deg) rotateY(5deg)'; this.style.zIndex='1000'; this.style.boxShadow='0 8px 25px ${A}, 0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)';">
            <i class="fas ${ne}" style="color: white; font-size: 16px; pointer-events: none;"></i>
            ${C?'<div class="premium-ring" style="position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border-radius: 50%; border: 2px solid #fbbf24; animation: pulse 2s infinite;"></div>':""}
            ${W}
          </div>
        `,className:"custom-property-marker clickable-marker",iconSize:[40,40],iconAnchor:[20,20]})},s=e.waveId&&e.waveId!=="no-wave",i=l(e.type,e.listingType,e.isFeatured,s),h=t.marker([o,r],{icon:i}).addTo(a.current),v=e.images&&e.images.length>0?e.images:["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],w=v.length>1,g=`popup-${e.id}`,y=document.documentElement.classList.contains("dark"),S=y?"#1f2937":"#ffffff",z=y?"#ffffff":"#000000",F=y?"#d1d5db":"#666666",k=$e(e.id),oe=k?"fas fa-heart":"far fa-heart",X=k?"#ef4444":"#6b7280",G=k?"#fee2e2":"#f3f4f6",Z=k?"#fecaca":"#e5e7eb",re=`
      <div class="property-popup responsive-popup" id="${g}" style="
        background: ${S}; 
        color: ${z};
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        transform: translateZ(10px) rotateX(2deg);
        transform-style: preserve-3d;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);">
        ${v.length>0?`
          <div class="popup-image-container" style="position: relative;">
            <div class="popup-image-slider" style="position: relative; height: 150px; overflow: hidden;">
              ${v.map((c,d)=>`
                <img src="${c}" alt="${R(e)} - Image ${d+1}" 
                     class="popup-slide" 
                     style="
                       width: 100%; 
                       height: 150px; 
                       object-fit: cover; 
                       position: absolute; 
                       top: 0; 
                       left: 0;
                       opacity: ${d===0?"1":"0"};
                       transition: opacity 0.3s ease;
                     "
                     data-slide-index="${d}"
                     onerror="this.style.display='none';" />
              `).join("")}
            </div>
            ${w?`
              <button onclick="changeSlide('${g}', -1)" 
                      style="
                        position: absolute; 
                        left: 8px; 
                        top: 50%; 
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5); 
                        color: white; 
                        border: none; 
                        border-radius: 50%; 
                        width: 30px; 
                        height: 30px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        z-index: 1000;
                        direction: ltr;
                      "
                      onmouseover="this.style.background='rgba(0,0,0,0.7)'"
                      onmouseout="this.style.background='rgba(0,0,0,0.5)'">‹</button>
              <button onclick="changeSlide('${g}', 1)" 
                      style="
                        position: absolute; 
                        right: 8px; 
                        top: 50%; 
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5); 
                        color: white; 
                        border: none; 
                        border-radius: 50%; 
                        width: 30px; 
                        height: 30px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        z-index: 1000;
                        direction: ltr;
                      "
                      onmouseover="this.style.background='rgba(0,0,0,0.7)'"
                      onmouseout="this.style.background='rgba(0,0,0,0.5)'">›</button>
              <div style="
                position: absolute; 
                bottom: 8px; 
                right: 8px; 
                background: rgba(0,0,0,0.7); 
                color: white; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px;
                z-index: 1000;
              ">
                <span class="slide-counter">1</span> / ${v.length}
              </div>
            `:""}
          </div>
        `:""}
        <div class="popup-content" style="padding: 16px; background: ${S}; direction: ${b==="ar"||b==="kur"?"rtl":"ltr"}; text-align: ${b==="ar"||b==="kur"?"right":"left"};">
          <h4 class="popup-title" style="color: ${z}; font-weight: 600; font-size: 16px; margin-bottom: 8px;">${R(e)}</h4>
          <p class="popup-address" style="color: ${F}; font-size: 12px; margin-bottom: 8px;">${e.address}</p>
          <p class="popup-price" id="popup-price-${e.id}" style="color: #FF7800; font-weight: 700; font-size: 18px; margin-bottom: 12px;">
            ${_(e)}
          </p>
          <div class="popup-details" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px; color: ${F}; justify-content: ${b==="ar"||b==="kur"?"flex-end":"flex-start"};">
            ${e.bedrooms?`<span style="color: ${F};">${b==="ar"||b==="kur"?`${e.bedrooms} ${p("property.beds")} <i class="fas fa-bed" style="color: #FF7800; margin-left: 4px;"></i>`:`<i class="fas fa-bed" style="color: #FF7800; margin-right: 4px;"></i>${e.bedrooms} ${p("property.beds")}`}</span>`:""} 
            ${e.bathrooms?`<span style="color: ${F};">${b==="ar"||b==="kur"?`${e.bathrooms} ${p("property.baths")} <i class="fas fa-bath" style="color: #FF7800; margin-left: 4px;"></i>`:`<i class="fas fa-bath" style="color: #FF7800; margin-right: 4px;"></i>${e.bathrooms} ${p("property.baths")}`}</span>`:""}
            ${e.area?`<span style="color: ${F};">${b==="ar"||b==="kur"?`${e.area} ${p("property.sqFt")} <i class="fas fa-ruler-combined" style="color: #FF7800; margin-left: 4px;"></i>`:`<i class="fas fa-ruler-combined" style="color: #FF7800; margin-right: 4px;"></i>${e.area} ${p("property.sqFt")}`}</span>`:""}
          </div>
          ${(()=>{const c=e.customerContact;let d;return c&&c.phone?(d=c.phone,c.name):e.contactPhone?(d=e.contactPhone,e.agent&&`${e.agent.firstName||""} ${e.agent.lastName||""}`.trim()):e.agent&&e.agent.phone&&(d=e.agent.phone,e.agent&&`${e.agent.firstName||""} ${e.agent.lastName||""}`.trim()),d?(d.replace(/\s+/g,""),c&&c.phone,`
             
              `):""})()}
          <div class="popup-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="popup-button" 
                    onclick="window.viewPropertyFromMap('${e.id}')"
                    onmouseover="this.style.background='#e56600'"
                    onmouseout="this.style.background='#FF7800'"
                    style="flex: 1; min-width: 100px; background: #FF7800; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease; z-index: 9999; position: relative;">
              ${p("property.viewProperty")}
            </button>
            ${M?`
              <button id="heart-btn-${e.id}" 
                      class="popup-button heart-button" 
                      onclick="window.toggleFavoriteFromMap('${e.id}')"
                      style="background: ${G}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                      onmouseover="this.style.background='${Z}'"
                      onmouseout="this.style.background='${G}'"
                      title="${k?"Remove from Favorites":"Add to Favorites"}">
                <i class="${oe}" style="color: ${X}; font-size: 14px;"></i>
              </button>
            `:""}
            ${(()=>{const c=e.customerContact;let d,C,$=!1;if(c&&c.phone?(d=c.phone,C=c.name,$=!0):e.contactPhone?(d=e.contactPhone,C=e.agent?`${e.agent.firstName||""} ${e.agent.lastName||""}`.trim()||"Agent":"Owner"):e.agent&&e.agent.phone&&(d=e.agent.phone,C=e.agent?`${e.agent.firstName||""} ${e.agent.lastName||""}`.trim()||"Agent":"Owner"),d){const I=d.replace(/[^+0-9]/g,""),u=d.replace(/\s+/g,""),j=$?"#3b82f6":"#16a34a",A=$?"#2563eb":"#0c7b00",B="#25D366",ne="#128C7E",W=$?"Customer":"Agent";return`
                  <button class="popup-button" 
                          onclick="window.open('tel:${d}', '_self')"
                          onmouseover="this.style.background='${A}'"
                          onmouseout="this.style.background='${j}'"
                          style="background: ${j}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                          title="Call ${W} - ${C} (${u})">
                    <i class="fas fa-phone" style="color: white;"></i>
                  </button>
                  <button class="popup-button" 
                          onclick="window.open('https://wa.me/${I}?text=Hi, I\\'m interested in this property: ${encodeURIComponent(R(e))} - ${e.currency==="USD"?"$":e.currency}${parseFloat(e.price).toLocaleString()}', '_blank')"
                          onmouseover="this.style.background='${ne}'"
                          onmouseout="this.style.background='${B}'"
                          style="background: ${B}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                          title="WhatsApp ${W} - ${C} (${u})">
                    <i class="fab fa-whatsapp" style="color: white;"></i>
                  </button>
                `}else return`<span style="color: ${F}; font-size: 12px; font-style: italic;">Contact info not available</span>`})()}
          </div>
        </div>
      </div>
    `;h.addTo(a.current),h.bindPopup(re,{maxWidth:350,minWidth:240,className:"custom-popup"}),h.on("popupopen",()=>{console.log("🔓 Popup opened for property:",e.id);const c=document.getElementById(`popup-price-${e.id}`);if(c){const d=_(e);console.log("💰 Updating popup price:",{propertyId:e.id,oldPrice:c.innerHTML,newPrice:d}),c.innerHTML=d}else console.log("❌ Price element not found for property:",e.id)}),h.on("click",()=>{U&&U(e)}),E.current.push(h)};m.useEffect(()=>{T.current=x,(!x.some(o=>o.currency!==N)||Object.keys(Y).length>0)&&D(x)},[x,Y,N]),m.useEffect(()=>{T.current.length>0&&D(T.current)},[b]);const D=e=>{if(!a.current||typeof window>"u"||!window.L||!e||e.length===0)return;const t=window.L;E.current.forEach(s=>{try{a.current&&s&&a.current.removeLayer(s)}catch{}}),E.current=[];const o=a.current.getZoom(),r=be(e,o),l=o<10;r.forEach(s=>{s.properties.length===1?Fe(s.properties[0],t):ke(s,t,l)})},L=(e,t)=>{const o=Date.now();if(ee.current&&o-ee.current<100)return;ee.current=o,console.log(`Filter change: ${e} = ${t}`),K.current=!0;const r={...f};t==="any-price"||t==="all-types"||t==="any-bedrooms"?delete r[e]:f[e]===t?(delete r[e],console.log(`Unselecting filter: ${e}`)):e==="maxPrice"||e==="bedrooms"?r[e]=parseInt(t):r[e]=t,r.limit=100,ie(r),console.log("Updated filters:",r),V==null||V(r)},Ce=()=>{a.current&&(q(!0),"geolocation"in navigator?navigator.geolocation.getCurrentPosition(e=>{const{latitude:t,longitude:o}=e.coords,r=window.L;if(a.current&&r){a.current.flyTo([t,o],15,{animate:!0,duration:2.5,easeLinearity:.25});const l=r.divIcon({html:`
                <div style="
                  background: #FF7800;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `,className:"user-location-marker",iconSize:[20,20],iconAnchor:[10,10]});E.current.forEach(i=>{i.options&&i.options.icon&&i.options.icon.options.className==="user-location-marker"&&a.current.removeLayer(i)});const s=r.marker([t,o],{icon:l}).addTo(a.current);s.bindPopup("📍 Your Current Location"),E.current.push(s)}q(!1)},e=>{console.error("Error getting location:",e),q(!1),alert("Unable to get your location. Please check your browser permissions.")},{enableHighAccuracy:!0,timeout:1e4,maximumAge:6e4}):(q(!1),alert("Geolocation is not supported by your browser.")))};return n.jsx("div",{className:ue,children:n.jsx("div",{className:"relative",children:n.jsxs("div",{className:"relative h-screen","data-testid":"property-map",children:[n.jsx("div",{ref:P,className:"w-full h-full"}),n.jsx("div",{className:"fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out",children:n.jsxs("div",{className:"p-4 md:p-5 transition-all duration-300 space-y-4",children:[n.jsx("div",{className:"flex justify-end",children:n.jsxs(Pe,{onClick:Ce,disabled:O,className:`relative w-10 h-10 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-orange-500 hover:bg-orange-600 border-orange-400 text-white flex-shrink-0 flex items-center justify-center overflow-hidden ${O?"animate-pulse":""}`,"data-testid":"footer-location-button",children:[!O&&n.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-sweep"}),n.jsx(Le,{className:`relative h-4 w-4 text-white z-10 transition-transform duration-300 ${O?"animate-slow-spin":""}`})]})}),n.jsxs("div",{className:"flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm",children:[n.jsxs("div",{className:`flex items-center ${ae} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.listingType==="sale"?"bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("listingType","sale")},children:[n.jsx("div",{className:`w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0 shadow-lg ${f.listingType==="sale"?"animate-pulse":""}`}),n.jsx("span",{className:`font-semibold text-sm drop-shadow-lg ${f.listingType==="sale"?"text-red-700 dark:text-red-300":"text-black dark:text-white"}`,children:p("filter.forSale")})]}),n.jsxs("div",{className:`flex items-center ${ae} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.listingType==="rent"?"bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("listingType","rent")},children:[n.jsx("div",{className:`w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0 shadow-lg ${f.listingType==="rent"?"animate-pulse":""}`}),n.jsx("span",{className:`font-semibold text-sm drop-shadow-lg ${f.listingType==="rent"?"text-green-700 dark:text-green-300":"text-black dark:text-white"}`,children:p("filter.forRent")})]}),n.jsxs("div",{className:`flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 ${J?"flex-wrap":"flex-nowrap"}`,children:[n.jsxs("div",{className:`flex items-center ${H} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.type==="house"?"bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("type","house")},children:[n.jsx("i",{className:"fas fa-home text-sm sm:text-base flex-shrink-0 drop-shadow-lg",style:{color:"#FF7800"}}),n.jsx("span",{className:`text-sm font-medium drop-shadow-lg ${f.type==="house"?"text-orange-700 dark:text-orange-300":"text-black dark:text-white"}`,children:p("filter.houses")})]}),n.jsxs("div",{className:`flex items-center ${H} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.type==="apartment"?"bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("type","apartment")},children:[n.jsx("i",{className:"fas fa-building text-sm sm:text-base flex-shrink-0 drop-shadow-lg",style:{color:"#FF7800"}}),n.jsx("span",{className:`text-sm font-medium drop-shadow-lg ${f.type==="apartment"?"text-orange-700 dark:text-orange-300":"text-black dark:text-white"}`,children:p("filter.apartments")})]}),n.jsxs("div",{className:`flex items-center ${H} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.type==="villa"?"bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("type","villa")},children:[n.jsx("i",{className:"fas fa-university text-sm sm:text-base flex-shrink-0 drop-shadow-lg",style:{color:"#FF7800"}}),n.jsx("span",{className:`text-sm font-medium drop-shadow-lg ${f.type==="villa"?"text-orange-700 dark:text-orange-300":"text-black dark:text-white"}`,children:p("filter.villa")})]}),n.jsxs("div",{className:`flex items-center ${H} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${f.type==="land"?"bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600":"bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"}`,onClick:e=>{e.preventDefault(),e.stopPropagation(),L("type","land")},children:[n.jsx("i",{className:"fas fa-map-marked-alt text-sm sm:text-base flex-shrink-0 drop-shadow-lg",style:{color:"#FF7800"}}),n.jsx("span",{className:`text-sm font-medium drop-shadow-lg ${f.type==="land"?"text-orange-700 dark:text-orange-300":"text-black dark:text-white"}`,children:p("filter.land")})]})]})]})]})}),typeof window>"u"||!window.L?n.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center backdrop-blur-sm",children:n.jsxs("div",{className:"text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl border border-white/30",children:[n.jsxs("div",{className:"relative",children:[n.jsx(Se,{className:"mx-auto h-16 w-16 mb-6 animate-bounce drop-shadow-lg",style:{color:"#FF7800"}}),n.jsx("div",{className:"absolute -top-2 -right-2 w-6 h-6 rounded-full animate-ping opacity-75",style:{backgroundColor:"#FF7800"}})]}),n.jsx("h3",{className:"text-xl font-bold text-gray-800 mb-2",children:p("map.loadingTitle")}),n.jsx("p",{className:"text-gray-600 mb-4",children:p("map.loadingDescription")}),n.jsxs("div",{className:"flex items-center justify-center space-x-1 mb-4",children:[n.jsx("div",{className:"w-2 h-2 rounded-full animate-pulse",style:{backgroundColor:"#FF7800"}}),n.jsx("div",{className:"w-2 h-2 rounded-full animate-pulse",style:{animationDelay:"0.2s",backgroundColor:"#FF7800"}}),n.jsx("div",{className:"w-2 h-2 rounded-full animate-pulse",style:{animationDelay:"0.4s",backgroundColor:"#FF7800"}})]}),n.jsx("p",{className:"text-sm text-gray-500 font-medium",children:p("map.poweredBy")})]})}):null]})})})}export{Ze as default};
