# JARVIS dashboard: posodobitve in produkcijsko okolje

Ta vodič velja za trenutno postavitev:

| Del | Lokacija | Namen |
| --- | --- | --- |
| Lokalni projekt | `jarvis-dashboard/` na Macu | Izvorna koda in build frontend aplikacije |
| Dashboard LXC | `root@192.168.0.30` | Nginx, frontend in Node.js backend |
| Frontend datoteke | `/var/www/jarvis-dashboard/` | Statični Vite build, ki ga streže Nginx |
| Backend | `/opt/jarvis-dashboard/backend/` | Node.js API, systemd storitev `jarvis-backend` |
| Proxmox host | `jarvis` / `192.168.0.11` | Proxmox API in fizični senzorji |
| Sensor agent | `/opt/jarvis-sensor-agent/sensor_agent.py` na Proxmox hostu | Read-only CPU, disk, RAM, PSI, swap in process meritve hosta |

## Kje se kaj popravlja

| Če spreminjaš | Lokalne datoteke | Kaj nato objaviš |
| --- | --- | --- |
| Videz, postavitev ali tekst dashboarda | `frontend/src/` | `npm run build` in samo `frontend/dist/` |
| Proxmox API, transformacije ali fallbacki | `backend/services/`, `backend/routes/` | `backend/` in restart `jarvis-backend` |
| Fizične diske, RAM, PSI, SMART ali procese hosta | `backend/sensor_agent.py` | `backend/sensor_agent.py` na Proxmox host in restart agenta |
| Produkcijske URL-je, tokene ali reboot dovoljenje | samo LXC `/opt/jarvis-dashboard/backend/.env` | restart `jarvis-backend`; `.env` se ne rsynca |

Najpomembnejši UI paneli:

- `frontend/src/components/resources/LiveResourcesPanel.jsx` in `.css`: **STORAGE OVERVIEW**.
- `frontend/src/components/sensors/HostTelemetryPanel.jsx` in `TemperaturePowerPanel.css`: **MEMORY & WORKLOAD**.
- `frontend/src/components/overview/`: **SYSTEM OVERVIEW**.
- `frontend/src/components/core/`: centralni shader, CPU telemetry in HOST STATUS.

Podatkovni tok je: `sensor_agent.py` na Proxmox hostu → `RemoteHostMetricsReader` v LXC backendu → `/api/resources` in `/api/temperature` → frontend polling na 5 sekund.

## Običajna posodobitev

Iz korena lokalnega projekta najprej zgradi frontend:

```bash
npm run build
```

Nato posodobi statični frontend na dashboard LXC:

```bash
rsync -av --delete \
  frontend/dist/ \
  root@192.168.0.30:/var/www/jarvis-dashboard/
```

Za spremembe backenda prenesi kodo, vendar ohrani produkcijski `.env` in nameščene pakete:

```bash
rsync -av --delete \
  --exclude 'node_modules/' \
  --exclude '.env' \
  backend/ \
  root@192.168.0.30:/opt/jarvis-dashboard/backend/
```

Po backend posodobitvi se prijavi v dashboard LXC in ponovno zaženi API:

```bash
ssh root@192.168.0.30
systemctl restart jarvis-backend
systemctl status jarvis-backend --no-pager
```

Po frontend posodobitvi v brskalniku uporabi `Cmd + Shift + R`, da se naložijo nove hashane datoteke.

## Preverjanje po objavi

V dashboard LXC preveri API:

```bash
curl -s http://127.0.0.1:3001/api/health
curl -s http://127.0.0.1:3001/api/system
curl -s http://127.0.0.1:3001/api/temperature
curl -s http://127.0.0.1:3001/api/quick-actions
```

`/api/health` mora vrniti `"source":"proxmox"` in
`"hostMetricsAvailable":true`. Prek brskalnika isti API preveri na
`http://jarvis-dashboard/api/health`.

Če backend ne deluje, poglej zadnje loge:

```bash
journalctl -u jarvis-backend -n 100 --no-pager
```

Za popolnejši hiter pregled iz Maca:

```bash
curl -s http://jarvis-dashboard/api/health
curl -s http://jarvis-dashboard/api/resources
curl -s http://jarvis-dashboard/api/temperature
ssh jarvis 'systemctl is-active jarvis-sensor-agent'
ssh root@192.168.0.30 'systemctl is-active jarvis-backend'
```

Pri normalnem stanju pričakuj:

- `health`: `source` je `proxmox` in `hostMetricsAvailable` je `true`.
- `resources`: ima `memoryDetails`, `memoryPressure`, `memoryHardware` in `workload`.
- `temperature`: ima dve vrednosti v `storageDevices` (`system` in `data`).
- Obe systemd storitvi vrneta `active`.

## Kako delujejo fallbacki

Če Proxmox API ali sensor agent začasno nista dosegljiva, backend ne sme pasti:

- `RemoteHostMetricsReader` po timeoutu vrne prazne/null meritve.
- Frontend za nedostopne meritve pokaže `N/A`; ne prikazuje izmišljenih ničel.
- PSI `0.00%` in swap `0 B/s` sta veljavni samo, kadar jih host dejansko vrne.
- `CACHE_SECONDS` v agentu omeji obremenitev hosta; zgodovina RAM porabe se hrani samo v pomnilniku agenta in se po restartu začne zbirati znova.

Po večji nadgradnji Proxmoxa ali Node.js vedno zaženi preverjanje iz prejšnjega poglavja. Če se spremeni topologija diskov, mount point `/mnt/storage`, IP dashboard LXC ali API token, preveri tudi `.env` in agentovo `/etc/jarvis-sensor-agent.env`.

## Dnevni health-check

