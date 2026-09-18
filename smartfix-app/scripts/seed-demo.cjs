// Synthetic, repeatable demo data. Run from smartfix-app: node scripts/seed-demo.cjs [--check|--seed]
const { loadEnvConfig } = require('@next/env');
const { Client } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

loadEnvConfig(process.cwd(), true);
const mode = process.argv[2] || '--check';
if (!['--check', '--seed', '--schema'].includes(mode)) throw new Error('Use --check, --schema or --seed');
const outputPath = path.resolve('.smartfix-data/seed-demo.json');
const uuid = (key) => { const s = crypto.createHash('sha256').update(`smartfix-demo-2026:${key}`).digest('hex'); return `${s.slice(0,8)}-${s.slice(8,12)}-4${s.slice(13,16)}-a${s.slice(17,20)}-${s.slice(20,32)}`; };
const cpf = (n) => { const a = String(700000000+n).padStart(9,'0').split('').map(Number); for (let len=9;len<11;len++) { const v=(a.slice(0,len).reduce((sum,d,i)=>sum+d*(len+1-i),0)*10)%11; a.push(v===10?0:v); } return a.join(''); };
const cnpj = (n) => { const a = String(450000000001+n).padStart(12,'0').split('').map(Number); for (const w of [[5,4,3,2,9,8,7,6,5,4,3,2],[6,5,4,3,2,9,8,7,6,5,4,3,2]]) { const r=a.reduce((sum,d,i)=>sum+d*w[i],0)%11; a.push(r<2?0:11-r); } return a.join(''); };
const people = ['Ana Luiza Nascimento','Bruno Henrique Valente','Camila Torres Azevedo','Diego Rafael Monteiro','Elisa Beatriz Farias','Felipe Augusto Barros','Gabriela Nunes Prado','Hugo César Almeida','Isabela Martins Coelho','João Pedro Siqueira','Larissa Vitória Campos','Marcos Vinícius Duarte','Nadia Cristina Ribeiro','Otávio Luiz Pacheco','Renata Maria Freitas'];
const owners = ['Alice Moraes','Breno Tavares','Cecília Brito','Davi Lacerda','Eduarda Lopes','Fernando Queiroz','Giovana Reis','Heitor Castro','Ingrid Machado','Júlio Nogueira','Karina Moreira','Leandro Viana','Mirela Teixeira','Nicolas Rocha','Olívia Cardoso'];
const companies = ['Circuito Vivo','TecnoPonto','Oficina Pixel','Núcleo Digital','Repara Mais','Eletrônica Aurora','Conecta Lab','Ponto do Chip','Oficina Voltagem','Byte & Cia','Prisma Reparos','Leste Tech','Soluciona Eletrônicos','Ateliê do Hardware','Reparo Central'];
const places = [
  ['São Paulo','SP','01001000'],['Campinas','SP','13010000'],['Santos','SP','11010000'],['Rio de Janeiro','RJ','20010000'],['Niterói','RJ','24020000'],
  ['Belo Horizonte','MG','30110000'],['Curitiba','PR','80010000'],['Porto Alegre','RS','90010000'],['Florianópolis','SC','88010000'],['Salvador','BA','40010000'],
  ['Recife','PE','50010000'],['Fortaleza','CE','60010000'],['Goiânia','GO','74010000'],['Brasília','DF','70040000'],['Vitória','ES','29010000']
];
const streets = ['Rua das Acácias','Avenida do Comércio','Travessa Horizonte','Rua dos Ipês','Alameda das Palmeiras','Avenida Central','Rua Primavera','Travessa do Sol','Rua das Flores','Alameda Parque Verde','Rua das Oliveiras','Avenida Independência','Rua do Mercado','Travessa das Artes','Rua Bela Vista'];
const devices = [
  ['Smartphone','Samsung','Galaxy S23','bateria','Bateria descarrega em poucas horas'],['Notebook','Dell','Inspiron 15','carregamento','Conector de energia apresenta mau contato'],
  ['Tablet','Apple','iPad 10','tela','Tela não responde em parte da superfície'],['Smartwatch','Garmin','Venu 2','bateria','Relógio desliga antes do fim do dia'],
  ['Console','Sony','PlayStation 5','aquecimento','Console aquece e desliga durante jogos'],['Smartphone','Motorola','Edge 40','câmera','Câmera traseira não focaliza'],
  ['Notebook','Lenovo','ThinkPad E14','teclado','Algumas teclas não funcionam'],['Fone de ouvido','JBL','Tune 770NC','áudio','Lado esquerdo apresenta falhas de áudio'],
  ['Tablet','Samsung','Galaxy Tab S9','carregamento','Tablet carrega de forma intermitente'],['Câmera','Canon','EOS R50','conector','Porta USB apresenta mau contato'],
  ['Smartphone','Apple','iPhone 14','tela','Vidro frontal trincado'],['Notebook','Asus','Vivobook 16','ventilação','Ventoinha produz ruído alto'],
  ['Console','Nintendo','Switch OLED','controles','Controle perde conexão durante o uso'],['Impressora','Epson','EcoTank L3250','alimentação','Papel não avança corretamente'],
  ['Smartwatch','Apple','Watch SE','tela','Tela apresenta manchas'],['Smartphone','Xiaomi','Redmi Note 12','áudio','Microfone falha em chamadas'],
  ['Notebook','Acer','Aspire 5','armazenamento','Sistema apresenta lentidão e erros de leitura'],['Tablet','Lenovo','Tab P11','bateria','Bateria não mantém carga'],
  ['Caixa de som','JBL','Flip 6','conector','Porta de carregamento danificada'],['Câmera','Nikon','Z50','botão','Botão disparador responde de forma irregular'],
  ['Smartphone','Google','Pixel 8','carregamento','Carregamento rápido não funciona'],['Notebook','HP','Pavilion 14','tela','Imagem oscila ao mover a tampa'],
  ['Console','Microsoft','Xbox Series S','rede','Conexão Wi-Fi cai durante partidas'],['Tablet','Apple','iPad Air 5','áudio','Alto-falante apresenta distorção'],
  ['Smartwatch','Samsung','Galaxy Watch 6','sensor','Sensor de frequência cardíaca falha'],['Smartphone','Realme','11 Pro','botão','Botão de energia emperrado'],
  ['Notebook','LG','Gram 16','bateria','Autonomia caiu após atualização'],['Impressora','Brother','DCP-L2540DW','alimentação','Equipamento puxa várias folhas'],
  ['Fone de ouvido','Sony','WH-1000XM4','bateria','Fone não mantém carga'],['Console','Valve','Steam Deck','tela','Tela apresenta linhas verticais']
];
const serviceCatalog = [
  ['Diagnóstico eletrônico',7500,2],['Troca de bateria',18900,2],['Troca de tela',39900,4],['Reparo de conector',16900,3],['Limpeza interna',9900,2],
  ['Reparo de placa',44900,7],['Troca de teclado',28900,4],['Manutenção de câmera',24900,4],['Reparo de áudio',19900,3],['Troca de ventoinha',21900,3],
  ['Recuperação de sistema',13900,2],['Substituição de SSD',32900,3],['Calibração de sensores',11900,2],['Reparo de controles',17900,3],['Manutenção de impressora',23900,4],
  ['Limpeza pós líquido',29900,5],['Troca de carcaça',26900,4],['Reparo de rede sem fio',20900,3],['Substituição de alto-falante',15900,3],['Manutenção preventiva',14900,2]
];
const statuses = ['completed','in_progress','waiting_parts','ready','quoted','approved','pending'];
const transition = { completed:['pending','quoted','approved','in_progress','ready','completed'], in_progress:['pending','quoted','approved','in_progress'], waiting_parts:['pending','quoted','approved','in_progress','waiting_parts'], ready:['pending','quoted','approved','in_progress','ready'], quoted:['pending','quoted'], approved:['pending','quoted','approved'], pending:['pending'] };

