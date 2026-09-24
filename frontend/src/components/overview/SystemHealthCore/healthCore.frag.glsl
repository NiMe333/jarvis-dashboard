uniform float uTime;
uniform vec2 uResolution;
uniform float uHealth;
uniform float uMotionEnabled;
uniform float uDebugStage;
varying vec2 vUv;
#define PI 3.14159265359
#define TAU 6.28318530718
float ringMask(float r,float target,float width){float aa=fwidth(r)*1.4;return 1.0-smoothstep(width,width+aa,abs(r-target));}
float glowRing(float r,float target,float intensity){return exp(-abs(r-target)*42.0)*intensity;}
float angle01(float a){return fract(a/TAU+1.0);}
float segmentedRing(vec2 p,float radius,float width,float count,float gap,float rotation){float r=length(p);float cell=angle01(atan(p.y,p.x)+rotation)*count;float local=fract(cell);float segment=smoothstep(gap,gap+.035,local)*smoothstep(1.0-gap,1.0-gap-.035,local);float segmentActive=step(floor(cell),floor(clamp(uHealth,0.,1.)*count+.5)-1.);return ringMask(r,radius,width)*segment*(segmentActive+.10*(1.-segmentActive));}
float arcMask(vec2 p,float radius,float width,float start,float end,float rotation){float a=angle01(atan(p.y,p.x)+rotation);float inside=step(start,a)*step(a,end);return ringMask(length(p),radius,width)*inside;}
float radialTicks(vec2 p,float radius,float count,float length,float width,float rotation){float a=angle01(atan(p.y,p.x)+rotation);float cell=fract(a*count);float tick=1.-smoothstep(width,width+fwidth(cell)*2.,abs(cell-.5));float r=length(p);float start=smoothstep(radius,radius+.012,r);float end=1.-smoothstep(radius+length,radius+length+.012,r);return tick*start*end;}
float node(vec2 p,vec2 pos,float size){return exp(-dot(p-pos,p-pos)/(size*size));}
void main(){if(uDebugStage==9.){gl_FragColor=vec4(vUv.x,vUv.y,1.,1.);return;}vec2 p=vUv-.5;p.x*=uResolution.x/max(uResolution.y,1.);p*=2.;float r=length(p);float outerRot=uTime*.1047*uMotionEnabled;float innerRot=-uTime*.1496*uMotionEnabled;float pulse=uMotionEnabled>.5?(.96+.04*sin(uTime*1.2)):1.;
 vec3 cyan=vec3(0.,.82,.95),bright=vec3(.35,1.,1.),white=vec3(.72,1.,1.),amber=vec3(1.,.48,.08);vec3 col=vec3(0.);float seg=segmentedRing(p,.69,.075,20.,.115,outerRot);float segGlow=segmentedRing(p,.69,.13,20.,.115,outerRot)*.14;col+=cyan*(seg*.85+segGlow)*pulse;float outer=ringMask(r,.80,.006);outer*=1.-step(.985,fract(angle01(atan(p.y,p.x))*4.));col+=bright*(outer*.42+glowRing(r,.80,.14));float inner=ringMask(r,.55,.008);float innerBroken=inner*(.45+.55*step(.2,fract(angle01(atan(p.y,p.x)+innerRot)*8.)));col+=white*(innerBroken*.55+glowRing(r,.55,.18));
 float arcs=arcMask(p,.43,.009,.06,.29,innerRot)+arcMask(p,.43,.009,.42,.62,innerRot)+arcMask(p,.35,.007,.70,.91,innerRot)+arcMask(p,.48,.006,.16,.34,innerRot);col+=cyan*(arcs*.58);float ticks=radialTicks(p,.83,40.,.09,.08,0.);float major=radialTicks(p,.82,8.,.12,.12,0.);col+=cyan*(ticks*.24+major*.48);float guides=(1.-smoothstep(.004,.012,abs(p.x)))+(1.-smoothstep(.004,.012,abs(p.y)));col+=cyan*guides*.08*smoothstep(.56,.12,r);col+=cyan*ringMask(r,.22,.003)*.24*(.5+.5*step(.2,fract(angle01(atan(p.y,p.x)+innerRot)*6.)));
 for(int i=0;i<4;i++){float a=float(i)*1.37+.42;vec2 q=vec2(cos(a),sin(a))*.76;float n=node(p,q,.018);col+=amber*(n*.9+node(p,q,.05)*.12);}
 float stage=uDebugStage;if(stage==1.)col=cyan*(seg*.85+segGlow);if(stage==2.)col=bright*(outer*.42+glowRing(r,.80,.14))+white*(innerBroken*.55+glowRing(r,.55,.18));if(stage==3.)col=cyan*arcs*.58;if(stage==4.)col=cyan*(ticks*.24+major*.48);if(stage==5.)col=vec3(0.);float alpha=clamp(max(max(col.r,col.g),col.b)*1.15,0.,1.);gl_FragColor=vec4(col,alpha);}