Na dashboard LXC je na voljo systemd timer, ki enkrat dnevno preveri:

- ali je `jarvis-backend` aktiven;
- ali lokalni `/api/health` vrne `status: ok` in `source: proxmox`;
- ali je `hostMetricsAvailable: true`, kar potrdi povezavo do Proxmox sensor agenta.

Po običajnem backend deployu ga namesti in sproži začetni test:

```bash
ssh root@192.168.0.30
/opt/jarvis-dashboard/backend/deploy/install-health-check.sh
systemctl list-timers jarvis-health-check.timer
journalctl -u jarvis-health-check -n 30 --no-pager
```

Timer teče vsak dan ob približno 09:00 (z do 10-minutnim zamikom) in preživi reboot LXC-ja. Ob napaki se v journald zapiše `ALERT`; preveri ga z:

```bash
journalctl -t jarvis-health-alert -n 30 --no-pager
journalctl -u jarvis-health-check -n 100 --no-pager
```

To je lokalni systemd/journald alarm. Za push obvestilo na telefon je treba ločeno izbrati kanal (npr. ntfy, Telegram ali e-mail) in ga dodati v alert service.

## Produkcijski backend `.env`

Datoteka je samo na dashboard LXC: `/opt/jarvis-dashboard/backend/.env`.
Nikoli je ne kopiraj v Git ali v frontend okoljske spremenljivke.

Za Proxmox in senzorje morajo biti nastavljene vsaj naslednje vrednosti:

```dotenv
DASHBOARD_DATA_SOURCE=proxmox
PROXMOX_API_URL=https://192.168.0.11:8006
PROXMOX_NODE_NAME=jarvis
PROXMOX_WEB_URL=https://jarvis.taile46e9c.ts.net/#v1:0:=node%2Fjarvis:4:=jsconsole::::::5
HOST_METRICS_AGENT_URL=http://192.168.0.11:3100
HOST_METRICS_AGENT_TOKEN=<isti-token-kot-v-/etc/jarvis-sensor-agent.env>
```

`PROXMOX_WEB_URL` določa gumb **Open Proxmox**. Brez te nastavitve gumb uporabi
interni naslov `https://192.168.0.11:8006`.

Gumb **Restart Server** je privzeto onemogočen. Vključi ga le, če namerno
želiš dovoliti reboot hosta in ima API token dovoljenje `Sys.PowerMgmt` na
izbranem Proxmox node-u:

```dotenv
PROXMOX_RESTART_ENABLED=true
```

Po vsaki spremembi `.env` zaženi:

```bash
systemctl restart jarvis-backend
```

Za token s privilege separation mora imeti dovoljenje tako uporabnik kot token.
Ker ACL neposredno na `/nodes/jarvis` postane najnatančnejša vloga za node
endpoint, mora vključevati tudi audit pravice, ki jih dashboard uporablja za
branje statusa. Na Proxmox hostu ustvari združeno read/reboot vlogo in jo
dodeli samo node-u:

```bash
sudo pveum role add JARVISReboot -privs 'Datastore.Audit Mapping.Audit Pool.Audit SDN.Audit Sys.Audit VM.Audit VM.GuestAgent.Audit Sys.PowerMgmt'
sudo pveum acl modify /nodes/jarvis -user dashboard@pve -role JARVISReboot
sudo pveum acl modify /nodes/jarvis -token 'dashboard@pve!jarvis-readonly' -role JARVISReboot
sudo pveum user token permissions dashboard@pve jarvis-readonly
```

Če vloga `JARVISReboot` že obstaja, namesto prve vrstice uporabi:

```bash
sudo pveum role modify JARVISReboot -privs 'Datastore.Audit Mapping.Audit Pool.Audit SDN.Audit Sys.Audit VM.Audit VM.GuestAgent.Audit Sys.PowerMgmt'
```

S tem token ne dobi splošne administratorske vloge; dobi samo pravico za
reboot ciljnega node-a. Gumb v dashboardu še vedno pokaže potrditev pred
pošiljanjem zahteve za reboot.

## Sensor agent na Proxmox hostu

Agent teče kot systemd storitev na `jarvis` in ga preveriš tako:

```bash
ssh jarvis
sudo systemctl status jarvis-sensor-agent --no-pager
sudo journalctl -u jarvis-sensor-agent -n 100 --no-pager
```

Njegova konfiguracija je v `/etc/jarvis-sensor-agent.env`. Dostop je omejen
na dashboard LXC IP in bearer token. Ne spreminjaj `SENSOR_AGENT_TOKEN`, ne da
bi istočasno posodobil `HOST_METRICS_AGENT_TOKEN` v dashboard backend `.env`.

Ko spremeniš `backend/sensor_agent.py`, ga iz korena lokalnega projekta kopiraj
na Proxmox host in ponovno zaženi agent:

```bash
scp backend/sensor_agent.py nik@192.168.0.11:/tmp/jarvis-sensor-agent.py
ssh jarvis
sudo install -m 755 /tmp/jarvis-sensor-agent.py /opt/jarvis-sensor-agent/sensor_agent.py
sudo systemctl restart jarvis-sensor-agent
sudo systemctl status jarvis-sensor-agent --no-pager
```

Če spremeniš še systemd unit, kopiraj tudi njega in pred restartom uporabi:

```bash
sudo systemctl daemon-reload
```

## Kaj se sme brisati z `--delete`

`--delete` pri `frontend/dist/` je zaželen: odstrani stare hashane assete.
Pri backend kopiji sta `.env` in `node_modules/` izrecno izključena, zato
produkcijske skrivnosti in paketi ostanejo na strežniku. Ne dodajaj
`--delete-excluded`, ker bi s tem izbrisal produkcijski `.env`.