function build() {
  const data = { clients:[], partners:[], addresses:[], devices:[], services:[], orders:[], reviews:[], credentials:[] };
  for (let i=0;i<15;i++) {
    const ci=uuid(`client:${i}`), pi=uuid(`partner:${i}`);
    const clientPassword=crypto.randomBytes(18).toString('base64url'), partnerPassword=crypto.randomBytes(18).toString('base64url');
    data.clients.push({id:ci,name:people[i],email:`cliente${String(i+1).padStart(2,'0')}@smartfix.example`,cpf:cpf(i+1),phone:`1197100${String(i+1).padStart(4,'0')}`,birthDate:`19${70+i}-0${i%9+1}-${String(i%27+1).padStart(2,'0')}`,passwordHash:bcrypt.hashSync(clientPassword,10)});
    data.partners.push({id:pi,owner:owners[i],company:companies[i],email:`assistencia${String(i+1).padStart(2,'0')}@smartfix.example`,cnpj:cnpj(i+1),phone:`1197200${String(i+1).padStart(4,'0')}`,passwordHash:bcrypt.hashSync(partnerPassword,10)});
    data.credentials.push({type:'Cliente',id:ci,email:data.clients[i].email,password:clientPassword},{type:'Assistência',id:pi,email:data.partners[i].email,password:partnerPassword});
    for (const [kind,ownerId] of [['Cliente',ci],['Assistência',pi]]) for(let j=0;j<3;j++) {
      const p=places[(i+j*4+(kind==='Assistência'?2:0))%places.length];
      const number=String(1000+i*60+j*8+(kind==='Assistência'?3:0));
      data.addresses.push({id:uuid(`address:${kind}:${i}:${j}`),clientId:kind==='Cliente'?ci:null,partnerId:kind==='Assistência'?pi:null,label:['Principal','Trabalho','Alternativo'][j],cep:p[2],street:streets[(i*3+j+(kind==='Assistência'?1:0))%streets.length],number,complement:j===1?`Sala ${i+1}`:j===2?`Bloco ${String.fromCharCode(65+i)}`:'',district:['Centro','Jardim América','Vila Nova','Boa Vista','Bela Vista'][(i+j)%5],city:p[0],state:p[1],primary:j===0});
    }
    for (let j=0;j<4;j++) { const s=serviceCatalog[(i*3+j*5)%serviceCatalog.length]; data.services.push({id:uuid(`service:${i}:${j}`),partnerId:pi,name:s[0],description:`${s[0]} para equipamentos eletrônicos, com diagnóstico e teste funcional.`,priceCents:s[1]+i*230,days:s[2]+i%3}); }
  }
  for(let i=0;i<30;i++) {
    const owner=Math.floor(i/2), spec=devices[i], id=uuid(`device:${i}`), clientId=data.clients[owner].id;
    data.devices.push({id,clientId,type:spec[0],brand:spec[1],model:spec[2],nickname:`${spec[1]} ${spec[2]}`,serial:`SFD2026${String(i+1).padStart(5,'0')}`,issueType:spec[3],issueDescription:spec[4],photoUrl:''});
    for(let j=0;j<2;j++) {
      const partnerIndex=(owner+i+j*7)%15, partnerId=data.partners[partnerIndex].id;
      const status=j===0 && i%2===0?'completed':statuses[(i+j*3)%statuses.length];
      const created=new Date(Date.UTC(2026,7,1+i%25+j*12,12));
      const at=(d)=>new Date(created.getTime()+d*86400000).toISOString();
      const history=transition[status].map((st,k)=>({status:st,at:at(k*2)}));
      const service=data.services.find(s=>s.partnerId===partnerId && s.name!=='Diagnóstico eletrônico') || data.services.find(s=>s.partnerId===partnerId);
      const quote=status==='pending'?[]:[{name:service.name,quantity:1,unitPriceCents:service.priceCents},{name:'Teste funcional',quantity:1,unitPriceCents:3500}];
      const orderId=uuid(`order:${i}:${j}`);
      data.orders.push({id:orderId,clientId,partnerId,deviceId:id,deviceLabel:`${spec[1]} ${spec[2]}`,problem:j===0?spec[4]:`Revisão complementar: ${spec[4].toLowerCase()}`,symptoms:[spec[4]],checklist:['Aparelho recebido','Acessórios conferidos'],status,quote,diagnosis:status==='pending'?'':`Diagnóstico: ${spec[3]} confirmado em teste de bancada.`,history,createdAt:created.toISOString()});
      if(status==='completed') data.reviews.push({id:uuid(`review:${i}:${j}`),orderId,clientId,partnerId,rating:3+(i+j)%3,comment:['Atendimento claro e reparo entregue no prazo.','Equipe cuidadosa e boa comunicação durante o serviço.','Equipamento voltou a funcionar; diagnóstico bem explicado.'][(i+j)%3],date:history.at(-1).at.slice(0,10)});
    }
  }
  return data;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente');
  const ssl=process.env.DB_SSL==='false'?false:{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=='false',...(process.env.DB_SSL_CA_FILE?{ca:fs.readFileSync(process.env.DB_SSL_CA_FILE,'utf8')}:{})};
  const db=new Client({connectionString:process.env.DATABASE_URL,ssl,connectionTimeoutMillis:10000});
  try {
    await db.connect();
    const tables=['clients','partner','client_addresses','devices','partner_services','repair_orders','reviews'];
    const found=(await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)",[tables])).rows.map(x=>x.table_name);
    if(found.length!==tables.length) throw new Error(`Tabelas ausentes: ${tables.filter(x=>!found.includes(x)).join(', ')}`);
    if(mode==='--schema') {
      const names=['workflow_records','smartfix_migrations','support_messages'];
      for(const name of names) console.log(`${name}:`,(await db.query('SELECT to_regclass($1)::text AS value',[`public.${name}`])).rows[0].value || 'ausente');
      if((await db.query("SELECT to_regclass('public.smartfix_migrations')::text AS value")).rows[0].value) console.log('Migrations:',(await db.query('SELECT name FROM public.smartfix_migrations ORDER BY name')).rows.map(x=>x.name));
      return;
    }
    const counts={}; for(const table of tables) counts[table]=Number((await db.query(`SELECT count(*)::int AS n FROM public.${table}`)).rows[0].n);
    console.log('Contagens atuais:',counts);
    if(mode==='--check') {
      if (!fs.existsSync(outputPath)) return;
      const seeded=JSON.parse(fs.readFileSync(outputPath,'utf8'));
      const clientIds=seeded.clients.map(x=>x.id), partnerIds=seeded.partners.map(x=>x.id), deviceIds=seeded.devices.map(x=>x.id), orderIds=seeded.orders.map(x=>x.id), addressIds=seeded.addresses.map(x=>x.id);
      const checks = {
        duplicate_addresses: ["SELECT count(*)::int n FROM (SELECT logradouro, numero, municipio, uf FROM public.client_addresses WHERE id=ANY($1::uuid[]) GROUP BY 1,2,3,4 HAVING count(*) > 1) x",addressIds],
        clients_wrong_addresses: ["SELECT count(*)::int n FROM (SELECT c.id FROM public.clients c LEFT JOIN public.client_addresses a ON a.client_id=c.id AND a.id=ANY($2::uuid[]) WHERE c.id=ANY($1::uuid[]) GROUP BY c.id HAVING count(a.id) <> 3) x",[clientIds,addressIds]],
        partners_wrong_addresses: ["SELECT count(*)::int n FROM (SELECT p.id FROM public.partner p LEFT JOIN public.client_addresses a ON a.partner_id=p.id AND a.id=ANY($2::uuid[]) WHERE p.id=ANY($1::uuid[]) GROUP BY p.id HAVING count(a.id) <> 3) x",[partnerIds,addressIds]],
        clients_wrong_devices: ["SELECT count(*)::int n FROM (SELECT c.id FROM public.clients c LEFT JOIN public.devices d ON d.user_id=c.id AND d.id=ANY($2::uuid[]) WHERE c.id=ANY($1::uuid[]) GROUP BY c.id HAVING count(d.id) <> 2) x",[clientIds,deviceIds]],
        partners_wrong_services: ["SELECT count(*)::int n FROM (SELECT p.id FROM public.partner p LEFT JOIN public.partner_services s ON s.partner_id=p.id WHERE p.id=ANY($1::uuid[]) GROUP BY p.id HAVING count(s.id) < 3) x",partnerIds],
        devices_wrong_orders: ["SELECT count(*)::int n FROM (SELECT d.id FROM public.devices d LEFT JOIN public.repair_orders o ON o.device_id=d.id AND o.id=ANY($2::uuid[]) WHERE d.id=ANY($1::uuid[]) GROUP BY d.id HAVING count(o.id) <> 2 OR count(DISTINCT o.partner_id) <> 2) x",[deviceIds,orderIds]],
        completed_without_review: ["SELECT count(*)::int n FROM public.repair_orders o LEFT JOIN public.reviews r ON r.repair_order_id=o.id WHERE o.id=ANY($1::uuid[]) AND o.status='completed' AND r.id IS NULL",orderIds],
        review_not_completed: ["SELECT count(*)::int n FROM public.reviews r JOIN public.repair_orders o ON o.id=r.repair_order_id WHERE o.id=ANY($1::uuid[]) AND o.status <> 'completed'",orderIds],
        history_wrong_status: ["SELECT count(*)::int n FROM public.repair_orders o WHERE o.id=ANY($1::uuid[]) AND o.history->-1->>'status' IS DISTINCT FROM o.status",orderIds]
      };
      const failures={}; for(const [name,[sql,ids]] of Object.entries(checks)) { const values=Array.isArray(ids[0])?ids:[ids]; const n=Number((await db.query(sql,values)).rows[0].n); if(n) failures[name]=n; }
      console.log('Integridade:',Object.keys(failures).length?failures:'OK');
      if(Object.keys(failures).length) process.exitCode=1;
      return;
    }
    const data=fs.existsSync(outputPath)?JSON.parse(fs.readFileSync(outputPath,'utf8')):build();
    await db.query('BEGIN');
    try {
      for(const x of data.clients) await db.query('INSERT INTO public.clients(id,full_name,email,password_hash,tax_id,phone,birth_date) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',[x.id,x.name,x.email,x.passwordHash,x.cpf,x.phone,x.birthDate]);
      for(const x of data.partners) await db.query('INSERT INTO public.partner(id,full_name,email,password_hash,tax_id,phone,company_name,is_approved) VALUES($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT(id) DO NOTHING',[x.id,x.owner,x.email,x.passwordHash,x.cnpj,x.phone,x.company]);
      for(const x of data.addresses) await db.query('INSERT INTO public.client_addresses(id,client_id,partner_id,apelido,cep,logradouro,numero,complemento,bairro,municipio,uf,is_principal) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING',[x.id,x.clientId,x.partnerId,x.label,x.cep,x.street,x.number,x.complement,x.district,x.city,x.state,x.primary]);
      for(const x of data.devices) await db.query('INSERT INTO public.devices(id,user_id,device_type,brand,model,photo_url,nickname,serial_number,issue_type,issue_description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO NOTHING',[x.id,x.clientId,x.type,x.brand,x.model,x.photoUrl,x.nickname,x.serial,x.issueType,x.issueDescription]);
      for(const x of data.services) await db.query('INSERT INTO public.partner_services(id,partner_id,name,description,unit_price_cents,estimated_days,is_active) VALUES($1,$2,$3,$4,$5,$6,true) ON CONFLICT(id) DO NOTHING',[x.id,x.partnerId,x.name,x.description,x.priceCents,x.days]);
      for(const x of data.orders) { const total=x.quote.reduce((n,q)=>n+q.quantity*q.unitPriceCents,0); await db.query('INSERT INTO public.repair_orders(id,client_id,partner_id,device_id,problem_description,status,request_date,estimated_budget,created_at,device_label,diagnosis,symptoms,checklist,quote,history) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT(id) DO NOTHING',[x.id,x.clientId,x.partnerId,x.deviceId,x.problem,x.status,x.createdAt.slice(0,10),x.quote.length?total/100:null,x.createdAt,x.deviceLabel,x.diagnosis,JSON.stringify(x.symptoms),JSON.stringify(x.checklist),JSON.stringify(x.quote),JSON.stringify(x.history)]); }
      for(const x of data.reviews) await db.query('INSERT INTO public.reviews(id,rating,comment,review_date,client_id,partner_id,repair_order_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',[x.id,x.rating,x.comment,x.date,x.clientId,x.partnerId,x.orderId]);
      const expected={clients:15,partner:15,client_addresses:90,devices:30,partner_services:60,repair_orders:60,reviews:data.reviews.length};
      for(const [table,count] of Object.entries(expected)) { const ids=(table==='clients'?data.clients:table==='partner'?data.partners:table==='client_addresses'?data.addresses:table==='devices'?data.devices:table==='partner_services'?data.services:table==='repair_orders'?data.orders:data.reviews).map(x=>x.id); const actual=Number((await db.query(`SELECT count(*)::int AS n FROM public.${table} WHERE id = ANY($1::uuid[])`,[ids])).rows[0].n); if(actual!==count) throw new Error(`${table}: esperado ${count}, encontrado ${actual}`); }
      await db.query('COMMIT');
      fs.mkdirSync(path.dirname(outputPath),{recursive:true}); fs.writeFileSync(outputPath,JSON.stringify(data,null,2),{mode:0o600});
      console.log('Carga validada:',expected);
    } catch(e) { await db.query('ROLLBACK'); throw e; }
  } finally { await db.end().catch(()=>{}); }
}
main().catch(e=>{console.error('Seed falhou:',e.code||e.message);process.exitCode=1;});
