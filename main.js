/*
THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY.
Edit files in src/ and run 'npm run build'
*/

var le=Object.defineProperty;var _t=Object.getOwnPropertyDescriptor;var Jt=Object.getOwnPropertyNames;var Qt=Object.prototype.hasOwnProperty;var ce=(a,e)=>()=>(a&&(e=a(a=0)),e);var D=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports),de=(a,e)=>{for(var t in e)le(a,t,{get:e[t],enumerable:!0})},Yt=(a,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of Jt(e))!Qt.call(a,s)&&s!==t&&le(a,s,{get:()=>e[s],enumerable:!(o=_t(e,s))||o.enumerable});return a};var P=a=>Yt(le({},"__esModule",{value:!0}),a);var Ge={};de(Ge,{DEFAULT_SETTINGS:()=>O,DEFAULT_STOP_WORDS:()=>Xt});var Xt,O,ue=ce(()=>{Xt=["a","an","and","are","as","at","be","by","for","from","has","he","in","is","it","its","of","on","that","the","to","was","will","with","the","this","but","they","have","had","what","when","where","who","which","why","how","all","each","every","both","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","can","will","just","should","now","my","me","we","us","our","your","their","his","her","i","you","do","does","did","am","been","being","get","got","if","or","may","could","would","should","might","must","one","two","three","four","five","six","seven","eight","nine","ten","there","then","these","those","also","any","about","after","again","before","because","between","during","through","under","over","above","below","up","down","out","off","into","since","until","while","once","here","there","see","saw","seen","go","goes","going","gone","went","want","wanted","make","made","use","used","using","day","days","way","ways","thing","things","yes","no","okay","ok"],O={keywordGroups:[],keywords:[{id:"kw-1",keyword:"Keyword1",target:"Keyword1",variations:[],enableTags:!1,linkScope:"vault-wide",scopeFolder:"",useRelativeLinks:!1,blockRef:"",requireTag:"",onlyInNotesLinkingTo:!1,suggestMode:!1,preventSelfLink:!1,groupId:null},{id:"kw-2",keyword:"Keyword2",target:"Keyword2",variations:[],enableTags:!1,linkScope:"vault-wide",scopeFolder:"",useRelativeLinks:!1,blockRef:"",requireTag:"",onlyInNotesLinkingTo:!1,suggestMode:!1,preventSelfLink:!1,groupId:null}],autoLinkOnSave:!1,caseSensitive:!1,firstOccurrenceOnly:!0,autoCreateNotes:!1,newNoteFolder:"",newNoteTemplate:`# {{keyword}}

Created: {{date}}

`,customStopWords:[],preventSelfLinkGlobal:!1,statistics:{totalLinksCreated:0,totalNotesProcessed:0,lastRunDate:null}}});var U={};de(U,{escapeCSV:()=>ss,escapeRegex:()=>es,generateId:()=>ge,getContext:()=>ts,parseCSVLine:()=>os});function ge(a="id"){return`${a}-${Date.now()}-${Math.random().toString(36).substring(2,11)}`}function es(a){return a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ts(a,e,t=40){let o=Math.max(0,e-t),s=Math.min(a.length,e+t);return"..."+a.substring(o,s)+"..."}function ss(a){return typeof a!="string"?a:a.includes(",")||a.includes('"')||a.includes(`
`)?`"${a.replace(/"/g,'""')}"`:a}function os(a){let e=[],t="",o=!1;for(let s=0;s<a.length;s++){let i=a[s],n=a[s+1];i==='"'&&o&&n==='"'?(t+='"',s++):i==='"'?o=!o:i===","&&!o?(e.push(t.trim()),t=""):t+=i}return e.push(t.trim()),e}var W=ce(()=>{});var je={};de(je,{loadSettings:()=>as,saveSettings:()=>ns,setupSettingsWatcher:()=>rs});async function as(a){let e=Object.assign({},O,await a.loadData());if(e.statistics||(e.statistics=O.statistics),(!e.customStopWords||!Array.isArray(e.customStopWords))&&(e.customStopWords=O.customStopWords),e.keywordGroups||(e.keywordGroups=[]),e.keywords)for(let t of e.keywords)t.id||(t.id=ge("kw")),t.groupId===void 0&&(t.groupId=null),t.enableTags===void 0&&(t.enableTags=null),t.groupId&&t.enableTags===!1&&(t.enableTags=null),t.linkScope===void 0&&(t.linkScope="vault-wide"),t.scopeFolder===void 0&&(t.scopeFolder=""),t.requireTag===void 0&&(t.requireTag=""),t.onlyInNotesLinkingTo===void 0&&(t.onlyInNotesLinkingTo=null),t.groupId&&t.onlyInNotesLinkingTo===!1&&(t.onlyInNotesLinkingTo=null),t.suggestMode===void 0&&(t.suggestMode=null),t.groupId&&t.suggestMode===!1&&(t.suggestMode=null),t.preventSelfLink===void 0&&(t.preventSelfLink=null),t.groupId&&t.preventSelfLink===!1&&(t.preventSelfLink=null),t.useRelativeLinks===void 0&&(t.useRelativeLinks=null),t.groupId&&t.useRelativeLinks===!1&&(t.useRelativeLinks=null);return e}async function ns(a,e){a.isSaving=!0,await a.saveData(e),setTimeout(()=>{a.isSaving=!1},100)}function rs(a){a.isSaving=!1;let e=JSON.stringify(a.settings.keywords);a.registerInterval(window.setInterval(async()=>{if(!a.isSaving)try{let t=await a.loadData();if(t&&t.keywords){let o=JSON.stringify(t.keywords);if(o!==e){if(console.log("Auto Keyword Linker: Settings changed externally, reloading..."),a.settings=Object.assign({},O,t),a.settings.statistics||(a.settings.statistics=O.statistics),(!a.settings.customStopWords||!Array.isArray(a.settings.customStopWords))&&(a.settings.customStopWords=O.customStopWords),a.settings.keywords)for(let s of a.settings.keywords)s.enableTags===void 0&&(s.enableTags=!1),s.linkScope===void 0&&(s.linkScope="vault-wide"),s.scopeFolder===void 0&&(s.scopeFolder=""),s.useRelativeLinks===void 0&&(s.useRelativeLinks=!1),s.blockRef===void 0&&(s.blockRef=""),s.requireTag===void 0&&(s.requireTag=""),s.onlyInNotesLinkingTo===void 0&&(s.onlyInNotesLinkingTo=!1);e=o}}}catch(t){console.log("Auto Keyword Linker: Error checking for settings changes:",t)}},15e3))}var He=ce(()=>{ue();W()});var re=D((La,Ue)=>{function is(a,e){try{let t=a.vault.getMarkdownFiles(),o=null,s=e.endsWith(".md")?e.slice(0,-3):e;for(let l of t){if(l.basename.toLowerCase()===s.toLowerCase()){o=l;break}if((l.path.endsWith(".md")?l.path.slice(0,-3):l.path).toLowerCase()===s.toLowerCase()){o=l;break}}if(!o)return[];let i=a.metadataCache.getFileCache(o);if(!i||!i.frontmatter)return[];let n=i.frontmatter,r=[];return n.aliases&&(Array.isArray(n.aliases)?r=r.concat(n.aliases):typeof n.aliases=="string"&&r.push(n.aliases)),n.alias&&(Array.isArray(n.alias)?r=r.concat(n.alias):typeof n.alias=="string"&&r.push(n.alias)),r.filter(l=>l&&typeof l=="string"&&l.trim())}catch(t){return console.error("Error getting aliases for note:",e,t),[]}}function ls(a,e,t){try{if(!t||t.trim()==="")return!0;let o=t.trim().replace(/^#/,"").toLowerCase(),s=null,i=a.vault.getMarkdownFiles(),n=e.replace(/\.md$/,"");for(let l of i){if(l.basename.toLowerCase()===n.toLowerCase()){s=l;break}if((l.path.endsWith(".md")?l.path.slice(0,-3):l.path).toLowerCase()===n.toLowerCase()){s=l;break}}if(!s)return!1;let r=a.metadataCache.getFileCache(s);if(!r)return!1;if(r.frontmatter){let l=r.frontmatter,c=[];l.tags&&(Array.isArray(l.tags)?c=l.tags:typeof l.tags=="string"&&(c=[l.tags])),l.tag&&(Array.isArray(l.tag)?c=c.concat(l.tag):typeof l.tag=="string"&&c.push(l.tag));for(let u of c)if(typeof u=="string"&&u.replace(/^#/,"").toLowerCase()===o)return!0}if(r.tags){for(let l of r.tags)if(l.tag.replace(/^#/,"").toLowerCase()===o)return!0}return!1}catch(o){return console.error("Error checking tag for note:",e,o),!1}}function cs(a,e,t){try{if(!e)return!1;let o=a.metadataCache.getFileCache(e);if(!o||!o.links||o.links.length===0)return!1;let s=t.replace(/\.md$/,"").toLowerCase();for(let i of o.links){let n=i.link.toLowerCase();if(n===s||n.endsWith("/"+s)||s.endsWith("/"+n))return!0;let r=a.metadataCache.getFirstLinkpathDest(i.link,e.path);if(r){let l=r.basename.toLowerCase(),c=s.split("/").pop();if(l===c)return!0}}return!1}catch(o){return console.error("Error checking links in note:",e.path,o),!1}}async function ds(a,e,t){if(a.vault.getMarkdownFiles().find(l=>l.basename===t))return;let i=e.newNoteFolder||"",n=i?`${i}/${t}.md`:`${t}.md`,r=e.newNoteTemplate;r=r.replace(/{{keyword}}/g,t),r=r.replace(/{{date}}/g,new Date().toISOString().split("T")[0]),i&&(a.vault.getAbstractFileByPath(i)||await a.vault.createFolder(i)),await a.vault.create(n,r)}function us(a,e){let t=a.vault.getMarkdownFiles(),o=e.endsWith(".md")?e.slice(0,-3):e;for(let s of t)if(s.basename.toLowerCase()===o.toLowerCase()||(s.path.endsWith(".md")?s.path.slice(0,-3):s.path).toLowerCase()===o.toLowerCase())return s;return null}Ue.exports={getAliasesForNote:is,noteHasTag:ls,noteHasLinkToTarget:cs,ensureNoteExists:ds,findTargetFile:us}});var pe=D((Ta,_e)=>{var{getAliasesForNote:gs}=re();function Ze(a,e){let t={enableTags:!1,linkScope:"vault-wide",scopeFolder:"",useRelativeLinks:!1,blockRef:"",requireTag:"",onlyInNotesLinkingTo:!1,suggestMode:!1,preventSelfLink:!1};if(e.groupId){let o=a.keywordGroups.find(s=>s.id===e.groupId);o&&o.settings&&Object.assign(t,o.settings)}return e.enableTags!==null&&e.enableTags!==void 0&&(t.enableTags=e.enableTags),e.linkScope!==null&&e.linkScope!==void 0&&e.linkScope!=="vault-wide"&&(t.linkScope=e.linkScope),e.scopeFolder!==null&&e.scopeFolder!==void 0&&e.scopeFolder!==""&&(t.scopeFolder=e.scopeFolder),e.useRelativeLinks!==null&&e.useRelativeLinks!==void 0&&(t.useRelativeLinks=e.useRelativeLinks),e.blockRef!==null&&e.blockRef!==void 0&&e.blockRef!==""&&(t.blockRef=e.blockRef),e.requireTag!==null&&e.requireTag!==void 0&&e.requireTag!==""&&(t.requireTag=e.requireTag),e.onlyInNotesLinkingTo!==null&&e.onlyInNotesLinkingTo!==void 0&&(t.onlyInNotesLinkingTo=e.onlyInNotesLinkingTo),e.suggestMode!==null&&e.suggestMode!==void 0&&(t.suggestMode=e.suggestMode),e.preventSelfLink!==null&&e.preventSelfLink!==void 0&&(t.preventSelfLink=e.preventSelfLink),t}function ps(a,e){let t={};for(let o of e.keywords){if(!o.keyword||!o.keyword.trim()||!o.target||!o.target.trim())continue;let s=Ze(e,o);if(t[o.keyword]={target:o.target,...s,keywordIndex:e.keywords.indexOf(o)},o.variations&&o.variations.length>0)for(let n of o.variations)n.trim()&&(t[n]={target:o.target,...s,keywordIndex:e.keywords.indexOf(o)});let i=gs(a,o.target);if(i&&i.length>0)for(let n of i)n.trim()&&(t[n]||(t[n]={target:o.target,...s,keywordIndex:e.keywords.indexOf(o)}))}return t}function hs(a,e,t,o,s,i){if(o==="vault-wide")return!0;let n=e.parent?e.parent.path:"";if(o==="same-folder"){let r=i(a,t);if(!r)return!1;let l=r.parent?r.parent.path:"";return n===l}if(o==="source-folder"){if(!s)return!0;let r=s.replace(/^\/+|\/+$/g,""),l=n.replace(/^\/+|\/+$/g,"");return l===r||l.startsWith(r+"/")}if(o==="target-folder"){if(!s)return!0;let r=i(a,t);if(!r)return!1;let l=r.parent?r.parent.path:"",c=s.replace(/^\/+|\/+$/g,""),u=l.replace(/^\/+|\/+$/g,"");return u===c||u.startsWith(c+"/")}return!0}_e.exports={getEffectiveKeywordSettings:Ze,buildKeywordMap:ps,checkLinkScope:hs}});var Qe=D((Ea,Je)=>{var{DEFAULT_STOP_WORDS:fs}=(ue(),P(Ge));function he(a){let e=new Set(fs);if(a.customStopWords&&Array.isArray(a.customStopWords))for(let t of a.customStopWords)t&&typeof t=="string"&&e.add(t.toLowerCase().trim());return e}function ee(a,e,t){let o=[],s=he(t),i=a.split(/[\s\-_\/\\,;:]+/);for(let n of i){let r=n.split(/(?=[A-Z])/).filter(l=>l.length>0);for(let l of r){let c=l.trim().replace(/[^\w\s]/g,"").trim();c.length!==0&&(c=c.charAt(0).toUpperCase()+c.slice(1).toLowerCase(),c.length>=3&&!s.has(c.toLowerCase())&&o.push(c))}}return o}function te(a,e){let t=[],o=he(e),s=a.split(/[.\n]/);for(let i of s){let n=i.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);if(n)for(let r of n)r=r.trim(),r.split(/\s+/).some(u=>!o.has(u.toLowerCase()))&&r.length>=5&&t.push(r)}return t}async function ks(a,e,t){let o=a.vault.getMarkdownFiles(),s=new Map,i=new Map,n=new Set(e.keywords.map(l=>l.keyword.toLowerCase()));for(let l of e.keywords)if(l.variations&&l.variations.length>0)for(let c of l.variations)n.add(c.toLowerCase());for(let l of e.keywords){let c=t(l.target);if(c&&c.length>0)for(let u of c)n.add(u.toLowerCase())}for(let l of o){let c=ee(l.basename,!0,e),u=te(l.basename,e);for(let d of c)if(!n.has(d.toLowerCase())){s.has(d)||s.set(d,{count:0,notes:new Set});let h=s.get(d);h.count+=3,h.notes.add(l.basename)}for(let d of u)if(!n.has(d.toLowerCase())){i.has(d)||i.set(d,{count:0,notes:new Set});let h=i.get(d);h.count+=3,h.notes.add(l.basename)}try{let f=(await a.vault.read(l)).substring(0,5e3).replace(/^---[\s\S]*?---\n/,"");f=f.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,""),f=f.replace(/\[([^\]]+)\]\([^)]+\)/g,"");let p=ee(f,!1,e),g=te(f,e);for(let k of p)if(!n.has(k.toLowerCase())){s.has(k)||s.set(k,{count:0,notes:new Set});let w=s.get(k);w.count+=1,w.notes.add(l.basename)}for(let k of g)if(!n.has(k.toLowerCase())){i.has(k)||i.set(k,{count:0,notes:new Set});let w=i.get(k);w.count+=1,w.notes.add(l.basename)}}catch(d){console.log(`Error reading ${l.path}:`,d)}}let r=[];for(let[l,c]of s)r.push({keyword:l,count:c.count,notes:Array.from(c.notes).slice(0,5),totalNotes:c.notes.size});for(let[l,c]of i)r.push({keyword:l,count:c.count,notes:Array.from(c.notes).slice(0,5),totalNotes:c.notes.size});return r.sort((l,c)=>c.count!==l.count?c.count-l.count:c.keyword.length-l.keyword.length),r}async function ms(a,e,t,o){let s=new Map,i=new Map,n=new Set(e.keywords.map(u=>u.keyword.toLowerCase()));for(let u of e.keywords)if(u.variations&&u.variations.length>0)for(let d of u.variations)n.add(d.toLowerCase());for(let u of e.keywords){let d=o(u.target);if(d&&d.length>0)for(let h of d)n.add(h.toLowerCase())}let r=ee(t.basename,!0,e),l=te(t.basename,e);for(let u of r)if(!n.has(u.toLowerCase())){s.has(u)||s.set(u,{count:0,notes:new Set});let d=s.get(u);d.count+=3,d.notes.add(t.basename)}for(let u of l)if(!n.has(u.toLowerCase())){i.has(u)||i.set(u,{count:0,notes:new Set});let d=i.get(u);d.count+=3,d.notes.add(t.basename)}try{let d=(await a.vault.read(t)).replace(/^---[\s\S]*?---\n/,"");d=d.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,""),d=d.replace(/\[([^\]]+)\]\([^)]+\)/g,"");let h=ee(d,!1,e),f=te(d,e);for(let p of h)if(!n.has(p.toLowerCase())){s.has(p)||s.set(p,{count:0,notes:new Set});let g=s.get(p);g.count+=1,g.notes.add(t.basename)}for(let p of f)if(!n.has(p.toLowerCase())){i.has(p)||i.set(p,{count:0,notes:new Set});let g=i.get(p);g.count+=1,g.notes.add(t.basename)}}catch(u){throw console.log(`Error reading ${t.path}:`,u),u}let c=[];for(let[u,d]of s)c.push({keyword:u,count:d.count,notes:Array.from(d.notes),totalNotes:d.notes.size});for(let[u,d]of i)c.push({keyword:u,count:d.count,notes:Array.from(d.notes),totalNotes:d.notes.size});return c.sort((u,d)=>d.count!==u.count?d.count-u.count:d.keyword.length-u.keyword.length),c}Je.exports={getStopWords:he,extractWordsFromText:ee,extractPhrasesFromText:te,analyzeNotesForKeywords:ks,analyzeCurrentNoteForKeywords:ms}});var fe=D((Aa,Ye)=>{function ws(a){if(!a.startsWith("---"))return null;let e=a.split(`
`),t=-1;for(let o=1;o<e.length;o++)if(e[o].trim()==="---"||e[o].trim()==="..."){t=o;break}if(t!==-1){let o=0;for(let s=0;s<=t;s++)o+=e[s].length+1;return{start:0,end:o}}return null}function ys(a,e){let t=!1,o=!1;for(let s=e-1;s>=Math.max(0,e-500);s--){if(s>0&&a[s]==="]"&&a[s-1]==="]")return!1;if(a[s]==="|"&&!o&&(o=!0),s<a.length-1&&a[s]==="["&&a[s+1]==="["){t=!0;break}if(a[s]===`
`)return!1}if(t&&o)for(let s=e;s<Math.min(a.length,e+500);s++){if(s<a.length-1&&a[s]==="]"&&a[s+1]==="]")return!0;if(a[s]===`
`)break}return!1}function vs(a,e,t){let o=Math.max(0,e-500),s=Math.min(a.length,e+t+500),i=a.substring(o,e),n=a.substring(e+t,s),r=a.substring(e,e+t),l=i+r+n,c=e-o,u=/(?:https?|ftp|ftps|sftp|file):\/\/[^\s\]]+/gi,d;for(;(d=u.exec(l))!==null;){let w=d.index,L=d.index+d[0].length;if(c>=w&&c<L)return!0}let h=/\bwww\.[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+[^\s\])"]*/gi;for(;(d=h.exec(l))!==null;){let w=d.index,L=d.index+d[0].length;if(c>=w&&c<L)return!0}let f=/\b[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.(com|org|net|edu|gov|mil|int|info|biz|name|museum|coop|aero|asia|cat|jobs|mobi|travel|xxx|pro|tel|post|co\.uk|co\.jp|co\.kr|co\.nz|co\.au|co\.za|co\.in|co\.id|co\.th|co\.il|ac\.uk|gov\.uk|org\.uk|de|fr|it|es|nl|be|ch|at|se|no|dk|fi|ie|pl|cz|hu|ro|bg|gr|pt|ru|ua|sk|si|hr|lt|lv|ee|cn|jp|kr|tw|hk|sg|my|th|vn|id|ph|in|pk|bd|lk|np|af|au|nz|fj|ca|mx|br|ar|cl|co|pe|ve|ec|uy|py|bo|cr|pa|gt|hn|ni|sv|cu|do|jm|tt|bs|bb|za|eg|ng|ke|gh|tz|ug|zw|ma|dz|tn|sn|ci|cm|ao|mz|na|bw|mw|zm|rw|so|sd|et|ly|iq|ir|sa|ae|kw|qa|om|ye|jo|lb|sy|il|ps|tr|am|az|ge|kz|uz|tm|tj|kg|mn|io|ai|sh|tv|me|cc|ws|to|ly|gl|gd|ms|vg|ag|lc|vc|dm|kn|gp|mq|aw|cw|sx|bq|tc|ky|bm|pr|vi)(?:\b|\/|:|\?|#|$)/gi;for(;(d=f.exec(l))!==null;){let w=d.index,L=d.index+d[0].length;if(c>=w&&c<L&&(w===0||/[\s\(\[\{<"']/.test(l[w-1])))return!0}if(/\.(com|org|net|edu|gov|io|ai|me|tv|co|uk|de|fr|it|jp|cn|au|ca|br|in|ru)\b/i.test(r))return!0;let g=a.substring(Math.max(0,e-100),e),k=a.substring(e+t,Math.min(a.length,e+t+100));return!!(/(?:https?|ftp|ftps):\/\/[^\s]*$/.test(g)||/www\.[^\s]*$/.test(g)||/^\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/|\?|#|:|\s|$)/.test(k))}function bs(a,e){let t=0,o=!1;for(let r=e-1;r>=Math.max(0,e-500);r--){if(r>0&&a[r]==="]"&&a[r-1]==="]"){t--,r--;continue}if(r<a.length-1&&a[r]==="["&&a[r+1]==="["){if(t++,t>0){o=!0;break}r--;continue}if(a[r]===`
`&&t===0)break}if(o)return!0;let s=0;for(let r=0;r<e;r++)a[r]==="`"&&s++;if(s%2===1)return!0;let i=0;for(let r=e-1;r>=Math.max(0,e-300);r--)if(a[r]===")")i--;else if(a[r]==="("){if(i++,i>0&&r>0&&a[r-1]==="]")return!0}else if(a[r]===`
`)break;let n=0;for(let r=e-1;r>=Math.max(0,e-300);r--)if(a[r]==="]")n--;else if(a[r]==="["){if(n++,n>0)for(let l=e;l<Math.min(a.length,e+300);l++){if(a[l]==="]"&&l<a.length-1&&a[l+1]==="(")return!0;if(a[l]===`
`)break}}else if(a[r]===`
`)break;return!1}function xs(a,e){let t=e;for(;t>0&&a[t-1]!==`
`;)t--;let o=e;for(;o<a.length&&a[o]!==`
`;)o++;let s=a.substring(t,o),i=e-t,n=s.lastIndexOf("^",i);if(n!==-1){let r=s.substring(n,i+1);if(/^\^[\w\-]*$/.test(r))return!0}return!1}function Ss(a,e){let t=e;for(;t>0&&a[t-1]!==`
`;)t--;let o=e;for(;o<a.length&&a[o]!==`
`;)o++;if(!a.substring(t,o).includes("|"))return!1;let i=t-1,n=10,r=0;for(;i>0&&r<n;){let c=i;for(;i>0&&a[i-1]!==`
`;)i--;let u=a.substring(i,c).trim();if(u.includes("|")&&u.includes("-")&&(u.replace(/\|/g,"").match(/-/g)||[]).length>=3)return!0;r++,i--}let l=o+1;for(r=0;l<a.length&&r<3;){let c=l;for(;l<a.length&&a[l]!==`
`;)l++;let u=a.substring(c,l).trim();if(u.includes("|")&&u.includes("-")&&(u.replace(/\|/g,"").match(/-/g)||[]).length>=3)return!0;r++,l++}return!1}Ye.exports={getFrontmatterBounds:ws,isInsideAlias:ys,isPartOfUrl:vs,isInsideLinkOrCode:bs,isInsideBlockReference:xs,isInsideTable:Ss}});var me=D(($a,et)=>{var{MarkdownView:Cs}=require("obsidian");function Ls(a){return a.replace(/\s+/g,"-").replace(/[^\w\-]/g,"").toLowerCase()}async function ke(a,e){let t=a.match(/\n\n((?:#[\w\-]+\s*)+)$/),o=t?t[1].match(/#[\w\-]+/g).map(n=>n.substring(1)):[],s=e.filter(n=>!o.includes(n));if(s.length===0)return a;let i=s.map(n=>`#${n}`).join(" ");return o.length>0?a=a.replace(/\n\n((?:#[\w\-]+\s*)+)$/,`

$1 ${i}`):a=a.trimEnd()+`

${i}`,a}async function Xe(a,e,t){let s=a.vault.getMarkdownFiles().find(r=>r.basename===e);if(!s)return;let i=await a.vault.read(s);new RegExp(`#${t}\\b`).test(i)||(i=await ke(i,[t]),await a.vault.modify(s,i))}async function Ts(a,e,t,o){if(t&&t.length>0){let s=a.workspace.getActiveViewOfType(Cs),n=s&&s.file.path===e.path?s.editor:null;if(n){let r=n.getValue();if(t.every(g=>new RegExp(`#${g}\\b`).test(r)))return;let c=r.match(/\n\n((?:#[\w\-]+\s*)+)$/),u=c?c[1].match(/#[\w\-]+/g).map(g=>g.substring(1)):[],d=t.filter(g=>!u.includes(g));if(d.length===0)return;let h=d.map(g=>`#${g}`).join(" "),f=n.lastLine(),p=n.getLine(f).length;if(u.length>0)for(let g=f;g>=Math.max(0,f-10);g--){let k=n.getLine(g);if(k.trim().match(/^#[\w\-]+(\s+#[\w\-]+)*$/)){n.replaceRange(` ${h}`,{line:g,ch:k.length});break}}else n.replaceRange(`

${h}`,{line:f,ch:p})}else{let r=await a.vault.read(e);r=await ke(r,t),await a.vault.modify(e,r)}}if(o&&o.size>0)for(let[s,i]of o)await Xe(a,s,i)}et.exports={sanitizeTagName:Ls,addTagsToContent:ke,addTagToTargetNote:Xe,addTagsToFile:Ts}});var st=D((Ia,tt)=>{var{Notice:se}=require("obsidian");async function Es(a,e,t,o,s,i,n=!1){let r=a.workspace.getActiveFile();if(!r){new se("No active file");return}let l=await t(r,n);n&&l?new i(a,l,r.basename).open():!n&&l&&l.changed?(new se(`Linked ${l.linkCount} keyword(s) in current note!`),e.statistics.totalLinksCreated+=l.linkCount,e.statistics.totalNotesProcessed+=1,e.statistics.lastRunDate=new Date().toISOString(),await o(),setTimeout(()=>s(),100)):n||new se("No keywords found to link")}async function As(a,e,t,o,s,i,n=!1){let r=a.vault.getMarkdownFiles(),l=0,c=0,u=[];for(let d of r){if(d.extension!=="md")continue;let h=await t(d,n);h&&h.changed&&(c++,l+=h.linkCount,n&&u.push({file:d,fileName:d.basename,...h}))}!n&&c>0&&(e.statistics.totalLinksCreated+=l,e.statistics.totalNotesProcessed+=c,e.statistics.lastRunDate=new Date().toISOString(),await o()),n&&u.length>0?new i(a,u,s).open():n?new se("No keywords found to link in any notes"):new se(`Linked ${l} keyword(s) in ${c} note(s)!`)}tt.exports={linkKeywordsInCurrentNote:Es,linkKeywordsInAllNotes:As}});var at=D((Na,ot)=>{var{Notice:Z}=require("obsidian");async function $s(a,e,t){new t(a,e).open()}async function Is(a,e,t){let o=a.workspace.getActiveFile();if(!o){new Z("No active note found. Please open a note first.");return}new t(a,e,o).open()}function Ns(a,e,t){let o=e.getValue(),s=[],i=o.split(`
`),n=/<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;if(i.forEach((r,l)=>{let c;for(n.lastIndex=0;(c=n.exec(r))!==null;)s.push({lineNumber:l,targetNote:c[1],blockRef:c[2],useRelative:c[3]==="true",matchText:c[4],fullMatch:c[0]})}),s.length===0){new Z("No link suggestions found in current note");return}new t(a,e,s).open()}function Ds(a,e,t){let o=a.getCursor(),s=a.getLine(o.line),i=/<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g,n=[...s.matchAll(i)];if(n.length===0){new Z("No link suggestions found on this line");return}let r=a.getValue(),l=a.posToOffset({line:o.line,ch:0}),c=e(r,l),u=0;n.forEach(d=>{let h=d[0],f=d[1],p=d[2],g=d[3]==="true",k=d[4],w,L=p?`${f}#${p}`:f;if(g){let T=c?k.replace(/\|/g,"\\|"):k,m=encodeURIComponent(f)+".md",v=p?`#${p}`:"";w=`[${T}](${m}${v})`}else c?w=f===k&&!p?`[[${k}]]`:`[[${L}\\|${k}]]`:w=f===k&&!p?`[[${k}]]`:`[[${L}|${k}]]`;s=s.replace(h,w),u++}),a.setLine(o.line,s),new Z(`Accepted ${u} link suggestion${u>1?"s":""} on this line`),setTimeout(()=>t(),100)}function Fs(a,e,t){let o=a.getValue(),s=o,i=0,n=/<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;s=o.replace(n,(r,l,c,u,d,h)=>{i++;let f=e(o,h),p,g=c?`${l}#${c}`:l;if(u==="true"){let k=f?d.replace(/\|/g,"\\|"):d,w=encodeURIComponent(l)+".md",L=c?`#${c}`:"";p=`[${k}](${w}${L})`}else f?p=l===d&&!c?`[[${d}]]`:`[[${g}\\|${d}]]`:p=l===d&&!c?`[[${d}]]`:`[[${g}|${d}]]`;return p}),i>0?(a.setValue(s),new Z(`Accepted ${i} link suggestion${i>1?"s":""}`),setTimeout(()=>t(),100)):new Z("No link suggestions found in current note")}ot.exports={suggestKeywords:$s,suggestKeywordsFromCurrentNote:Is,reviewSuggestions:Ns,acceptSuggestionAtCursor:Ds,acceptAllSuggestions:Fs}});var rt=D((Da,nt)=>{var{Notice:_}=require("obsidian"),{escapeCSV:oe}=(W(),P(U));async function zs(a,e){try{let t=JSON.stringify(e.keywords,null,2),s=`auto-keyword-linker-export-${new Date().toISOString().split("T")[0]}.json`;await a.vault.create(s,t),new _(`Keywords exported to ${s}`)}catch(t){new _(`Export failed: ${t.message}`)}}async function Bs(a,e,t){new t(a,e).open()}async function Ks(a){try{let i=`keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink
Python,Languages/Python,"python|py|Python3",false,vault-wide,,false,,,false,false
JavaScript,Languages/JavaScript,"js|javascript",false,vault-wide,,false,,,false,false
API,Documentation/API,"api|REST API",false,same-folder,,false,,reviewed,true,false
`,n="auto-keyword-linker-template.csv";await a.vault.create(n,i),new _(`CSV template downloaded: ${n}`)}catch(e){new _(`Template download failed: ${e.message}`)}}async function Vs(a,e){try{let o=["keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink"];for(let r of e.keywords){let l=r.variations&&r.variations.length>0?`"${r.variations.join("|")}"`:"",c=[oe(r.keyword),oe(r.target),l,r.enableTags||!1,r.linkScope||"vault-wide",oe(r.scopeFolder||""),r.useRelativeLinks||!1,oe(r.blockRef||""),oe(r.requireTag||""),r.onlyInNotesLinkingTo||!1,r.suggestMode||!1,r.preventSelfLink||!1].join(",");o.push(c)}let s=o.join(`
`),n=`auto-keyword-linker-export-${new Date().toISOString().split("T")[0]}.csv`;await a.vault.create(n,s),new _(`Keywords exported to ${n}`)}catch(t){new _(`CSV export failed: ${t.message}`)}}async function Ms(a,e,t){new t(a,e).open()}nt.exports={exportKeywords:zs,importKeywords:Bs,downloadCSVTemplate:Ks,exportKeywordsToCSV:Vs,importKeywordsFromCSV:Ms}});var lt=D((Fa,it)=>{function Rs(a,e,t){new t(a,e).open()}it.exports={showStatistics:Rs}});var dt=D((za,ct)=>{var{Modal:qs}=require("obsidian"),we=class extends qs{constructor(e,t){super(e),this.settings=t}onOpen(){let{contentEl:e}=this;e.createEl("h2",{text:"Auto Keyword Linker Statistics"});let t=this.settings.statistics;if(e.createEl("p",{text:`Total Links Created: ${t.totalLinksCreated||0}`}),e.createEl("p",{text:`Total Notes Processed: ${t.totalNotesProcessed||0}`}),e.createEl("p",{text:`Total Keywords Configured: ${this.settings.keywords.length}`}),t.lastRunDate){let i=new Date(t.lastRunDate);e.createEl("p",{text:`Last Run: ${i.toLocaleString()}`})}e.createEl("h3",{text:"Configured Keywords"});let o=e.createEl("ul");for(let i of this.settings.keywords){let n=o.createEl("li");n.appendText(`${i.keyword} \u2192 ${i.target}`),i.variations&&i.variations.length>0&&n.appendText(` (${i.variations.length} variations)`),i.enableTags&&n.appendText(" [Tags enabled]")}let s=e.createEl("button",{text:"Close"});s.style.marginTop="20px",s.addEventListener("click",()=>this.close())}onClose(){let{contentEl:e}=this;e.empty()}};ct.exports=we});var gt=D((Ba,ut)=>{var{Modal:Os,Notice:Ps}=require("obsidian"),ye=class extends Os{constructor(e,t,o=null){super(e),this.plugin=t,this.currentFile=o,this.suggestions=[],this.selectedSuggestions=new Map,this.isAnalyzing=!0,this.searchQuery="",this.sortOrder="frequency-desc"}async onOpen(){let{contentEl:e}=this;e.addClass("akl-suggestion-modal");let t=this.currentFile?`Suggested Keyword Builder - ${this.currentFile.basename}`:"Suggested Keyword Builder";e.createEl("h2",{text:t});let o=e.createDiv({cls:"akl-status"}),s=this.currentFile?"Analyzing current note...":"Analyzing your notes...";o.createEl("p",{text:s,cls:"akl-analyzing"});try{this.currentFile?this.suggestions=await this.plugin.analyzeCurrentNoteForKeywords(this.currentFile):this.suggestions=await this.plugin.analyzeNotesForKeywords(),this.isAnalyzing=!1,o.empty();let i=this.currentFile?1:this.plugin.app.vault.getMarkdownFiles().length,n=i===1?"note":"notes";o.createEl("p",{text:`Found ${this.suggestions.length} suggestions from ${i} ${n}`,cls:"akl-stats"});for(let r of this.suggestions)this.selectedSuggestions.set(r.keyword,{selected:!1,addAsVariationTo:null});this.renderSuggestions(e)}catch(i){o.empty(),o.createEl("p",{text:`Error analyzing notes: ${i.message}`,cls:"akl-error"}),console.error("Error analyzing notes:",i)}}renderSuggestions(e){let t=e.createDiv({cls:"akl-controls-container"}),s=t.createDiv({cls:"akl-search-container"}).createEl("input",{type:"text",placeholder:"Search suggestions...",cls:"akl-search-input"});s.value=this.searchQuery,s.addEventListener("input",g=>{this.searchQuery=g.target.value,this.refreshSuggestionList()});let i=t.createDiv({cls:"akl-sort-container"}),n=i.createEl("label",{text:"Sort by: ",cls:"akl-sort-label"}),r=i.createEl("select",{cls:"akl-sort-select"}),l=[{value:"frequency-desc",label:"Most Common First"},{value:"frequency-asc",label:"Least Common First"},{value:"alpha-asc",label:"A to Z"},{value:"alpha-desc",label:"Z to A"},{value:"length-asc",label:"Shortest First"},{value:"length-desc",label:"Longest First"}];for(let g of l){let k=r.createEl("option",{value:g.value,text:g.label});g.value===this.sortOrder&&(k.selected=!0)}r.addEventListener("change",g=>{this.sortOrder=g.target.value,this.refreshSuggestionList()});let c=e.createDiv({cls:"akl-button-row"});c.createEl("button",{text:"Select All",cls:"akl-mini-button"}).addEventListener("click",()=>{for(let[g,k]of this.selectedSuggestions)this.matchesSearch(g)&&(k.selected=!0);this.refreshSuggestionList()}),c.createEl("button",{text:"Deselect All",cls:"akl-mini-button"}).addEventListener("click",()=>{for(let[g,k]of this.selectedSuggestions)this.matchesSearch(g)&&(k.selected=!1);this.refreshSuggestionList()}),this.suggestionsListEl=e.createDiv({cls:"akl-suggestions-list"}),this.refreshSuggestionList();let h=e.createDiv({cls:"akl-action-row"});h.createEl("button",{text:"Add Selected Keywords",cls:"mod-cta"}).addEventListener("click",()=>this.addSelectedKeywords()),h.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close())}matchesSearch(e){return this.searchQuery?e.toLowerCase().includes(this.searchQuery.toLowerCase()):!0}sortSuggestions(e){let t=[...e];switch(this.sortOrder){case"frequency-desc":t.sort((o,s)=>s.totalNotes-o.totalNotes);break;case"frequency-asc":t.sort((o,s)=>o.totalNotes-s.totalNotes);break;case"alpha-asc":t.sort((o,s)=>o.keyword.localeCompare(s.keyword));break;case"alpha-desc":t.sort((o,s)=>s.keyword.localeCompare(o.keyword));break;case"length-asc":t.sort((o,s)=>o.keyword.length-s.keyword.length);break;case"length-desc":t.sort((o,s)=>s.keyword.length-o.keyword.length);break;default:t.sort((o,s)=>s.totalNotes-o.totalNotes)}return t}refreshSuggestionList(){if(!this.suggestionsListEl)return;this.suggestionsListEl.empty();let e=this.suggestions.filter(t=>this.matchesSearch(t.keyword));if(e.length===0){this.suggestionsListEl.createEl("p",{text:"No suggestions match your search.",cls:"akl-no-results"});return}e=this.sortSuggestions(e);for(let t of e){let o=this.selectedSuggestions.get(t.keyword),s=this.suggestionsListEl.createDiv({cls:"akl-suggestion-item"}),i=s.createDiv({cls:"akl-suggestion-header"}),n=i.createEl("input",{type:"checkbox",cls:"akl-checkbox"});n.checked=o.selected,n.addEventListener("change",d=>{o.selected=d.target.checked});let r=i.createDiv({cls:"akl-suggestion-label"});if(r.createSpan({text:t.keyword,cls:"akl-keyword-text"}),r.createSpan({text:` (${t.totalNotes} notes)`,cls:"akl-count-text"}),t.notes.length>0){let d=s.createDiv({cls:"akl-notes-preview"});d.createEl("span",{text:"In: ",cls:"akl-notes-label"}),d.createEl("span",{text:t.notes.join(", ")+(t.totalNotes>5?"...":""),cls:"akl-notes-list"})}let l=s.createDiv({cls:"akl-variation-selector"});l.createEl("span",{text:"Or add as variation to: ",cls:"akl-variation-label"});let c=l.createEl("select",{cls:"akl-variation-dropdown"}),u=c.createEl("option",{value:"",text:"(None - add as new keyword)"});for(let d of this.plugin.settings.keywords)d.keyword.toLowerCase()!==t.keyword.toLowerCase()&&c.createEl("option",{value:d.keyword,text:d.keyword});c.value=o.addAsVariationTo||"",c.addEventListener("change",d=>{o.addAsVariationTo=d.target.value||null,d.target.value&&(n.checked=!0,o.selected=!0)})}}async addSelectedKeywords(){let e=0,t=0;for(let[s,i]of this.selectedSuggestions)if(i.selected)if(i.addAsVariationTo){let n=this.plugin.settings.keywords.find(r=>r.keyword===i.addAsVariationTo);n&&(n.variations||(n.variations=[]),n.variations.includes(s)||(n.variations.push(s),t++))}else this.plugin.settings.keywords.push({keyword:s,target:s,variations:[],enableTags:!1,linkScope:"vault-wide",scopeFolder:""}),e++;await this.plugin.saveSettings();let o="";e>0&&t>0?o=`Added ${e} new keyword(s) and ${t} variation(s)`:e>0?o=`Added ${e} new keyword(s)`:t>0?o=`Added ${t} variation(s)`:o="No keywords selected",new Ps(o),this.close()}onClose(){let{contentEl:e}=this;e.empty()}};ut.exports=ye});var ht=D((Ka,pt)=>{var{Modal:Ws,Notice:ve}=require("obsidian"),be=class extends Ws{constructor(e,t){super(e),this.plugin=t}onOpen(){let{contentEl:e}=this;e.createEl("h2",{text:"Import Keywords from JSON"}),e.createEl("p",{text:"Select a JSON file from your vault to import keywords. This will ADD to your existing keywords."});let t=this.app.vault.getFiles().filter(r=>r.extension==="json");if(t.length===0){e.createEl("p",{text:"No JSON files found in vault. Please create an export first.",cls:"mod-warning"}),e.createEl("button",{text:"Close"}).addEventListener("click",()=>this.close());return}let o=e.createEl("select");o.style.width="100%",o.style.marginBottom="10px";for(let r of t){let l=o.createEl("option",{text:r.path,value:r.path})}let s=e.createDiv();s.style.display="flex",s.style.gap="10px",s.style.marginTop="20px",s.createEl("button",{text:"Import",cls:"mod-cta"}).addEventListener("click",async()=>{let r=o.value,l=this.app.vault.getAbstractFileByPath(r);if(l)try{let c=await this.app.vault.read(l),u=JSON.parse(c);if(!Array.isArray(u)){new ve("Invalid JSON format: expected an array of keywords");return}let d=0,h=0;for(let p of u){p.enableTags===void 0&&(p.enableTags=!1);let g=this.plugin.settings.keywords.findIndex(k=>k.keyword.toLowerCase()===p.keyword.toLowerCase());if(g!==-1){let k=this.plugin.settings.keywords[g];k.variations||(k.variations=[]),p.variations||(p.variations=[]);let w=k.variations.map(T=>T.toLowerCase()),L=p.variations.filter(T=>!w.includes(T.toLowerCase()));L.length>0&&(k.variations.push(...L),h++)}else this.plugin.settings.keywords.push(p),d++}await this.plugin.saveSettings();let f="";d>0&&h>0?f=`Imported: ${d} new keyword(s), merged variations into ${h} existing keyword(s)`:d>0?f=`Imported ${d} new keyword(s)`:h>0?f=`Merged variations into ${h} existing keyword(s)`:f="No new keywords or variations to import",new ve(f),this.close(),this.app.setting.close(),this.app.setting.open(),this.app.setting.openTabById(this.plugin.manifest.id)}catch(c){new ve(`Import failed: ${c.message}`)}}),s.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close())}onClose(){let{contentEl:e}=this;e.empty()}};pt.exports=be});var mt=D((Va,kt)=>{var{Modal:Gs,Notice:ie}=require("obsidian"),{parseCSVLine:ft}=(W(),P(U)),xe=class extends Gs{constructor(e,t){super(e),this.plugin=t}onOpen(){let{contentEl:e}=this;e.createEl("h2",{text:"Import Keywords from CSV"}),e.createEl("p",{text:"Select a CSV file from your vault to import keywords. This will ADD to your existing keywords."});let t=this.app.vault.getFiles().filter(r=>r.extension==="csv");if(t.length===0){e.createEl("p",{text:"No CSV files found in vault. Download a template first or export existing keywords.",cls:"mod-warning"}),e.createEl("button",{text:"Close"}).addEventListener("click",()=>this.close());return}let o=e.createEl("select");o.style.width="100%",o.style.marginBottom="10px";for(let r of t){let l=o.createEl("option",{text:r.path,value:r.path})}let s=e.createDiv();s.style.display="flex",s.style.gap="10px",s.style.marginTop="20px",s.createEl("button",{text:"Import",cls:"mod-cta"}).addEventListener("click",async()=>{let r=o.value,l=this.app.vault.getAbstractFileByPath(r);if(l)try{let u=(await this.app.vault.read(l)).split(`
`).filter(L=>L.trim());if(u.length===0){new ie("CSV file is empty");return}let d=ft(u[0]),h={};if(d.forEach((L,T)=>{h[L.toLowerCase()]=T}),h.keyword===void 0||h.target===void 0){new ie('CSV must have "keyword" and "target" columns');return}let f=0,p=0,g=0,k=[];for(let L=1;L<u.length;L++){let T=L+1;try{let m=ft(u[L]);if(m.length===0||!m[h.keyword])continue;let v=m[h.keyword]||"",S=m[h.target]||"";if(!v.trim()||!S.trim()){k.push(`Line ${T}: Missing keyword or target`),g++;continue}let E=m[h.variations]||"",F=E?E.split("|").map(I=>I.trim()).filter(I=>I):[],z=I=>{if(typeof I=="boolean")return I;let B=String(I).toLowerCase().trim();return B==="true"||B==="yes"||B==="1"},V={keyword:v.trim(),target:S.trim(),variations:F,enableTags:z(m[h.enabletags]||!1),linkScope:m[h.linkscope]||"vault-wide",scopeFolder:m[h.scopefolder]||"",useRelativeLinks:z(m[h.userelativelinks]||!1),blockRef:m[h.blockref]||"",requireTag:m[h.requiretag]||"",onlyInNotesLinkingTo:z(m[h.onlyinnoteslinkingto]||!1),suggestMode:z(m[h.suggestmode]||!1),preventSelfLink:z(m[h.preventselflink]||!1)},C=this.plugin.settings.keywords.findIndex(I=>I.keyword.toLowerCase()===V.keyword.toLowerCase());if(C!==-1){let I=this.plugin.settings.keywords[C],B=new Set(I.variations.map(K=>K.toLowerCase())),M=!1;for(let K of V.variations)B.has(K.toLowerCase())||(I.variations.push(K),M=!0);M&&p++}else this.plugin.settings.keywords.push(V),f++}catch(m){k.push(`Line ${T}: ${m.message}`),g++}}await this.plugin.saveSettings();let w="";f>0&&p>0?w=`Imported: ${f} new keyword(s), merged variations into ${p} existing keyword(s)`:f>0?w=`Imported ${f} new keyword(s)`:p>0?w=`Merged variations into ${p} existing keyword(s)`:w="No new keywords or variations to import",g>0&&(w+=`
${g} error(s) encountered`,console.error("CSV Import Errors:",k)),new ie(w),this.close(),this.app.setting.close(),this.app.setting.open(),this.app.setting.openTabById(this.plugin.manifest.id)}catch(c){new ie(`Import failed: ${c.message}`),console.error("CSV Import Error:",c)}}),s.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close())}onClose(){let{contentEl:e}=this;e.empty()}};kt.exports=xe});var yt=D((Ma,wt)=>{var{Modal:js}=require("obsidian"),Se=class extends js{constructor(e,t,o){super(e),this.results=t,this.fileName=o}onOpen(){let{contentEl:e}=this;e.createEl("h2",{text:`Preview: ${this.fileName}`}),e.createEl("p",{text:`Found ${this.results.linkCount} keyword(s) to link:`});let t=e.createEl("ul");for(let i of this.results.changes){let n=t.createEl("li");n.createEl("strong",{text:i.keyword}),n.appendText(" \u2192 "),n.createEl("code",{text:`[[${i.target}]]`}),n.createEl("br"),n.createEl("small",{text:i.context,cls:"preview-context"})}let o=e.createDiv({cls:"modal-button-container"});o.style.marginTop="20px",o.style.display="flex",o.style.gap="10px",o.createEl("button",{text:"Close"}).addEventListener("click",()=>this.close())}onClose(){let{contentEl:e}=this;e.empty()}};wt.exports=Se});var xt=D((Ra,bt)=>{var{Modal:Hs,Notice:vt,MarkdownView:Us}=require("obsidian"),Ce=class extends Hs{constructor(e,t,o){super(e),this.editor=t,this.suggestions=o,this.selectedSuggestions=new Set(o.map((s,i)=>i))}onOpen(){let{contentEl:e}=this;e.empty(),e.addClass("akl-suggestion-review-modal"),e.createEl("h2",{text:"Review Link Suggestions"});let t=e.createEl("p",{text:`Found ${this.suggestions.length} link suggestion${this.suggestions.length>1?"s":""} in this note. Select which ones to accept:`});t.style.marginBottom="1em",t.style.color="var(--text-muted)";let o=e.createDiv({cls:"akl-button-container"});o.style.marginBottom="1em",o.style.display="flex",o.style.gap="0.5em",o.createEl("button",{text:"Select All"}).addEventListener("click",()=>{this.suggestions.forEach((d,h)=>{this.selectedSuggestions.add(h);let f=e.querySelector(`input[data-index="${h}"]`);f&&(f.checked=!0)})}),o.createEl("button",{text:"Deselect All"}).addEventListener("click",()=>{this.selectedSuggestions.clear(),e.querySelectorAll('input[type="checkbox"]').forEach(d=>d.checked=!1)});let n=e.createDiv({cls:"akl-suggestions-list"});n.style.maxHeight="400px",n.style.overflowY="auto",n.style.marginBottom="1em",n.style.border="1px solid var(--background-modifier-border)",n.style.borderRadius="6px",n.style.padding="0.5em",this.suggestions.forEach((d,h)=>{let f=n.createDiv({cls:"akl-suggestion-item"});f.style.padding="0.75em",f.style.marginBottom="0.5em",f.style.background="var(--background-secondary)",f.style.borderRadius="6px",f.style.display="flex",f.style.alignItems="center",f.style.gap="0.75em";let p=f.createEl("input",{type:"checkbox"});p.checked=!0,p.setAttribute("data-index",h.toString()),p.addEventListener("change",m=>{m.target.checked?this.selectedSuggestions.add(h):this.selectedSuggestions.delete(h)});let g=f.createDiv({cls:"akl-suggestion-content"});g.style.flex="1";let k=g.createDiv();k.style.marginBottom="0.25em",k.createSpan({text:d.matchText,cls:"akl-keyword-highlight"}),k.createSpan({text:" \u2192 ",cls:"akl-arrow"}),k.createSpan({text:d.targetNote,cls:"akl-target-highlight"});let w=g.createDiv();w.style.fontSize="0.9em",w.style.color="var(--text-muted)",w.createSpan({text:`Line ${d.lineNumber+1}`}),k.querySelectorAll(".akl-keyword-highlight").forEach(m=>{m.style.background="rgba(255, 170, 0, 0.25)",m.style.padding="2px 4px",m.style.borderRadius="3px",m.style.fontWeight="500"}),k.querySelectorAll(".akl-target-highlight").forEach(m=>{m.style.color="var(--text-accent)",m.style.fontWeight="500"})});let r=e.createDiv({cls:"akl-action-buttons"});r.style.display="flex",r.style.gap="0.5em",r.style.justifyContent="flex-end",r.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close());let c=r.createEl("button",{text:`Accept Selected (${this.selectedSuggestions.size})`,cls:"mod-cta"});c.addEventListener("click",()=>{this.acceptSelected()});let u=()=>{c.textContent=`Accept Selected (${this.selectedSuggestions.size})`};e.querySelectorAll('input[type="checkbox"]').forEach(d=>{d.addEventListener("change",u)})}acceptSelected(){if(this.selectedSuggestions.size===0){new vt("No suggestions selected");return}let e=Array.from(this.selectedSuggestions).sort((o,s)=>this.suggestions[s].lineNumber-this.suggestions[o].lineNumber),t=0;e.forEach(o=>{let s=this.suggestions[o],i=this.editor.getLine(s.lineNumber);if(!i.includes(s.fullMatch))return;let n=this.editor.getValue(),r=this.editor.posToOffset({line:s.lineNumber,ch:0}),l=this.app.plugins.plugins["auto-keyword-linker"],c=l?l.isInsideTable(n,r):!1,u,d=s.blockRef?`${s.targetNote}#${s.blockRef}`:s.targetNote;if(s.useRelative){let f=c?s.matchText.replace(/\|/g,"\\|"):s.matchText,p=encodeURIComponent(s.targetNote)+".md",g=s.blockRef?`#${s.blockRef}`:"";u=`[${f}](${p}${g})`}else c?u=s.targetNote===s.matchText&&!s.blockRef?`[[${s.matchText}]]`:`[[${d}\\|${s.matchText}]]`:u=s.targetNote===s.matchText&&!s.blockRef?`[[${s.matchText}]]`:`[[${d}|${s.matchText}]]`;let h=i.replace(s.fullMatch,u);this.editor.setLine(s.lineNumber,h),t++}),new vt(`Accepted ${t} link suggestion${t>1?"s":""}`),this.close(),setTimeout(()=>{let o=this.app.workspace.getActiveViewOfType(Us);if(o&&o.editor){let s=this.app.plugins.plugins["auto-keyword-linker"];s&&s.updateStatusBar&&s.updateStatusBar()}},100)}onClose(){let{contentEl:e}=this;e.empty()}};bt.exports=Ce});var Ct=D((qa,St)=>{var{Modal:Zs,Notice:Le}=require("obsidian"),Te=class extends Zs{constructor(e,t,o){super(e),this.results=t,this.plugin=o,this.selectedLinks=new Map,this.results.forEach((s,i)=>{let n=new Set(s.changes.map((r,l)=>l));this.selectedLinks.set(i,n)})}onOpen(){let{contentEl:e}=this;e.createEl("h2",{text:"Preview: Select Links to Create"});let t=this.results.reduce((p,g)=>p+g.linkCount,0),o=this.getSelectedLinksCount(),s=`Found ${t} link(s) in ${this.results.length} note(s). ${o} link(s) selected.`,i=e.createEl("p",{text:s,cls:"bulk-preview-stats"}),n=e.createDiv({cls:"bulk-preview-select-buttons"});n.style.marginBottom="15px",n.style.display="flex",n.style.gap="10px",n.createEl("button",{text:"Select All Links"}).addEventListener("click",()=>{this.results.forEach((p,g)=>{let k=new Set(p.changes.map((w,L)=>L));this.selectedLinks.set(g,k)}),e.querySelectorAll('input[type="checkbox"]').forEach(p=>p.checked=!0),this.updateStats(i)}),n.createEl("button",{text:"Deselect All Links"}).addEventListener("click",()=>{this.selectedLinks.clear(),e.querySelectorAll('input[type="checkbox"]').forEach(p=>p.checked=!1),this.updateStats(i)});let c=e.createDiv({cls:"preview-scroll"});c.style.maxHeight="400px",c.style.overflowY="auto",c.style.marginBottom="20px",c.style.border="1px solid var(--background-modifier-border)",c.style.borderRadius="6px",c.style.padding="10px",this.results.forEach((p,g)=>{let k=c.createDiv({cls:"preview-note"});k.style.marginBottom="15px",k.style.padding="10px",k.style.background="var(--background-secondary)",k.style.borderRadius="6px";let w=k.createDiv();w.style.display="flex",w.style.alignItems="center",w.style.gap="10px",w.style.marginBottom="10px";let L=w.createEl("input",{type:"checkbox"});L.checked=!0,L.setAttribute("data-note-index",g.toString()),L.addEventListener("change",v=>{let S=v.target.checked,E=this.selectedLinks.get(g)||new Set;S?(p.changes.forEach((F,z)=>E.add(z)),this.selectedLinks.set(g,E),e.querySelectorAll(`input[data-note="${g}"]`).forEach(F=>F.checked=!0)):(this.selectedLinks.delete(g),e.querySelectorAll(`input[data-note="${g}"]`).forEach(F=>F.checked=!1)),this.updateStats(i)});let T=w.createDiv();T.style.flex="1",T.createEl("strong",{text:p.fileName}),T.createEl("span",{text:` (${p.linkCount} link${p.linkCount!==1?"s":""})`,cls:"bulk-preview-link-count"});let m=k.createDiv();m.style.marginLeft="30px",p.changes.forEach((v,S)=>{let E=m.createDiv();E.style.display="flex",E.style.alignItems="flex-start",E.style.gap="8px",E.style.marginBottom="8px",E.style.padding="4px",E.style.borderRadius="4px",E.style.transition="background 0.2s",E.addEventListener("mouseenter",()=>{E.style.background="var(--background-modifier-hover)"}),E.addEventListener("mouseleave",()=>{E.style.background="transparent"});let F=E.createEl("input",{type:"checkbox"});F.checked=!0,F.setAttribute("data-note",g.toString()),F.setAttribute("data-link",S.toString()),F.style.marginTop="2px",F.addEventListener("change",C=>{let I=this.selectedLinks.get(g)||new Set;C.target.checked?I.add(S):I.delete(S),I.size===0?this.selectedLinks.delete(g):this.selectedLinks.set(g,I);let B=p.changes.every((M,K)=>{let G=this.selectedLinks.get(g);return G&&G.has(K)});L.checked=B,this.updateStats(i)});let z=E.createDiv();z.style.flex="1",z.style.fontSize="0.9em";let V=z.createDiv();if(V.createEl("strong",{text:v.keyword}),V.appendText(" \u2192 "),V.createEl("code",{text:`[[${v.target}]]`}),v.lineNumber!==void 0){let C=z.createDiv();C.style.fontSize="0.85em",C.style.color="var(--text-muted)",C.style.marginTop="2px",C.textContent=`Line ${v.lineNumber+1}`}})});let u=e.createDiv({cls:"modal-button-container"});u.style.display="flex",u.style.gap="10px",u.style.justifyContent="flex-end",u.style.marginTop="20px",u.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close());let h=this.getSelectedLinksCount(),f=u.createEl("button",{text:`Apply Selected Links (${h})`,cls:"mod-cta"});f.addEventListener("click",async()=>{await this.applySelected()}),this.applyBtn=f}updateStats(e){let t=this.results.reduce((s,i)=>s+i.linkCount,0),o=this.getSelectedLinksCount();e.textContent=`Found ${t} link(s) in ${this.results.length} note(s). ${o} link(s) selected.`,this.applyBtn&&(this.applyBtn.textContent=`Apply Selected Links (${o})`)}getSelectedLinksCount(){let e=0;for(let t of this.selectedLinks.values())e+=t.size;return e}async applySelected(){if(this.selectedLinks.size===0){new Le("No links selected");return}this.close();let e=this.getSelectedLinksCount();new Le(`Creating ${e} link(s)...`);let t=0,o=0;for(let[s,i]of this.selectedLinks){if(i.size===0)continue;let n=this.results[s];if(!n||!n.file)continue;let r=n.file,l=n.changes.filter((d,h)=>i.has(h)),c=new Set(l.map(d=>d.keyword.toLowerCase())),u=this.plugin.buildKeywordMap.bind(this.plugin);this.plugin.buildKeywordMap=()=>{let d=u(),h={};for(let[f,p]of Object.entries(d))c.has(f.toLowerCase())&&(h[f]=p);return h};try{let d=await this.plugin.linkKeywordsInFile(r,!1);d&&d.changed&&(t+=d.linkCount,o++)}finally{this.plugin.buildKeywordMap=u}}this.plugin.settings.statistics.totalLinksCreated+=t,this.plugin.settings.statistics.totalNotesProcessed+=o,this.plugin.settings.statistics.lastRunDate=new Date().toISOString(),await this.plugin.saveSettings(),new Le(`\u2713 Processed ${o} note(s), created ${t} link(s)`)}onClose(){let{contentEl:e}=this;e.empty()}};St.exports=Te});var Ae=D((Oa,Lt)=>{var{FuzzySuggestModal:_s,Notice:Js}=require("obsidian"),Ee=class extends _s{constructor(e,t,o,s){super(e),this.plugin=t,this.groupId=o,this.currentKeywordIds=new Set(s.map(i=>i.id))}getItems(){return this.plugin.settings.keywords.filter(e=>!this.currentKeywordIds.has(e.id))}getItemText(e){let t=e.groupId?" [In another group]":"";return`${e.keyword||"Untitled"} \u2192 ${e.target||"(no target)"}${t}`}async onChooseItem(e){e.groupId=this.groupId,e.enableTags=null,e.linkScope=null,e.scopeFolder=null,e.useRelativeLinks=null,e.blockRef=null,e.requireTag=null,e.onlyInNotesLinkingTo=null,e.suggestMode=null,e.preventSelfLink=null,await this.plugin.saveSettings(),new Js(`Keyword "${e.keyword}" assigned to group. Group settings will apply to new links.`);let t=this.app.setting.activeTab,o=$e();t instanceof o&&t.display()}};Lt.exports=Ee});var Ne=D((Pa,Tt)=>{var{FuzzySuggestModal:Qs}=require("obsidian"),Ie=class extends Qs{constructor(e,t,o,s){super(e),this.folders=t,this.currentValue=o,this.onChooseCallback=s}getItems(){return this.folders}getItemText(e){return e||"/ (Root)"}onChooseItem(e,t){this.onChooseCallback(e)}};Tt.exports=Ie});var Fe=D((Wa,Et)=>{var{FuzzySuggestModal:Ys}=require("obsidian"),De=class extends Ys{constructor(e,t,o,s){super(e),this.notes=t,this.currentValue=o,this.onChooseCallback=s}getItems(){return this.notes}getItemText(e){return e}onChooseItem(e,t){this.onChooseCallback(e)}};Et.exports=De});var $e=D((Ga,It)=>{var{PluginSettingTab:Xs,Setting:N,Notice:ze}=require("obsidian"),eo=Ae(),At=Ne(),to=Fe(),{generateId:$t}=(W(),P(U)),Be=class extends Xs{constructor(e,t){super(e,t),this.plugin=t,this.searchFilter="",this.currentTab="keywords"}display(){let{containerEl:e}=this;e.empty(),this.addCustomStyles(),e.createDiv({cls:"akl-header"}).createEl("h2",{text:"Auto Keyword Linker Settings"});let o=e.createDiv({cls:"akl-tab-nav"});[{id:"keywords",label:"Keywords",icon:"\u{1F524}"},{id:"groups",label:"Groups",icon:"\u{1F4C1}"},{id:"general",label:"General",icon:"\u2699\uFE0F"},{id:"import-export",label:"Import/Export",icon:"\u{1F4E6}"}].forEach(n=>{o.createEl("button",{text:`${n.icon} ${n.label}`,cls:`akl-tab-button ${this.currentTab===n.id?"akl-tab-active":""}`}).addEventListener("click",()=>{this.currentTab=n.id,this.display()})});let i=e.createDiv({cls:"akl-tab-content"});switch(this.currentTab){case"keywords":this.displayKeywordsTab(i);break;case"groups":this.displayGroupsTab(i);break;case"general":this.displayGeneralTab(i);break;case"import-export":this.displayImportExportTab(i);break}}displayKeywordsTab(e){e.createDiv({cls:"akl-stats-bar"}).createEl("span",{text:`${this.plugin.settings.keywords.length} keyword${this.plugin.settings.keywords.length!==1?"s":""} configured`});let o=e.createDiv({cls:"akl-section-header"});o.createEl("h3",{text:"Keywords & Variations"}),o.createEl("p",{text:"Define keywords and their variations. All variations will link to the target note.",cls:"akl-section-desc"}),e.createDiv({cls:"akl-search-container"}).createEl("input",{type:"text",placeholder:"Search keywords...",cls:"akl-search-input",value:this.searchFilter}).addEventListener("input",c=>{this.searchFilter=c.target.value,this.renderKeywords(n)});let n=e.createDiv({cls:"akl-keywords-container"});this.renderKeywords(n),e.createDiv({cls:"akl-add-button-container"}).createEl("button",{text:"+ Add Keyword",cls:"mod-cta akl-add-button"}).addEventListener("click",()=>{this.plugin.settings.keywords.push({id:$t("kw"),keyword:"",target:"",variations:[],enableTags:null,linkScope:"vault-wide",scopeFolder:"",useRelativeLinks:null,blockRef:"",requireTag:"",onlyInNotesLinkingTo:null,suggestMode:null,preventSelfLink:null,collapsed:!1,groupId:null}),this.display()})}updateCardHeader(e,t,o){e.empty();let s=t||"New Keyword",i=o?` \u2192 ${o}`:"";e.createSpan({text:s,cls:"akl-keyword-name"}),i&&e.createSpan({text:i,cls:"akl-target-name"})}displayGroupsTab(e){let t=e.createDiv({cls:"akl-stats-bar"}),o=this.plugin.settings.keywordGroups.reduce((l,c)=>l+this.plugin.settings.keywords.filter(u=>u.groupId===c.id).length,0);t.createEl("span",{text:`${this.plugin.settings.keywordGroups.length} group${this.plugin.settings.keywordGroups.length!==1?"s":""} \u2022 ${o} keyword${o!==1?"s":""} in groups`});let s=e.createDiv({cls:"akl-section-header"});s.createEl("h3",{text:"Keyword Groups"}),s.createEl("p",{text:"Organize keywords into groups with shared settings. Keywords inherit settings from their group.",cls:"akl-section-desc"});let i=e.createDiv({cls:"akl-groups-container"});this.renderGroups(i),e.createDiv({cls:"akl-add-button-container"}).createEl("button",{text:"+ Create Group",cls:"mod-cta akl-add-button"}).addEventListener("click",()=>{this.plugin.settings.keywordGroups.push({id:$t("grp"),name:"New Group",collapsed:!1,settings:{enableTags:!1,linkScope:"vault-wide",scopeFolder:"",useRelativeLinks:!1,blockRef:"",requireTag:"",onlyInNotesLinkingTo:!1,suggestMode:!1,preventSelfLink:!1}}),this.display()})}displayGeneralTab(e){let t=e.createDiv({cls:"akl-section-header"});t.createEl("h3",{text:"Linking Behavior"}),t.createEl("p",{text:"Configure how keywords are linked in your notes.",cls:"akl-section-desc"}),new N(e).setName("First occurrence only").setDesc("Link only the first mention of each keyword per note").addToggle(r=>r.setValue(this.plugin.settings.firstOccurrenceOnly).onChange(async l=>{this.plugin.settings.firstOccurrenceOnly=l,await this.plugin.saveSettings()})),new N(e).setName("Case sensitive").setDesc("Match keywords with exact case").addToggle(r=>r.setValue(this.plugin.settings.caseSensitive).onChange(async l=>{this.plugin.settings.caseSensitive=l,await this.plugin.saveSettings()})),new N(e).setName("Prevent self-links (global)").setDesc("Prevent keywords from linking on their own target note (applies to all keywords unless overridden per-keyword)").addToggle(r=>r.setValue(this.plugin.settings.preventSelfLinkGlobal).onChange(async l=>{this.plugin.settings.preventSelfLinkGlobal=l,await this.plugin.saveSettings()})),new N(e).setName("Auto-link on save").setDesc("Automatically link keywords when you save a note (requires reload)").addToggle(r=>r.setValue(this.plugin.settings.autoLinkOnSave).onChange(async l=>{this.plugin.settings.autoLinkOnSave=l,await this.plugin.saveSettings(),new ze("Please reload the plugin for this change to take effect")}));let o=e.createDiv({cls:"akl-section-header"});o.createEl("h3",{text:"Note Creation"}),o.createEl("p",{text:"Configure how new notes are created when target notes don't exist.",cls:"akl-section-desc"}),new N(e).setName("Auto-create notes").setDesc("Automatically create target notes if they don't exist").addToggle(r=>r.setValue(this.plugin.settings.autoCreateNotes).onChange(async l=>{this.plugin.settings.autoCreateNotes=l,await this.plugin.saveSettings()}));let i=["",...this.getAllFolders()];new N(e).setName("New note folder").setDesc("Click to search and select folder where new notes will be created").addText(r=>{let l=this.plugin.settings.newNoteFolder||"/ (Root)";r.setValue(l).setPlaceholder("Click to select folder..."),r.inputEl.readOnly=!0,r.inputEl.style.cursor="pointer",r.inputEl.addEventListener("click",()=>{new At(this.app,i,this.plugin.settings.newNoteFolder||"",async u=>{this.plugin.settings.newNoteFolder=u,await this.plugin.saveSettings();let d=u||"/ (Root)";r.setValue(d)}).open()})}),new N(e).setName("New note template").setDesc("Template for auto-created notes. Use {{keyword}} and {{date}} as placeholders.").addTextArea(r=>r.setPlaceholder(`# {{keyword}}

Created: {{date}}`).setValue(this.plugin.settings.newNoteTemplate).onChange(async l=>{this.plugin.settings.newNoteTemplate=l,await this.plugin.saveSettings()}));let n=e.createDiv({cls:"akl-section-header"});n.createEl("h3",{text:"Keyword Suggestion Settings"}),n.createEl("p",{text:"Configure how the keyword suggestion feature works.",cls:"akl-section-desc"}),new N(e).setName("Custom stop words").setDesc("Additional words to exclude from keyword suggestions (comma-separated). These are added to the default stop word list.").addTextArea(r=>{r.setPlaceholder("example, test, demo, sample").setValue((this.plugin.settings.customStopWords||[]).join(", ")).onChange(async l=>{let c=l.split(",").map(u=>u.trim()).filter(u=>u.length>0);this.plugin.settings.customStopWords=c,await this.plugin.saveSettings()}),r.inputEl.rows=4,r.inputEl.cols=50}),new N(e).setName("Reset custom stop words").setDesc("Clear all custom stop words").addButton(r=>r.setButtonText("Reset").onClick(async()=>{this.plugin.settings.customStopWords=[],await this.plugin.saveSettings(),new ze("Custom stop words cleared"),this.display()}))}displayImportExportTab(e){let t=e.createDiv({cls:"akl-section-header"});t.createEl("h3",{text:"Import & Export Keywords"}),t.createEl("p",{text:"Export your keywords to CSV or import keywords from a CSV file.",cls:"akl-section-desc"}),new N(e).setName("Export keywords to CSV").setDesc("Export all keywords and their settings to a CSV file").addButton(s=>s.setButtonText("Export to CSV").setCta().onClick(()=>this.plugin.exportKeywordsToCSV())),new N(e).setName("Import keywords from CSV").setDesc("Import keywords from a CSV file (opens file picker)").addButton(s=>s.setButtonText("Import from CSV").onClick(()=>this.plugin.importKeywordsFromCSV()));let o=e.createDiv({cls:"akl-section-header"});o.createEl("h3",{text:"Statistics"}),o.createEl("p",{text:"View usage statistics for the plugin.",cls:"akl-section-desc"}),new N(e).setName("View statistics").setDesc("See how many links have been created and which notes have been processed").addButton(s=>s.setButtonText("View Statistics").onClick(()=>this.plugin.showStatistics()))}renderKeywords(e){var s;e.empty();let t=this.searchFilter.toLowerCase(),o=0;for(let i=0;i<this.plugin.settings.keywords.length;i++){let n=this.plugin.settings.keywords[i];if(t){let b=n.keyword&&n.keyword.toLowerCase().includes(t),x=n.target&&n.target.toLowerCase().includes(t),y=n.variations&&n.variations.some(q=>q.toLowerCase().includes(t));if(!b&&!x&&!y)continue}o++,n.collapsed===void 0&&(n.collapsed=!1);let r=e.createDiv({cls:"akl-keyword-card"}),l=r.createDiv({cls:"akl-card-header"}),c=l.createDiv({cls:"akl-collapse-btn"});c.innerHTML=n.collapsed?"\u25B6":"\u25BC",c.setAttribute("aria-label",n.collapsed?"Expand":"Collapse"),c.addEventListener("click",async()=>{n.collapsed=!n.collapsed,await this.plugin.saveSettings(),this.display()});let u=l.createDiv({cls:"akl-card-title"}),d=n.keyword||"New Keyword",h=n.target?` \u2192 ${n.target}`:"";u.createSpan({text:d,cls:"akl-keyword-name"}),h&&u.createSpan({text:h,cls:"akl-target-name"});let f=l.createDiv({cls:"akl-card-badges"});if(n.groupId){let b=this.plugin.settings.keywordGroups.find(x=>x.id===n.groupId);b&&f.createSpan({text:`\u{1F4C1} ${b.name}`,cls:"akl-badge akl-badge-group"})}let p=this.plugin.getEffectiveKeywordSettings(n);p.enableTags&&f.createSpan({text:"Tags",cls:"akl-badge akl-badge-tags"}),p.useRelativeLinks&&f.createSpan({text:"MD Links",cls:"akl-badge akl-badge-md-links"}),p.suggestMode&&f.createSpan({text:"Suggest",cls:"akl-badge akl-badge-suggest"});let g=this.plugin.getAliasesForNote(n.target),k=n.variations&&n.variations.length||0,w=g&&g.length||0,L=k+w;L>0&&f.createSpan({text:`${L} var`,cls:"akl-badge akl-badge-variations"});let T=r.createDiv({cls:"akl-card-body"});n.collapsed&&(T.style.display="none");let m=!!n.groupId,v=m?(s=this.plugin.settings.keywordGroups.find(b=>b.id===n.groupId))==null?void 0:s.name:null;new N(T).setName("Keyword").setDesc("The text to search for in your notes").addText(b=>{b.setValue(n.keyword).setPlaceholder("Enter keyword...").onChange(async x=>{this.plugin.settings.keywords[i].keyword=x,await this.plugin.saveSettings(),this.updateCardHeader(u,x,this.plugin.settings.keywords[i].target)}),b.inputEl.addClass("akl-input"),b.inputEl.addEventListener("blur",async()=>{!this.plugin.settings.keywords[i].target&&this.plugin.settings.keywords[i].keyword&&(this.plugin.settings.keywords[i].target=this.plugin.settings.keywords[i].keyword,await this.plugin.saveSettings(),this.display())})}),new N(T).setName("Target note").setDesc("Click to search and select the note to create links to").addText(b=>{let x=this.app.vault.getMarkdownFiles(),y=new Set;for(let A of x)if(y.add(A.basename),A.path.includes("/")){let R=A.path.endsWith(".md")?A.path.slice(0,-3):A.path;y.add(R)}let q=Array.from(y).sort((A,R)=>A.toLowerCase().localeCompare(R.toLowerCase())),$=n.target||"Click to select...";b.setValue($).setPlaceholder("Click to select note..."),b.inputEl.readOnly=!0,b.inputEl.style.cursor="pointer",b.inputEl.addEventListener("click",()=>{new to(this.app,q,n.target||"",async R=>{this.plugin.settings.keywords[i].target=R,await this.plugin.saveSettings(),b.setValue(R),this.updateCardHeader(u,this.plugin.settings.keywords[i].keyword,R)}).open()})}),new N(T).setName("Block reference").setDesc("Optional: Link to a specific block (e.g., ^block-id for abbreviation definitions)").addText(b=>{b.setValue(n.blockRef||"").setPlaceholder("^block-id").onChange(async x=>{let y=x;y=y.replace(/\[\[.*?\]\]/g,""),y&&!y.startsWith("^")&&(y="^"+y),y=y.replace(/\s/g,""),this.plugin.settings.keywords[i].blockRef=y,await this.plugin.saveSettings(),y!==x&&b.setValue(y)}),b.inputEl.setAttribute("autocomplete","off"),b.inputEl.setAttribute("data-no-suggest","true")}),new N(T).setName("Require tag").setDesc("Optional: Only link to target note if it has this tag (e.g., #reviewed or reviewed)").addText(b=>{b.setValue(n.requireTag||"").setPlaceholder("#tag or tag").onChange(async x=>{let y=x.trim();y.startsWith("#")&&(y=y.substring(1)),this.plugin.settings.keywords[i].requireTag=y,await this.plugin.saveSettings()}),b.inputEl.setAttribute("autocomplete","off")}),new N(T).setName("Only link in notes already linking to target").setDesc("Only create keyword links in notes that already have at least one link to the target note").addToggle(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.setValue(x.onlyInNotesLinkingTo||!1).onChange(async y=>{this.plugin.settings.keywords[i].onlyInNotesLinkingTo=y,await this.plugin.saveSettings()})});let S=T.createDiv({cls:"akl-variations-section"});S.createEl("div",{text:"Variations",cls:"setting-item-name"}),S.createEl("div",{text:"Alternative spellings that also link to the target note",cls:"setting-item-description"});let E=S.createDiv({cls:"akl-chips-container"}),F=n.variations&&n.variations.length>0,z=g&&g.length>0;!F&&!z?E.createSpan({text:"No variations added yet",cls:"akl-no-variations"}):(this.renderVariationChips(E,n.variations||[],i),z&&this.renderAliasChips(E,g));let C=S.createDiv({cls:"akl-add-variation"}).createEl("input",{type:"text",placeholder:"Type and press Enter to add...",cls:"akl-variation-input"});C.addEventListener("keydown",async b=>{if(b.key==="Enter"){b.preventDefault();let x=C.value.trim();if(!x)return;if(n.variations||(n.variations=[]),n.variations.some(A=>A.toLowerCase()===x.toLowerCase())){new ze("Variation already exists"),C.value="";return}C.value="",n.variations.push(x),await this.plugin.saveSettings(),E.empty();let q=n.variations&&n.variations.length>0,$=g&&g.length>0;!q&&!$?E.createSpan({text:"No variations added yet",cls:"akl-no-variations"}):(this.renderVariationChips(E,n.variations||[],i),$&&this.renderAliasChips(E,g)),C.focus()}});let I=new N(T).setName("Enable tags").setDesc(m?`Inherited from group "${v}"`:"Automatically add tags to source and target notes").addToggle(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.setValue(x.enableTags||!1).setDisabled(m).onChange(async y=>{m||(this.plugin.settings.keywords[i].enableTags=y,await this.plugin.saveSettings(),this.display())})});m&&I.settingEl.addClass("akl-disabled-setting");let B=new N(T).setName("Use relative markdown links").setDesc(m?`Inherited from group "${v}"`:"Create markdown links [text](note.md) instead of wikilinks [[note]]").addToggle(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.setValue(x.useRelativeLinks||!1).setDisabled(m).onChange(async y=>{m||(this.plugin.settings.keywords[i].useRelativeLinks=y,await this.plugin.saveSettings())})});m&&B.settingEl.addClass("akl-disabled-setting");let M=new N(T).setName("Suggest instead of auto-link").setDesc(m?`Inherited from group "${v}"`:"Highlight keywords as suggestions instead of automatically creating links. Right-click to accept.").addToggle(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.setValue(x.suggestMode||!1).setDisabled(m).onChange(async y=>{m||(this.plugin.settings.keywords[i].suggestMode=y,await this.plugin.saveSettings(),this.display())})});m&&M.settingEl.addClass("akl-disabled-setting"),new N(T).setName("Keyword Group").setDesc("Assign to a group to inherit group settings. Group settings will be locked and cannot be overridden per-keyword.").addDropdown(b=>{b.addOption("","(No group)"),this.plugin.settings.keywordGroups.forEach(x=>{b.addOption(x.id,x.name)}),b.setValue(n.groupId||"").onChange(async x=>{this.plugin.settings.keywords[i].groupId=x||null,await this.plugin.saveSettings(),this.display()})});let K=new N(T).setName("Prevent self-link").setDesc(m?`Inherited from group "${v}"`:"Prevent this keyword from linking on its own target note (overrides global setting)").addToggle(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.setValue(x.preventSelfLink||!1).setDisabled(m).onChange(async y=>{m||(this.plugin.settings.keywords[i].preventSelfLink=y,await this.plugin.saveSettings())})});m&&K.settingEl.addClass("akl-disabled-setting");let G=new N(T).setName("Link scope").setDesc(m?`Inherited from group "${v}"`:"Control where this keyword will be linked").addDropdown(b=>{let x=this.plugin.getEffectiveKeywordSettings(n);b.addOption("vault-wide","Vault-wide (everywhere)").addOption("same-folder","Same folder only").addOption("source-folder","Source in specific folder").addOption("target-folder","Target in specific folder").setValue(x.linkScope||"vault-wide").setDisabled(m).onChange(async y=>{m||(this.plugin.settings.keywords[i].linkScope=y,await this.plugin.saveSettings(),this.display())})});if(m&&G.settingEl.addClass("akl-disabled-setting"),n.linkScope==="source-folder"||n.linkScope==="target-folder"){let x=["",...this.getAllFolders()];new N(T).setName("Folder").setDesc("Click to search and select a folder").addText(y=>{let q=n.scopeFolder||"/ (Root)";y.setValue(q).setPlaceholder("Click to select folder..."),y.inputEl.readOnly=!0,y.inputEl.style.cursor="pointer",y.inputEl.addEventListener("click",()=>{new At(this.app,x,n.scopeFolder||"",async A=>{this.plugin.settings.keywords[i].scopeFolder=A,await this.plugin.saveSettings();let R=A||"/ (Root)";y.setValue(R)}).open()})})}T.createDiv({cls:"akl-card-footer"}).createEl("button",{text:"Delete Keyword",cls:"akl-delete-btn"}).addEventListener("click",async()=>{this.plugin.settings.keywords.splice(i,1),await this.plugin.saveSettings(),this.display()})}if(o===0&&t){let i=e.createDiv({cls:"akl-no-results"});i.createEl("p",{text:"No keywords found"}),i.createEl("p",{text:`No keywords match "${this.searchFilter}"`,cls:"akl-no-results-hint"})}}renderGroups(e){if(e.empty(),this.plugin.settings.keywordGroups.length===0){let t=e.createDiv({cls:"akl-empty-state"});t.createEl("p",{text:"No groups yet"}),t.createEl("p",{text:"Create a group to organize your keywords with shared settings",cls:"akl-empty-hint"});return}for(let t=0;t<this.plugin.settings.keywordGroups.length;t++){let o=this.plugin.settings.keywordGroups[t];o.collapsed===void 0&&(o.collapsed=!1);let s=this.plugin.settings.keywords.filter(p=>p.groupId===o.id),i=e.createDiv({cls:"akl-keyword-card akl-group-card"}),n=i.createDiv({cls:"akl-card-header"}),r=n.createDiv({cls:"akl-collapse-btn"});r.innerHTML=o.collapsed?"\u25B6":"\u25BC",r.setAttribute("aria-label",o.collapsed?"Expand":"Collapse"),r.addEventListener("click",async()=>{o.collapsed=!o.collapsed,await this.plugin.saveSettings(),this.display()});let l=n.createDiv({cls:"akl-card-title"});l.createSpan({text:o.name,cls:"akl-keyword-name"}),l.createSpan({text:` (${s.length} keywords)`,cls:"akl-target-name"}),n.createEl("button",{text:"\u{1F5D1}\uFE0F Delete",cls:"akl-delete-btn"}).addEventListener("click",async p=>{p.stopPropagation(),this.plugin.settings.keywords.forEach(g=>{g.groupId===o.id&&(g.groupId=null)}),this.plugin.settings.keywordGroups.splice(t,1),await this.plugin.saveSettings(),this.display()});let u=i.createDiv({cls:"akl-card-body"});o.collapsed&&(u.style.display="none"),new N(u).setName("Group name").setDesc("Name for this group of keywords").addText(p=>{p.setValue(o.name).setPlaceholder("Enter group name...").onChange(async g=>{this.plugin.settings.keywordGroups[t].name=g,await this.plugin.saveSettings(),l.empty(),l.createSpan({text:g,cls:"akl-keyword-name"}),l.createSpan({text:` (${s.length} keywords)`,cls:"akl-target-name"})}),p.inputEl.addClass("akl-input")});let d=u.createDiv({cls:"akl-group-keywords-section"});if(d.createEl("h4",{text:"Keywords in this group",cls:"akl-subsection-header"}),s.length===0)d.createEl("p",{text:"No keywords in this group yet. Add keywords below or assign them from the Keywords tab.",cls:"akl-hint-text"});else{let p=d.createDiv({cls:"akl-keywords-list"});s.forEach(g=>{let k=p.createDiv({cls:"akl-keyword-chip"});k.createSpan({text:g.keyword||"Untitled"}),k.createSpan({text:"\xD7",cls:"akl-chip-remove"}).addEventListener("click",async()=>{g.groupId=null,await this.plugin.saveSettings(),this.display()})})}d.createEl("button",{text:"+ Add Keywords to Group",cls:"akl-button-secondary"}).addEventListener("click",()=>{let p=this.plugin.settings.keywords.filter(g=>g.groupId===o.id);new eo(this.app,this.plugin,o.id,p).open()});let f=u.createDiv({cls:"akl-group-settings-section"});f.createEl("h4",{text:"Group Settings",cls:"akl-subsection-header"}),f.createEl("p",{text:"These settings apply to all keywords in this group (unless overridden per-keyword).",cls:"akl-hint-text"}),new N(f).setName("Link scope").setDesc("Where this group's keywords should create links").addDropdown(p=>p.addOption("vault-wide","Vault-wide (link in all notes)").addOption("source-folder","Source folder only").addOption("target-folder","Target folder only").setValue(o.settings.linkScope||"vault-wide").onChange(async g=>{o.settings.linkScope=g,await this.plugin.saveSettings()})),new N(f).setName("Enable tags").setDesc("Add #tag to target notes when linking").addToggle(p=>p.setValue(o.settings.enableTags||!1).onChange(async g=>{o.settings.enableTags=g,await this.plugin.saveSettings()})),new N(f).setName("Suggest mode").setDesc("Suggest links instead of creating them automatically").addToggle(p=>p.setValue(o.settings.suggestMode||!1).onChange(async g=>{o.settings.suggestMode=g,await this.plugin.saveSettings()})),new N(f).setName("Use Markdown links").setDesc("Use [text](link.md) format instead of [[wikilinks]]").addToggle(p=>p.setValue(o.settings.useRelativeLinks||!1).onChange(async g=>{o.settings.useRelativeLinks=g,await this.plugin.saveSettings()})),new N(f).setName("Prevent self-links").setDesc("Don't link keywords on their own target note").addToggle(p=>p.setValue(o.settings.preventSelfLink||!1).onChange(async g=>{o.settings.preventSelfLink=g,await this.plugin.saveSettings()}))}}renderVariationChips(e,t,o){t.length!==0&&t.forEach((s,i)=>{let n=e.createDiv({cls:"akl-chip"});n.createSpan({text:s,cls:"akl-chip-text"});let r=n.createSpan({text:"\xD7",cls:"akl-chip-remove"});r.setAttribute("aria-label",`Remove ${s}`),r.addEventListener("click",async()=>{this.plugin.settings.keywords[o].variations.splice(i,1),await this.plugin.saveSettings(),this.display()})})}renderAliasChips(e,t){!t||t.length===0||t.forEach(o=>{let s=e.createDiv({cls:"akl-chip akl-chip-auto"});s.createSpan({text:o,cls:"akl-chip-text"});let i=s.createSpan({text:"\u{1F517}",cls:"akl-chip-auto-indicator"});i.setAttribute("aria-label","Auto-discovered from note alias"),i.setAttribute("title","Auto-discovered from note frontmatter")})}getAllFolders(){let e=new Set;return this.app.vault.getAllLoadedFiles().filter(o=>o.children).map(o=>o.path).forEach(o=>{o&&o!=="/"&&e.add(o)}),Array.from(e).sort((o,s)=>o.toLowerCase().localeCompare(s.toLowerCase()))}addCustomStyles(){if(document.getElementById("akl-custom-styles"))return;let e=document.createElement("style");e.id="akl-custom-styles",e.textContent=`
            /* Header */
            .akl-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5em;
                flex-wrap: wrap;
                gap: 0.5em;
            }

            .akl-stats {
                color: var(--text-muted);
                font-size: 0.9em;
                padding: 0.25em 0.75em;
                background: var(--background-secondary);
                border-radius: 12px;
            }

            /* Tab Navigation */
            .akl-tab-nav {
                display: flex;
                gap: 0.5em;
                margin-bottom: 1.5em;
                border-bottom: 2px solid var(--background-modifier-border);
                padding-bottom: 0;
            }

            .akl-tab-button {
                padding: 0.75em 1.25em;
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 500;
                transition: all 0.2s ease;
                margin-bottom: -2px;
            }

            .akl-tab-button:hover {
                color: var(--text-normal);
                background: var(--background-modifier-hover);
            }

            .akl-tab-active {
                color: var(--interactive-accent) !important;
                border-bottom-color: var(--interactive-accent) !important;
            }

            /* Responsive: Wrap tabs on portrait phones */
            @media (max-width: 600px) and (orientation: portrait) {
                .akl-tab-nav {
                    flex-wrap: wrap;
                }

                .akl-tab-button {
                    padding: 0.6em 1em;
                    font-size: 0.9em;
                    flex: 0 1 auto;
                }
            }

            .akl-tab-content {
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .akl-stats-bar {
                color: var(--text-muted);
                font-size: 0.9em;
                padding: 0.75em 1em;
                background: var(--background-secondary);
                border-radius: 8px;
                margin-bottom: 1.5em;
            }

            /* Section Headers */
            .akl-section-header {
                margin-top: 2em;
                margin-bottom: 1em;
            }

            .akl-subsection-header {
                margin-top: 1.5em;
                margin-bottom: 0.75em;
                font-size: 1em;
                font-weight: 600;
            }

            /* Empty State */
            .akl-empty-state {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-empty-state p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-empty-hint {
                font-size: 0.9em;
            }

            .akl-hint-text {
                color: var(--text-muted);
                font-size: 0.9em;
                margin: 0.5em 0;
            }

            /* Group-specific styles */
            .akl-group-card {
                border-left: 3px solid var(--interactive-accent);
            }

            .akl-groups-container {
                display: grid;
                gap: 1em;
                margin-bottom: 1em;
            }

            .akl-group-keywords-section,
            .akl-group-settings-section {
                margin-top: 1.5em;
                padding-top: 1.5em;
                border-top: 1px solid var(--background-modifier-border);
            }

            .akl-keywords-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin: 1em 0;
            }

            .akl-keyword-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.4em 0.8em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 12px;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-keyword-chip:hover {
                background: var(--background-modifier-hover);
            }

            .akl-chip-remove {
                cursor: pointer;
                color: var(--text-muted);
                font-size: 1.2em;
                line-height: 1;
                transition: color 0.2s ease;
            }

            .akl-chip-remove:hover {
                color: var(--text-error);
            }

            .akl-button-secondary {
                padding: 0.6em 1.2em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-normal);
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-button-secondary:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .akl-delete-btn {
                padding: 0.5em 1em;
                background: transparent;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.85em;
                transition: all 0.2s ease;
            }

            .akl-delete-btn:hover {
                background: var(--background-modifier-error);
                border-color: var(--text-error);
                color: var(--text-on-accent);
            }

            .akl-section-header h3 {
                margin-bottom: 0.25em;
            }

            .akl-section-desc {
                color: var(--text-muted);
                margin-top: 0;
            }

            /* Search Container */
            .akl-search-container {
                margin-bottom: 1em;
            }

            .akl-search-input {
                width: 100%;
                padding: 0.6em 1em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.95em;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .akl-search-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }

            .akl-search-input::placeholder {
                color: var(--text-muted);
            }

            /* No Results Message */
            .akl-no-results {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-no-results p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-no-results-hint {
                font-size: 0.9em;
            }

            /* Keywords Container */
            .akl-keywords-container {
                display: grid;
                gap: 1em;
                margin-bottom: 1em;
            }

            /* Keyword Card */
            .akl-keyword-card {
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                background: var(--background-primary);
                overflow: hidden;
                transition: box-shadow 0.2s ease, transform 0.2s ease;
            }

            .akl-keyword-card:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            /* Card Header */
            .akl-card-header {
                display: flex;
                align-items: center;
                gap: 0.75em;
                padding: 1em;
                background: var(--background-secondary);
                cursor: pointer;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .akl-card-header:hover {
                background: var(--background-modifier-hover);
            }

            .akl-collapse-btn {
                font-size: 0.8em;
                color: var(--text-muted);
                user-select: none;
                flex-shrink: 0;
                width: 20px;
                text-align: center;
            }

            .akl-card-title {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-weight: 500;
                flex-wrap: wrap;
            }

            .akl-keyword-name {
                color: var(--text-normal);
                font-size: 1.05em;
            }

            .akl-target-name {
                color: var(--text-muted);
                font-size: 0.9em;
            }

            .akl-card-badges {
                display: flex;
                gap: 0.5em;
                flex-wrap: wrap;
            }

            .akl-badge {
                padding: 0.25em 0.6em;
                border-radius: 10px;
                font-size: 0.75em;
                font-weight: 500;
                white-space: nowrap;
            }

            .akl-badge-tags {
                background: var(--color-accent);
                color: white;
            }

            .akl-badge-md-links {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-suggest {
                background: #ffaa00;
                color: white;
            }

            .akl-badge-group {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-variations {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            /* Suggested Link Styles */
            .akl-suggested-link {
                background-color: rgba(255, 170, 0, 0.15);
                border-bottom: 2px dotted #ffaa00;
                cursor: pointer;
                position: relative;
                transition: background-color 0.2s ease;
            }

            .akl-suggested-link:hover {
                background-color: rgba(255, 170, 0, 0.25);
            }

            /* Card Body */
            .akl-card-body {
                padding: 1em;
            }

            .akl-card-body .setting-item {
                border: none;
                padding: 0.75em 0;
            }

            .akl-input {
                width: 100%;
            }

            /* Variations Section */
            .akl-variations-section {
                padding: 0.75em 0;
                border-top: 1px solid var(--background-modifier-border);
                margin-top: 0.5em;
            }

            .akl-variations-section .setting-item-name {
                font-weight: 500;
                margin-bottom: 0.25em;
            }

            .akl-variations-section .setting-item-description {
                color: var(--text-muted);
                font-size: 0.85em;
                margin-bottom: 0.75em;
            }

            .akl-chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin-bottom: 0.75em;
                min-height: 2em;
                align-items: center;
            }

            .akl-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.35em 0.7em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 14px;
                font-size: 0.9em;
                transition: background-color 0.2s ease;
            }

            .akl-chip:hover {
                background: var(--background-modifier-hover);
            }

            .akl-chip-text {
                color: var(--text-normal);
            }

            .akl-chip-remove {
                color: var(--text-muted);
                font-size: 1.2em;
                line-height: 1;
                cursor: pointer;
                padding: 0 0.2em;
                border-radius: 50%;
                transition: color 0.2s ease, background-color 0.2s ease;
            }

            .akl-chip-remove:hover {
                color: var(--text-error);
                background: var(--background-modifier-error);
            }

            /* Auto-discovered alias chips - different style */
            .akl-chip-auto {
                background: var(--interactive-accent-hover);
                border: 1px solid var(--interactive-accent);
                opacity: 0.85;
            }

            .akl-chip-auto:hover {
                opacity: 1;
                background: var(--interactive-accent-hover);
            }

            .akl-chip-auto-indicator {
                font-size: 0.9em;
                opacity: 0.7;
            }

            .akl-no-variations {
                color: var(--text-muted);
                font-style: italic;
                font-size: 0.9em;
            }

            .akl-add-variation {
                margin-top: 0.5em;
            }

            .akl-variation-input {
                width: 100%;
                padding: 0.5em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.9em;
            }

            .akl-variation-input:focus {
                border-color: var(--color-accent);
                outline: none;
            }

            /* Card Footer */
            .akl-card-footer {
                display: flex;
                justify-content: flex-end;
                padding-top: 0.75em;
                margin-top: 0.75em;
                border-top: 1px solid var(--background-modifier-border);
            }

            .akl-delete-btn {
                padding: 0.5em 1em;
                background: transparent;
                color: var(--text-error);
                border: 1px solid var(--text-error);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background-color 0.2s ease, color 0.2s ease;
            }

            .akl-delete-btn:hover {
                background: var(--text-error);
                color: white;
            }

            /* Add Button Container */
            .akl-add-button-container {
                display: flex;
                justify-content: center;
                margin: 1.5em 0;
            }

            .akl-add-button {
                padding: 0.75em 1.5em;
                font-size: 1em;
            }

            /* Responsive Design */
            @media (min-width: 768px) {
                .akl-keywords-container {
                    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
                }
            }

            @media (max-width: 767px) {
                /* Keep everything on one line on narrow screens */
                .akl-card-header {
                    flex-wrap: nowrap;
                    padding: 0.75em 0.5em;
                    gap: 0.4em;
                }

                .akl-collapse-btn {
                    font-size: 0.7em;
                    width: 16px;
                }

                .akl-card-title {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                }

                .akl-keyword-name {
                    font-size: 0.9em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                .akl-target-name {
                    font-size: 0.8em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .akl-card-badges {
                    flex-shrink: 0;
                }

                .akl-badge {
                    padding: 0.2em 0.4em;
                    font-size: 0.65em;
                }

                .akl-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }

            /* Dark mode adjustments */
            .theme-dark .akl-keyword-card:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            /* Animations */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .akl-keyword-card {
                animation: slideIn 0.2s ease-out;
            }

            /* Suggested Keyword Builder Modal Styles */
            .akl-suggestion-modal {
                max-width: 700px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .akl-status {
                margin-bottom: 1em;
                padding: 1em;
                background: var(--background-secondary);
                border-radius: 6px;
            }

            .akl-analyzing {
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-error {
                color: var(--text-error);
            }

            .akl-search-container {
                margin-bottom: 1em;
            }

            .akl-search-input {
                width: 100%;
                padding: 0.6em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.95em;
            }

            .akl-search-input:focus {
                outline: none;
                border-color: var(--color-accent);
            }

            .akl-controls-container {
                display: flex;
                gap: 1em;
                margin-bottom: 1em;
                flex-wrap: wrap;
            }

            .akl-sort-container {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }

            .akl-sort-label {
                color: var(--text-muted);
                font-size: 0.9em;
                white-space: nowrap;
            }

            .akl-sort-select {
                padding: 0.5em 0.8em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.9em;
                cursor: pointer;
            }

            .akl-sort-select:focus {
                outline: none;
                border-color: var(--color-accent);
            }

            .akl-button-row {
                display: flex;
                gap: 0.5em;
                margin-bottom: 1em;
            }

            .akl-mini-button {
                padding: 0.4em 0.8em;
                font-size: 0.85em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                color: var(--text-normal);
            }

            .akl-mini-button:hover {
                background: var(--background-modifier-hover);
            }

            .akl-suggestions-list {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 0.5em;
                background: var(--background-primary);
                margin-bottom: 1em;
            }

            .akl-suggestion-item {
                padding: 0.75em;
                margin-bottom: 0.5em;
                background: var(--background-secondary);
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
            }

            .akl-suggestion-item:hover {
                background: var(--background-modifier-hover);
            }

            .akl-suggestion-header {
                display: flex;
                align-items: center;
                gap: 0.75em;
                margin-bottom: 0.5em;
            }

            .akl-checkbox {
                cursor: pointer;
                width: 16px;
                height: 16px;
            }

            .akl-suggestion-label {
                flex: 1;
            }

            .akl-keyword-text {
                font-weight: 500;
                color: var(--text-normal);
            }

            .akl-count-text {
                color: var(--text-muted);
                font-size: 0.9em;
            }

            .akl-notes-preview {
                margin-bottom: 0.5em;
                padding-left: 2em;
                font-size: 0.85em;
            }

            .akl-notes-label {
                color: var(--text-muted);
                font-weight: 500;
            }

            .akl-notes-list {
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-variation-selector {
                padding-left: 2em;
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-size: 0.85em;
            }

            .akl-variation-label {
                color: var(--text-muted);
            }

            .akl-variation-dropdown {
                flex: 1;
                padding: 0.3em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            }

            .akl-no-results {
                text-align: center;
                padding: 2em;
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-action-row {
                display: flex;
                justify-content: flex-end;
                gap: 0.75em;
                margin-top: 1em;
            }

            .akl-action-row button {
                padding: 0.6em 1.2em;
            }
        `,document.head.appendChild(e)}};It.exports=Be});var Re=D((ja,zt)=>{var{Notice:Nt,Menu:Me,MarkdownView:J}=require("obsidian"),{escapeRegex:Ke}=(W(),P(U));function so(a,e){e.querySelectorAll(".akl-suggested-link").forEach(o=>{o.addEventListener("click",s=>{s.preventDefault(),s.stopPropagation(),new Nt("Switch to edit mode to accept suggestions, or use the review modal")}),o.addEventListener("contextmenu",s=>{s.preventDefault(),s.stopPropagation();let i=new Me;i.addItem(n=>{n.setTitle("\u{1F4CB} Review link suggestions (opens in edit mode)").setIcon("list-checks").onClick(async()=>{let r=a.app.workspace.getActiveViewOfType(J);r&&(await r.setState({mode:"source"},{}),setTimeout(()=>{var c;let l=(c=a.app.workspace.getActiveViewOfType(J))==null?void 0:c.editor;l&&a.reviewSuggestions(l)},100))})}),i.showAtMouseEvent(s)})})}function Dt(a){var n;if(!a.statusBarItem)return;let e=(n=a.app.workspace.getActiveViewOfType(J))==null?void 0:n.editor;if(!e){a.statusBarItem.setText(""),a.statusBarItem.style.display="none";return}let t=e.getValue(),o=/<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/g,s=t.match(o),i=s?s.length:0;i>0?(a.statusBarItem.setText(`\u{1F4A1} ${i} link suggestion${i>1?"s":""}`),a.statusBarItem.style.cursor="pointer",a.statusBarItem.style.display="inline-block",a.statusBarItem.addClass("mod-clickable"),a.statusBarItem.setAttribute("aria-label","Click to review suggestions"),a.statusBarItem.onclick=()=>{var l;let r=(l=a.app.workspace.getActiveViewOfType(J))==null?void 0:l.editor;r&&a.reviewSuggestions(r)}):(a.statusBarItem.setText(""),a.statusBarItem.style.display="none",a.statusBarItem.onclick=null)}function oo(a){a.registerDomEvent(document,"contextmenu",e=>{let t=e.target;if(t&&t.classList&&t.classList.contains("akl-suggested-link")){e.preventDefault();let o=new Me;o.addItem(s=>{s.setTitle("Accept link suggestion").setIcon("check").onClick(()=>{a.acceptSuggestionElement(t)})}),o.showAtMouseEvent(e)}})}function ao(a){a.registerDomEvent(document,"click",e=>{let t=a.app.workspace.getActiveViewOfType(J);if(!t)return;let o=t.editor;if(!o)return;let s=e.target,i=null;if(s.classList&&s.classList.contains("akl-suggested-link")?i=s:s.parentElement&&s.parentElement.classList&&s.parentElement.classList.contains("akl-suggested-link")&&(i=s.parentElement),i){e.preventDefault(),e.stopPropagation();let n=o.getCursor(),r=o.getLine(n.line);Ve(a,o,n.line,r,e)}}),a.registerDomEvent(document,"contextmenu",e=>{let t=a.app.workspace.getActiveViewOfType(J);if(!t)return;let o=t.editor;if(!o)return;let s=e.target,i=null;if(s.classList&&s.classList.contains("akl-suggested-link")?i=s:s.parentElement&&s.parentElement.classList&&s.parentElement.classList.contains("akl-suggested-link")&&(i=s.parentElement),i){e.preventDefault(),e.stopPropagation();let n=o.getCursor(),r=o.getLine(n.line);Ve(a,o,n.line,r,e)}})}function Ve(a,e,t,o,s){let i=/<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g,n=[...o.matchAll(i)];if(n.length===0)return;let r=n[0],l=r[1],c=r[2],u=r[3]==="true",d=r[4],h=new Me;h.addItem(f=>{f.setTitle(`Accept link suggestion: "${d}"`).setIcon("check").onClick(()=>{Ft(a,e,t,o,d,l,c,u)})}),h.showAtMouseEvent(s)}function Ft(a,e,t,o,s,i,n,r){let l=new RegExp(`<span class="akl-suggested-link" data-target="${Ke(i)}" data-block="${Ke(n)}" data-use-relative="${r?"true":"false"}"[^>]*>${Ke(s)}</span>`);if(!l.test(o))return;let c=e.getValue(),u=e.posToOffset({line:t,ch:0}),d=a.isInsideTable(c,u),h,f=n?`${i}#${n}`:i;if(r){let g=d?s.replace(/\|/g,"\\|"):s,k=encodeURIComponent(i)+".md",w=n?`#${n}`:"";h=`[${g}](${k}${w})`}else d?h=i===s&&!n?`[[${s}]]`:`[[${f}\\|${s}]]`:h=i===s&&!n?`[[${s}]]`:`[[${f}|${s}]]`;let p=o.replace(l,h);e.setLine(t,p),new Nt("Link suggestion accepted"),setTimeout(()=>Dt(a),100)}zt.exports={processSuggestedLinks:so,updateStatusBar:Dt,setupSuggestionContextMenu:oo,setupLivePreviewClickHandler:ao,showSuggestionMenuAtLine:Ve,acceptSuggestionInLine:Ft}});var Kt=D((Ha,Bt)=>{function no(){if(document.getElementById("akl-custom-styles"))return;let a=document.createElement("style");a.id="akl-custom-styles",a.textContent=`
        /* Header */
        .akl-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5em;
            flex-wrap: wrap;
            gap: 0.5em;
        }

        .akl-stats {
            color: var(--text-muted);
            font-size: 0.9em;
            padding: 0.25em 0.75em;
            background: var(--background-secondary);
            border-radius: 12px;
        }

        /* Tab Navigation */
        .akl-tab-nav {
            display: flex;
            gap: 0.5em;
            margin-bottom: 1.5em;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 0;
        }

        .akl-tab-button {
            padding: 0.75em 1.25em;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-bottom: -2px;
        }

        .akl-tab-button:hover {
            color: var(--text-normal);
            background: var(--background-modifier-hover);
        }

        .akl-tab-active {
            color: var(--interactive-accent) !important;
            border-bottom-color: var(--interactive-accent) !important;
        }

        /* Responsive: Wrap tabs on portrait phones */
        @media (max-width: 600px) and (orientation: portrait) {
            .akl-tab-nav {
                flex-wrap: wrap;
            }

            .akl-tab-button {
                padding: 0.6em 1em;
                font-size: 0.9em;
                flex: 0 1 auto;
            }
        }

        .akl-tab-content {
            animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .akl-stats-bar {
            color: var(--text-muted);
            font-size: 0.9em;
            padding: 0.75em 1em;
            background: var(--background-secondary);
            border-radius: 8px;
            margin-bottom: 1.5em;
        }

        /* Section Headers */
        .akl-section-header {
            margin-top: 2em;
            margin-bottom: 1em;
        }

        .akl-subsection-header {
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            font-size: 1em;
            font-weight: 600;
        }

        /* Empty State */
        .akl-empty-state {
            text-align: center;
            padding: 3em 2em;
            color: var(--text-muted);
        }

        .akl-empty-state p:first-child {
            font-size: 1.1em;
            font-weight: 500;
            margin-bottom: 0.5em;
            color: var(--text-normal);
        }

        .akl-empty-hint {
            font-size: 0.9em;
        }

        .akl-hint-text {
            color: var(--text-muted);
            font-size: 0.9em;
            margin: 0.5em 0;
        }

        /* Group-specific styles */
        .akl-group-card {
            border-left: 3px solid var(--interactive-accent);
        }

        .akl-groups-container {
            display: grid;
            gap: 1em;
            margin-bottom: 1em;
        }

        .akl-group-keywords-section,
        .akl-group-settings-section {
            margin-top: 1.5em;
            padding-top: 1.5em;
            border-top: 1px solid var(--background-modifier-border);
        }

        .akl-keywords-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
            margin: 1em 0;
        }

        .akl-keyword-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.4em 0.8em;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px;
            font-size: 0.9em;
            transition: all 0.2s ease;
        }

        .akl-keyword-chip:hover {
            background: var(--background-modifier-hover);
        }

        .akl-chip-remove {
            cursor: pointer;
            color: var(--text-muted);
            font-size: 1.2em;
            line-height: 1;
            transition: color 0.2s ease;
        }

        .akl-chip-remove:hover {
            color: var(--text-error);
        }

        .akl-button-secondary {
            padding: 0.6em 1.2em;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            color: var(--text-normal);
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s ease;
        }

        .akl-button-secondary:hover {
            background: var(--background-modifier-hover);
            border-color: var(--interactive-accent);
        }

        .akl-delete-btn {
            padding: 0.5em 1em;
            background: transparent;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.2s ease;
        }

        .akl-delete-btn:hover {
            background: var(--background-modifier-error);
            border-color: var(--text-error);
            color: var(--text-on-accent);
        }

        .akl-section-header h3 {
            margin-bottom: 0.25em;
        }

        .akl-section-desc {
            color: var(--text-muted);
            margin-top: 0;
        }

        /* Search Container */
        .akl-search-container {
            margin-bottom: 1em;
        }

        .akl-search-input {
            width: 100%;
            padding: 0.6em 1em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 0.95em;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .akl-search-input:focus {
            outline: none;
            border-color: var(--interactive-accent);
            box-shadow: 0 0 0 2px var(--interactive-accent-hover);
        }

        .akl-search-input::placeholder {
            color: var(--text-muted);
        }

        /* No Results Message */
        .akl-no-results {
            text-align: center;
            padding: 3em 2em;
            color: var(--text-muted);
        }

        .akl-no-results p:first-child {
            font-size: 1.1em;
            font-weight: 500;
            margin-bottom: 0.5em;
            color: var(--text-normal);
        }

        .akl-no-results-hint {
            font-size: 0.9em;
        }

        /* Keywords Container */
        .akl-keywords-container {
            display: grid;
            gap: 1em;
            margin-bottom: 1em;
        }

        /* Keyword Card */
        .akl-keyword-card {
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-primary);
            overflow: hidden;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .akl-keyword-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Card Header */
        .akl-card-header {
            display: flex;
            align-items: center;
            gap: 0.75em;
            padding: 1em;
            background: var(--background-secondary);
            cursor: pointer;
            border-bottom: 1px solid var(--background-modifier-border);
        }

        .akl-card-header:hover {
            background: var(--background-modifier-hover);
        }

        .akl-collapse-btn {
            font-size: 0.8em;
            color: var(--text-muted);
            user-select: none;
            flex-shrink: 0;
            width: 20px;
            text-align: center;
        }

        .akl-card-title {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 0.5em;
            font-weight: 500;
            flex-wrap: wrap;
        }

        .akl-keyword-name {
            color: var(--text-normal);
            font-size: 1.05em;
        }

        .akl-target-name {
            color: var(--text-muted);
            font-size: 0.9em;
        }

        .akl-card-badges {
            display: flex;
            gap: 0.5em;
            flex-wrap: wrap;
        }

        .akl-badge {
            padding: 0.25em 0.6em;
            border-radius: 10px;
            font-size: 0.75em;
            font-weight: 500;
            white-space: nowrap;
        }

        .akl-badge-tags {
            background: var(--color-accent);
            color: white;
        }

        .akl-badge-md-links {
            background: var(--interactive-accent);
            color: white;
        }

        .akl-badge-suggest {
            background: #ffaa00;
            color: white;
        }

        .akl-badge-group {
            background: var(--interactive-accent);
            color: white;
        }

        .akl-badge-variations {
            background: var(--background-modifier-border);
            color: var(--text-muted);
        }

        /* Suggested Link Styles */
        .akl-suggested-link {
            background-color: rgba(255, 170, 0, 0.15);
            border-bottom: 2px dotted #ffaa00;
            cursor: pointer;
            position: relative;
            transition: background-color 0.2s ease;
        }

        .akl-suggested-link:hover {
            background-color: rgba(255, 170, 0, 0.25);
        }

        /* Card Body */
        .akl-card-body {
            padding: 1em;
        }

        .akl-card-body .setting-item {
            border: none;
            padding: 0.75em 0;
        }

        .akl-input {
            width: 100%;
        }

        /* Variations Section */
        .akl-variations-section {
            padding: 0.75em 0;
            border-top: 1px solid var(--background-modifier-border);
            margin-top: 0.5em;
        }

        .akl-variations-section .setting-item-name {
            font-weight: 500;
            margin-bottom: 0.25em;
        }

        .akl-variations-section .setting-item-description {
            color: var(--text-muted);
            font-size: 0.85em;
            margin-bottom: 0.75em;
        }

        .akl-chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
            margin-bottom: 0.75em;
            min-height: 2em;
            align-items: center;
        }

        .akl-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.4em;
            padding: 0.35em 0.7em;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 14px;
            font-size: 0.9em;
            transition: background-color 0.2s ease;
        }

        .akl-chip:hover {
            background: var(--background-modifier-hover);
        }

        .akl-chip-text {
            color: var(--text-normal);
        }

        .akl-chip-remove {
            color: var(--text-muted);
            font-size: 1.2em;
            line-height: 1;
            cursor: pointer;
            padding: 0 0.2em;
            border-radius: 50%;
            transition: color 0.2s ease, background-color 0.2s ease;
        }

        .akl-chip-remove:hover {
            color: var(--text-error);
            background: var(--background-modifier-error);
        }

        /* Auto-discovered alias chips - different style */
        .akl-chip-auto {
            background: var(--interactive-accent-hover);
            border: 1px solid var(--interactive-accent);
            opacity: 0.85;
        }

        .akl-chip-auto:hover {
            opacity: 1;
            background: var(--interactive-accent-hover);
        }

        .akl-chip-auto-indicator {
            font-size: 0.9em;
            opacity: 0.7;
        }

        .akl-no-variations {
            color: var(--text-muted);
            font-style: italic;
            font-size: 0.9em;
        }

        .akl-add-variation {
            margin-top: 0.5em;
        }

        .akl-variation-input {
            width: 100%;
            padding: 0.5em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 0.9em;
        }

        .akl-variation-input:focus {
            border-color: var(--color-accent);
            outline: none;
        }

        /* Card Footer */
        .akl-card-footer {
            display: flex;
            justify-content: flex-end;
            padding-top: 0.75em;
            margin-top: 0.75em;
            border-top: 1px solid var(--background-modifier-border);
        }

        .akl-delete-btn {
            padding: 0.5em 1em;
            background: transparent;
            color: var(--text-error);
            border: 1px solid var(--text-error);
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background-color 0.2s ease, color 0.2s ease;
        }

        .akl-delete-btn:hover {
            background: var(--text-error);
            color: white;
        }

        /* Add Button Container */
        .akl-add-button-container {
            display: flex;
            justify-content: center;
            margin: 1.5em 0;
        }

        .akl-add-button {
            padding: 0.75em 1.5em;
            font-size: 1em;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
            .akl-keywords-container {
                grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
            }
        }

        @media (max-width: 767px) {
            /* Keep everything on one line on narrow screens */
            .akl-card-header {
                flex-wrap: nowrap;
                padding: 0.75em 0.5em;
                gap: 0.4em;
            }

            .akl-collapse-btn {
                font-size: 0.7em;
                width: 16px;
            }

            .akl-card-title {
                flex: 1;
                min-width: 0;
                overflow: hidden;
            }

            .akl-keyword-name {
                font-size: 0.9em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }

            .akl-target-name {
                font-size: 0.8em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .akl-card-badges {
                flex-shrink: 0;
            }

            .akl-badge {
                padding: 0.2em 0.4em;
                font-size: 0.65em;
            }

            .akl-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }

        /* Dark mode adjustments */
        .theme-dark .akl-keyword-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* Animations */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .akl-keyword-card {
            animation: slideIn 0.2s ease-out;
        }

        /* Suggested Keyword Builder Modal Styles */
        .akl-suggestion-modal {
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .akl-status {
            margin-bottom: 1em;
            padding: 1em;
            background: var(--background-secondary);
            border-radius: 6px;
        }

        .akl-analyzing {
            color: var(--text-muted);
            font-style: italic;
        }

        .akl-error {
            color: var(--text-error);
        }

        .akl-search-container {
            margin-bottom: 1em;
        }

        .akl-search-input {
            width: 100%;
            padding: 0.6em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 0.95em;
        }

        .akl-search-input:focus {
            outline: none;
            border-color: var(--color-accent);
        }

        .akl-controls-container {
            display: flex;
            gap: 1em;
            margin-bottom: 1em;
            flex-wrap: wrap;
        }

        .akl-sort-container {
            display: flex;
            align-items: center;
            gap: 0.5em;
        }

        .akl-sort-label {
            color: var(--text-muted);
            font-size: 0.9em;
            white-space: nowrap;
        }

        .akl-sort-select {
            padding: 0.5em 0.8em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 0.9em;
            cursor: pointer;
        }

        .akl-sort-select:focus {
            outline: none;
            border-color: var(--color-accent);
        }

        .akl-button-row {
            display: flex;
            gap: 0.5em;
            margin-bottom: 1em;
        }

        .akl-mini-button {
            padding: 0.4em 0.8em;
            font-size: 0.85em;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-normal);
        }

        .akl-mini-button:hover {
            background: var(--background-modifier-hover);
        }

        .akl-suggestions-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            padding: 0.5em;
            background: var(--background-primary);
            margin-bottom: 1em;
        }

        .akl-suggestion-item {
            padding: 0.75em;
            margin-bottom: 0.5em;
            background: var(--background-secondary);
            border-radius: 4px;
            border: 1px solid var(--background-modifier-border);
        }

        .akl-suggestion-item:hover {
            background: var(--background-modifier-hover);
        }

        .akl-suggestion-header {
            display: flex;
            align-items: center;
            gap: 0.75em;
            margin-bottom: 0.5em;
        }

        .akl-checkbox {
            cursor: pointer;
            width: 16px;
            height: 16px;
        }

        .akl-suggestion-label {
            flex: 1;
        }

        .akl-keyword-text {
            font-weight: 500;
            color: var(--text-normal);
        }

        .akl-count-text {
            color: var(--text-muted);
            font-size: 0.9em;
        }

        .akl-notes-preview {
            margin-bottom: 0.5em;
            padding-left: 2em;
            font-size: 0.85em;
        }

        .akl-notes-label {
            color: var(--text-muted);
            font-weight: 500;
        }

        .akl-notes-list {
            color: var(--text-muted);
            font-style: italic;
        }

        .akl-variation-selector {
            padding-left: 2em;
            display: flex;
            align-items: center;
            gap: 0.5em;
            font-size: 0.85em;
        }

        .akl-variation-label {
            color: var(--text-muted);
        }

        .akl-variation-dropdown {
            flex: 1;
            padding: 0.3em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            color: var(--text-normal);
        }

        .akl-no-results {
            text-align: center;
            padding: 2em;
            color: var(--text-muted);
            font-style: italic;
        }

        .akl-action-row {
            display: flex;
            justify-content: flex-end;
            gap: 0.75em;
            margin-top: 1em;
        }

        .akl-action-row button {
            padding: 0.6em 1.2em;
        }

        /* Disabled settings (inherited from group) */
        .akl-disabled-setting {
            opacity: 0.6;
        }

        .akl-disabled-setting .setting-item-control {
            pointer-events: none;
        }

        .akl-disabled-setting .setting-item-description {
            font-style: italic;
            color: var(--text-muted);
        }
    `,document.head.appendChild(a)}Bt.exports={addCustomStyles:no}});var Mt=D((Ua,Vt)=>{function ro(a){let e=null,t=new Map,o=new Set;a.registerEvent(a.app.vault.on("modify",s=>{s.extension==="md"&&!o.has(s.path)&&(o.add(s.path),a.linkKeywordsInFile(s,!1,!0).then(i=>{if(o.delete(s.path),i&&i.pendingTags){t.has(s.path)||t.set(s.path,{tagsToAdd:new Set,targetNotesForTags:new Map});let n=t.get(s.path);i.pendingTags.tagsToAdd.forEach(r=>n.tagsToAdd.add(r)),i.pendingTags.targetNotesForTags.forEach((r,l)=>{n.targetNotesForTags.set(l,r)}),e&&clearTimeout(e),e=setTimeout(async()=>{try{for(let[r,l]of t.entries()){let c=a.app.vault.getAbstractFileByPath(r);c&&c.extension==="md"&&(o.add(r),await a.addTagsToFile(c,Array.from(l.tagsToAdd),l.targetNotesForTags),setTimeout(()=>{o.delete(r)},100))}}finally{t.clear(),e=null}},1e3)}}))}))}Vt.exports={setupAutoLinkOnSave:ro}});var qt=D((Ja,Rt)=>{var{MarkdownView:io}=require("obsidian"),{escapeRegex:ae,getContext:lo}=(W(),P(U)),{getFrontmatterBounds:co,isInsideAlias:uo,isPartOfUrl:go,isInsideLinkOrCode:po,isInsideBlockReference:ho,isInsideTable:fo}=fe(),{getEffectiveKeywordSettings:Za,buildKeywordMap:ko,checkLinkScope:mo}=pe(),{findTargetFile:wo,getAliasesForNote:_a,noteHasTag:yo,noteHasLinkToTarget:vo,ensureNoteExists:bo}=re(),{sanitizeTagName:xo,addTagsToContent:So,addTagToTargetNote:Co}=me(),qe=class{constructor(e,t){this.app=e,this.settings=t}async linkKeywordsInFile(e,t=!1,o=!1){if(e.extension!=="md")return null;let s=this.app.workspace.getActiveViewOfType(io),n=s&&s.file.path===e.path?s.editor:null,r=null;n&&!t&&(r=n.getCursor());let l=await this.app.vault.read(e),c=l,u=l.length,d=co(l),h=0,f=[],p=new Set,g=new Map,k=ko(this.app,this.settings),w=Object.keys(k).sort((v,S)=>S.length-v.length),L=new Set,T=[];for(let v of w){let S=k[v].target,E=k[v].enableTags,F=k[v].linkScope||"vault-wide",z=k[v].scopeFolder||"",V=k[v].useRelativeLinks||!1,C=k[v].blockRef||"",I=k[v].requireTag||"",B=k[v].onlyInNotesLinkingTo||!1,M=k[v].suggestMode||!1,K=k[v].preventSelfLink||!1,G=k[v].keywordIndex;if(!v.trim()||!S||!S.trim())continue;if(this.settings.preventSelfLinkGlobal||K){let $=e.basename,A=S.split("/").pop();if($===A)continue}if(B&&!vo(this.app,e,S)||!yo(this.app,S,I)||!mo(this.app,e,S,F,z,wo))continue;this.settings.autoCreateNotes&&await bo(this.app,this.settings,S);let Oe=this.settings.caseSensitive?"g":"gi",Pe=ae(v),b=new RegExp(`\\b${Pe}\\b`,Oe),x,y=[],q=!1;for(;(x=b.exec(l))!==null;){let $=x.index,A=x[0];if(d&&$>=d.start&&$<d.end||$>0&&l[$-1]==="#"||ho(l,$)||po(l,$)||uo(l,$)||go(l,$,A.length))continue;if(this.settings.firstOccurrenceOnly){let H=v.toLowerCase();if(L.has(H))break;let X=this.settings.caseSensitive?new RegExp(`\\[\\[([^\\]]+\\|)?${ae(v)}\\]\\]`):new RegExp(`\\[\\[([^\\]]+\\|)?${ae(v)}\\]\\]`,"i"),ne=this.settings.caseSensitive?new RegExp(`<span class="akl-suggested-link"[^>]*>${ae(v)}</span>`):new RegExp(`<span class="akl-suggested-link"[^>]*>${ae(v)}</span>`,"i");if(X.test(l)||ne.test(l))break;L.add(H)}let R=fo(l,$),We=C?`${S}#${C}`:S,j;if(M){let H=S.replace(/"/g,"&quot;"),X=C.replace(/"/g,"&quot;");j=`<span class="akl-suggested-link" data-target="${H}" data-block="${X}" data-use-relative="${V?"true":"false"}" data-keyword-index="${G}">${A}</span>`}else if(V){let H=R?A.replace(/\|/g,"\\|"):A,X=encodeURIComponent(S)+".md",ne=C?`#${C}`:"";j=`[${H}](${X}${ne})`}else R?j=S===A&&!C?`[[${A}]]`:`[[${We}\\|${A}]]`:j=S===A&&!C?`[[${A}]]`:`[[${We}|${A}]]`;if(y.push({index:$,length:A.length,original:A,replacement:j,lengthDiff:j.length-A.length}),f.push({keyword:A,target:S,context:lo(l,$)}),q=!0,this.settings.firstOccurrenceOnly)break}if(q&&E){let $=xo(v);p.add($),S!==e.basename&&g.set(S,$)}for(let $=y.length-1;$>=0;$--){let A=y[$];l=l.substring(0,A.index)+A.replacement+l.substring(A.index+A.length),h++}for(let $=0;$<y.length;$++)T.push({index:y[$].index,lengthDiff:y[$].lengthDiff})}T.sort((v,S)=>v.index-S.index),p.size>0&&!t&&!o&&(l=await So(l,Array.from(p)));let m=l!==c;if(!t&&m){if(n&&r){if(n.getValue()!==c)return null;let S=c.split(`
`),E=0;for(let C=0;C<r.line&&C<S.length;C++)E+=S[C].length+1;E+=r.ch;let F=0;for(let C of T)C.index<E&&(F+=C.lengthDiff);let z=E+F,V=E>=u-10;if(n.setValue(l),p.size>0&&V){let C=l.split(`
`),I=-1;for(let B=C.length-1;B>=0;B--){let M=C[B].trim();if(M!==""&&!M.match(/^#[\w\-]+(\s+#[\w\-]+)*$/)){I=B;break}}I>=0?n.setCursor({line:I,ch:C[I].length}):n.setCursor({line:0,ch:0})}else{let C=l.split(`
`),I=z,B=0,M=0;for(let K=0;K<C.length;K++){if(I<=C[K].length){B=K,M=I;break}I-=C[K].length+1}n.setCursor({line:B,ch:M})}}else await this.app.vault.modify(e,l);if(!o)for(let[v,S]of g)await Co(this.app,v,S)}if(m){let v={changed:!0,linkCount:h,changes:f,preview:t?l:null};return o&&(p.size>0||g.size>0)&&(v.pendingTags={tagsToAdd:Array.from(p),targetNotesForTags:g}),v}return null}};Rt.exports=qe});var Pt=D((Qa,Ot)=>{function Lo(a){a.addCommand({id:"link-keywords-in-current-note",name:"Link keywords in current note",callback:()=>a.linkKeywordsInCurrentNote(!1)}),a.addCommand({id:"preview-keywords-in-current-note",name:"Preview keyword linking in current note",callback:()=>a.linkKeywordsInCurrentNote(!0)}),a.addCommand({id:"link-keywords-in-all-notes",name:"Link keywords in all notes",callback:()=>a.linkKeywordsInAllNotes(!1)}),a.addCommand({id:"preview-keywords-in-all-notes",name:"Preview keyword linking in all notes",callback:()=>a.linkKeywordsInAllNotes(!0)}),a.addCommand({id:"suggest-keywords",name:"Suggest keywords from notes",callback:()=>a.suggestKeywords()}),a.addCommand({id:"suggest-keywords-current-note",name:"Suggest keywords from current note only",callback:()=>a.suggestKeywordsFromCurrentNote()}),a.addCommand({id:"accept-suggestion-at-cursor",name:"Accept all suggestions on current line",editorCallback:e=>a.acceptSuggestionAtCursor(e),hotkeys:[{modifiers:["Mod"],key:"Enter"}]}),a.addCommand({id:"accept-all-suggestions",name:"Accept all link suggestions in current note",editorCallback:e=>a.acceptAllSuggestions(e)}),a.addCommand({id:"review-link-suggestions",name:"Review link suggestions",editorCallback:e=>a.reviewSuggestions(e)}),a.addCommand({id:"export-keywords",name:"Export keywords to JSON",callback:()=>a.exportKeywords()}),a.addCommand({id:"import-keywords",name:"Import keywords from JSON",callback:()=>a.importKeywords()}),a.addCommand({id:"download-csv-template",name:"Download CSV template",callback:()=>a.downloadCSVTemplate()}),a.addCommand({id:"export-keywords-csv",name:"Export keywords to CSV",callback:()=>a.exportKeywordsToCSV()}),a.addCommand({id:"import-keywords-csv",name:"Import keywords from CSV",callback:()=>a.importKeywordsFromCSV()}),a.addCommand({id:"view-statistics",name:"View statistics",callback:()=>a.showStatistics()})}Ot.exports={registerCommands:Lo}});var Gt=D((Ya,Wt)=>{var Q=Re();function To(a){Q.setupSuggestionContextMenu(a),a.registerMarkdownPostProcessor(e=>{Q.processSuggestedLinks(a,e)}),Q.setupLivePreviewClickHandler(a),a.registerEvent(a.app.workspace.on("editor-menu",(e,t)=>{let o=t.getValue();/<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/.test(o)&&(e.addItem(i=>{i.setTitle("\u{1F4CB} Review all link suggestions...").setIcon("list-checks").onClick(()=>{a.reviewSuggestions(t)})}),e.addItem(i=>{i.setTitle("\u2713 Accept all suggestions on this line").setIcon("check").onClick(()=>{a.acceptSuggestionAtCursor(t)})}),e.addSeparator())})),a.statusBarItem=a.addStatusBarItem(),Q.updateStatusBar(a),a.registerEvent(a.app.workspace.on("active-leaf-change",()=>{Q.updateStatusBar(a)})),a.registerEvent(a.app.workspace.on("editor-change",()=>{setTimeout(()=>Q.updateStatusBar(a),100)}))}Wt.exports={registerEvents:To}});var{Plugin:Eo}=require("obsidian"),{loadSettings:Ao,saveSettings:$o,setupSettingsWatcher:Io}=(He(),P(je)),{getEffectiveKeywordSettings:No,buildKeywordMap:Do,checkLinkScope:Fo}=pe(),{getAliasesForNote:zo,noteHasTag:Bo,noteHasLinkToTarget:Ko,ensureNoteExists:Vo,findTargetFile:jt}=re(),{getStopWords:Mo,extractWordsFromText:Ro,extractPhrasesFromText:qo,analyzeNotesForKeywords:Oo,analyzeCurrentNoteForKeywords:Po}=Qe(),{getFrontmatterBounds:Wo,isInsideAlias:Go,isPartOfUrl:jo,isInsideLinkOrCode:Ho,isInsideBlockReference:Uo,isInsideTable:Zo}=fe(),{sanitizeTagName:_o,addTagsToContent:Jo,addTagsToFile:Qo,addTagToTargetNote:Yo}=me(),{linkKeywordsInCurrentNote:Xo,linkKeywordsInAllNotes:ea}=st(),{suggestKeywords:ta,suggestKeywordsFromCurrentNote:sa,reviewSuggestions:oa,acceptSuggestionAtCursor:aa,acceptAllSuggestions:na}=at(),{exportKeywords:ra,importKeywords:ia,downloadCSVTemplate:la,exportKeywordsToCSV:ca,importKeywordsFromCSV:da}=rt(),{showStatistics:ua}=lt(),ga=dt(),Ht=gt(),pa=ht(),ha=mt(),fa=yt(),ka=xt(),ma=Ct(),wa=$e(),Xa=Ae(),en=Ne(),tn=Fe(),Y=Re(),{addCustomStyles:Ut}=Kt(),{setupAutoLinkOnSave:Zt}=Mt(),ya=qt(),{registerCommands:va}=Pt(),{registerEvents:ba}=Gt();module.exports=class extends Eo{async onload(){this.settings=await Ao(this),Io(this),this.keywordLinker=new ya(this.app,this.settings),va(this),this.addSettingTab(new wa(this.app,this)),Ut(),ba(this),this.settings.autoLinkOnSave&&Zt(this)}processSuggestedLinks(e){return Y.processSuggestedLinks(this,e)}updateStatusBar(){return Y.updateStatusBar(this)}setupSuggestionContextMenu(){return Y.setupSuggestionContextMenu(this)}setupLivePreviewClickHandler(){return Y.setupLivePreviewClickHandler(this)}showSuggestionMenuAtLine(e,t,o,s){return Y.showSuggestionMenuAtLine(this,e,t,o,s)}acceptSuggestionInLine(e,t,o,s,i,n,r){return Y.acceptSuggestionInLine(this,e,t,o,s,i,n,r)}reviewSuggestions(e){return oa(this.app,e,ka)}acceptSuggestionAtCursor(e){return aa(e,this.isInsideTable.bind(this),this.updateStatusBar.bind(this))}acceptAllSuggestions(e){return na(e,this.isInsideTable.bind(this),this.updateStatusBar.bind(this))}showStatistics(){return ua(this.app,this.settings,ga)}async exportKeywords(){return await ra(this.app,this.settings)}async importKeywords(){return await ia(this.app,this,pa)}async downloadCSVTemplate(){return await la(this.app)}async exportKeywordsToCSV(){return await ca(this.app,this.settings)}async importKeywordsFromCSV(){return await da(this.app,this,ha)}async suggestKeywords(){return await ta(this.app,this,Ht)}async suggestKeywordsFromCurrentNote(){return await sa(this.app,this,Ht)}getStopWords(){return Mo(this.settings)}extractWordsFromText(e,t=!1){return Ro(e,t,this.settings)}extractPhrasesFromText(e){return qo(e,this.settings)}async analyzeNotesForKeywords(){return await Oo(this.app,this.settings,this.getAliasesForNote.bind(this))}async analyzeCurrentNoteForKeywords(e){return await Po(this.app,this.settings,e,this.getAliasesForNote.bind(this))}setupAutoLinkOnSave(){return Zt(this)}async linkKeywordsInCurrentNote(e=!1){return await Xo(this.app,this.settings,this.linkKeywordsInFile.bind(this),this.saveSettings.bind(this),this.updateStatusBar.bind(this),fa,e)}async linkKeywordsInAllNotes(e=!1){return await ea(this.app,this.settings,this.linkKeywordsInFile.bind(this),this.saveSettings.bind(this),this,ma,e)}async linkKeywordsInFile(e,t=!1,o=!1){return this.keywordLinker.settings=this.settings,await this.keywordLinker.linkKeywordsInFile(e,t,o)}async addTagsToFile(e,t,o){return await Qo(this.app,e,t,o)}sanitizeTagName(e){return _o(e)}async addTagsToContent(e,t){return await Jo(e,t)}async addTagToTargetNote(e,t){return await Yo(this.app,e,t)}getFrontmatterBounds(e){return Wo(e)}isInsideAlias(e,t){return Go(e,t)}isPartOfUrl(e,t,o){return jo(e,t,o)}isInsideLinkOrCode(e,t){return Ho(e,t)}isInsideBlockReference(e,t){return Uo(e,t)}isInsideTable(e,t){return Zo(e,t)}getEffectiveKeywordSettings(e){return No(this.settings,e)}buildKeywordMap(){return Do(this.app,this.settings)}checkLinkScope(e,t,o,s){return Fo(this.app,e,t,o,s,jt)}findTargetFile(e){return jt(this.app,e)}getAliasesForNote(e){return zo(this.app,e)}noteHasTag(e,t){return Bo(this.app,e,t)}noteHasLinkToTarget(e,t){return Ko(this.app,e,t)}async ensureNoteExists(e){return await Vo(this.app,this.settings,e)}async saveSettings(){await $o(this,this.settings)}addCustomStyles(){return Ut()}};
