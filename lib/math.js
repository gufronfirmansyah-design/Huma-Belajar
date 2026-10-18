// Shared text renderer. Input stays plain text in the database; never interpret HTML.
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function formula(text, display = false) {
  const source=String(text ?? '');
  try {
    if(!globalThis.katex) throw Error('Pemuat rumus belum tersedia. Muat ulang halaman.');
    if(source.length>2000) throw Error('Rumus terlalu panjang; pisahkan menjadi beberapa rumus.');
    if(/\\(?:href|url|includegraphics|html\w*|def|gdef|edef|xdef|let|newcommand|renewcommand)\b/.test(source)) throw Error('Gunakan perintah matematika biasa, tanpa tautan atau definisi perintah.');
    return `<span class="math-fragment${display?' math-display':''}">${globalThis.katex.renderToString(source,{throwOnError:true,trust:false,strict:'warn',displayMode:display,maxExpand:100,maxSize:10,macros:{}})}</span>`;
  } catch(error) {
    return `<span class="math-error"><code>${escape(source)}</code><small>Rumus belum dapat ditampilkan. Periksa penulisan atau muat ulang halaman.</small></span>`;
  }
}
export function mathText(value) {
  const text=String(value ?? ''); let html='', plain='',i=0,count=0;
  const flush=()=>{html+=escape(plain).replace(/\n/g,'<br>');plain='';};
  while(i<text.length) {
    if(text[i]==='\\' && text[i+1]==='$'){plain+='$';i+=2;continue;}
    if(text[i]!=='$'){plain+=text[i++];continue;}
    const delimiter=text[i+1]==='$'?'$$':'$'; let end=i+delimiter.length;
    for(;end<text.length;end++) {
      if(text[end]==='\\'){end++;continue;}
      if(text.startsWith(delimiter,end)) break;
    }
    if(end>=text.length){plain+=text.slice(i);break;}
    const source=text.slice(i+delimiter.length,end);
    if(!source.trim()){plain+=delimiter+source+delimiter;i=end+delimiter.length;continue;}
    flush();
    html+=count++<100 ? formula(source,delimiter==='$$') : escape(delimiter+source+delimiter);
    i=end+delimiter.length;
  }
  flush();return html;
}
