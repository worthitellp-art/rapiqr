<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Integrations — RepiQR Style Dashboard</title>
<style>
  :root{
    --bg:#ffffff;
    --sidebar:#f8f8f9;
    --text:#161618;
    --muted:#717177;
    --muted-2:#929297;
    --border:#e7e7e9;
    --border-2:#dcdce0;
    --blue:#4665d9;
    --blue-dark:#24479f;
    --blue-soft:#eef2ff;
    --green:#13866a;
    --green-bg:#edfaf5;
    --green-border:#7bcbb9;
    --orange:#9c6412;
    --orange-bg:#fff7e8;
    --orange-border:#e7bb7a;
    --red:#a44531;
    --red-bg:#fff1ed;
    --red-border:#e1a18f;
    --shadow:0 10px 30px rgba(21,21,25,.05);
  }

  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0;
    font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
    color:var(--text);
    background:var(--bg);
    overflow:hidden;
  }
  button,input,select{font:inherit}

  .app{display:flex;height:100vh;min-height:620px}

  /* SIDEBAR */
  .sidebar{
    width:246px;
    min-width:246px;
    background:var(--sidebar);
    border-right:1px solid var(--border);
    display:flex;
    flex-direction:column;
    transition:.2s ease;
    z-index:20;
  }
  .brand-row{
    height:54px;
    display:flex;
    align-items:center;
    padding:0 14px;
    gap:9px;
  }
  .brand{
    display:flex;
    align-items:center;
    gap:8px;
    font-size:15px;
    font-weight:650;
  }
  .brand-logo{
    width:17px;height:17px;border-radius:4px;background:#111;position:relative;
  }
  .brand-logo:after{
    content:"";position:absolute;left:4px;top:4px;width:6px;height:6px;border-radius:2px;background:#73d8eb;
  }
  .brand-arrow{font-size:13px;color:#8f8f94;margin-left:1px}
  .sidebar-device{
    margin-left:auto;width:14px;height:14px;border:1px solid #aaa;border-radius:2px;background:#fff;position:relative;
  }
  .sidebar-device:after{content:"";position:absolute;right:-2px;top:3px;width:2px;height:7px;background:#aaa;border-radius:1px}

  .side-search{
    height:35px;
    margin:3px 12px 10px;
    display:flex;align-items:center;gap:8px;
    padding:0 10px;
    border:1px solid var(--border-2);
    border-radius:8px;
    background:#fff;
    color:#77777d;
    font-size:12.5px;
    box-shadow:0 1px 2px rgba(0,0,0,.02)
  }
  .search-icon{
    width:13px;height:13px;border:1.6px solid #66676c;border-radius:50%;position:relative;flex:none;
  }
  .search-icon:after{
    content:"";position:absolute;width:5px;height:1.5px;background:#66676c;right:-4px;bottom:-2px;
    transform:rotate(45deg);border-radius:2px;
  }
  .shortcut{margin-left:auto;padding:1px 5px;border:1px solid #ededee;background:#fafafa;border-radius:5px;font-size:10px;color:#8b8b90}

  .nav{padding:0 8px;overflow:auto;scrollbar-width:none}
  .nav::-webkit-scrollbar{display:none}
  .nav-item{
    min-height:30px;
    display:flex;align-items:center;gap:9px;
    padding:0 10px;
    margin:2px 0;
    border-radius:7px;
    color:#26262b;
    font-size:13px;
    cursor:pointer;
  }
  .nav-item:hover{background:#fff}
  .nav-item.active{
    background:#fff;
    color:#25489f;
    box-shadow:0 0 0 1px #dfdfe2,0 1px 2px rgba(0,0,0,.03)
  }
  .ico{
    width:15px;min-width:15px;height:15px;
    display:flex;align-items:center;justify-content:center;
    color:#707076;font-size:13px
  }
  .active .ico{color:#4160ca}
  .section-title{
    display:flex;align-items:center;gap:7px;
    margin:14px 10px 5px;
    color:#5e5e63;font-size:10px;font-weight:700;letter-spacing:.08em;
  }
  .section-title .arrow{font-size:10px;color:#8a8a8e}
  .subnav{padding-left:19px}
  .footer{
    margin-top:auto;
    padding:10px 14px 13px;
    color:#68686d;
    font-size:12px;
    line-height:24px
  }
  .oneleet{
    display:flex;align-items:center;gap:7px;margin-top:4px;font-weight:750;color:#222225;font-size:16px
  }
  .oneleet-mark{
    width:21px;height:21px;border-radius:3px;background:#e54f2f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800
  }

  /* MAIN */
  .main{flex:1;min-width:0;display:flex;flex-direction:column}
  .content{height:100%;padding:28px 30px 0;overflow:hidden}
  .page-head{display:flex;justify-content:space-between;gap:24px}
  .title h1{
    margin:0;font-size:26px;line-height:1.2;font-weight:740;letter-spacing:-.035em
  }
  .title p{margin:8px 0 0;color:var(--muted);font-size:14px}
  .add-btn{
    height:35px;padding:0 14px;border:0;border-radius:8px;
    display:flex;align-items:center;gap:7px;
    color:#fff;background:var(--blue);
    font-size:13px;font-weight:650;
    cursor:pointer;white-space:nowrap;
    box-shadow:0 2px 4px rgba(57,78,170,.18)
  }
  .add-btn:hover{filter:brightness(.97)}
  .plus{font-size:19px;font-weight:300;line-height:1}

  .tabs{
    display:flex;align-items:flex-end;gap:35px;
    height:58px;margin-top:24px;border-bottom:1px solid var(--border)
  }
  .tab{
    position:relative;height:39px;
    display:flex;align-items:center;
    padding:0 1px;
    font-size:14px;color:#626269;
    cursor:pointer
  }
  .tab.active{color:var(--blue-dark);font-weight:600}
  .tab.active:after{
    content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;
    background:#3f5fd3;border-radius:3px 3px 0 0
  }

  .toolbar{
    min-height:73px;
    display:flex;align-items:center;justify-content:space-between;gap:15px;
    border-bottom:1px solid var(--border)
  }
  .toolbar-left{display:flex;align-items:center;gap:10px;min-width:0}
  .toolbar-search{
    width:198px;height:35px;
    display:flex;align-items:center;gap:9px;
    padding:0 10px;
    color:#77777d;font-size:12.5px;
    border:1px solid var(--border-2);border-radius:8px;
    background:#fff
  }
  .toolbar-search input{
    width:100%;border:0;outline:0;background:transparent;color:var(--text)
  }
  .toolbar-search input::placeholder{color:#8a8a8e}
  .filters{display:flex;gap:10px}
  .select{
    min-width:142px;height:35px;
    border:1px solid var(--border-2);border-radius:8px;
    padding:0 10px;
    display:flex;align-items:center;
    font-size:10px;color:#55555b;letter-spacing:.05em;
    background:#fff;cursor:pointer
  }
  .select strong{font-size:12px;letter-spacing:0;margin-left:7px;color:#313136;font-weight:550}
  .select .arrow{margin-left:auto;color:#777;font-size:11px}

  .table-wrap{height:calc(100% - 241px);overflow:auto;scrollbar-width:thin}
  .thead,.row{
    display:grid;
    grid-template-columns:minmax(390px,1fr) 190px 140px 235px;
    align-items:center;
  }
  .thead{
    min-height:44px;
    color:#67676d;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
    border-bottom:1px solid var(--border)
  }
  .thead>div,.row>div{padding:0 10px}
  .group{
    min-height:39px;
    display:flex;align-items:center;
    border-bottom:1px solid var(--border);
    font-size:12px
  }
  .group-count{margin-left:11px;color:#55555b}

  .row{
    min-height:70px;
    background:#fff;
    border-bottom:1px solid var(--border);
    transition:background .15s ease
  }
  .row:hover{background:#fcfcfd}
  .integration{display:flex;align-items:center;gap:14px;min-width:0}
  .integration-logo{
    width:28px;height:28px;min-width:28px;
    display:flex;align-items:center;justify-content:center;
    font-size:21px;font-weight:800
  }
  .integration-logo.square{
    width:26px;height:26px;min-width:26px;background:#101010;color:#bbda4d;border-radius:2px;font-size:13px
  }
  .name{font-size:14.5px;font-weight:630;line-height:18px}
  .type{margin-top:1px;color:#717177;font-size:12px}
  .assets{font-size:12px;padding-left:19px!important}
  .status-cell{display:flex;align-items:center}

  .badge{
    display:inline-flex;align-items:center;justify-content:center;
    min-height:23px;padding:0 9px;
    border:1px solid;border-radius:13px;
    font-size:10.5px;font-weight:560;white-space:nowrap
  }
  .badge.red{background:var(--red-bg);border-color:var(--red-border);color:#93402e}
  .badge.orange{background:var(--orange-bg);border-color:var(--orange-border);color:#93600d}
  .badge.green{background:var(--green-bg);border-color:var(--green-border);color:#13745e}
  .group .badge{min-height:23px}

  .monitor{
    display:inline-flex;align-items:center;
    border:1px solid #d7d7da;border-radius:14px;overflow:hidden;background:#fff
  }
  .monitor span{
    min-width:41px;height:24px;padding:0 8px;
    display:flex;align-items:center;justify-content:center;gap:4px;
    border-right:1px solid #e0e0e2;
    color:#67676c;font-size:11px
  }
  .monitor span:last-child{border-right:0}
  .ok{color:#16876a;font-weight:750}
  .fail{color:#d05a43;font-weight:750}
  .pause{font-size:10px}
  .sync{font-size:12px;color:#777}

  /* DIRECTORY */
  .directory{display:none;height:calc(100% - 241px);overflow:auto;padding:20px 2px 30px}
  .directory.visible{display:block}
  .table-view.hidden{display:none}
  .dir-grid{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:14px
  }
  .dir-card{
    border:1px solid var(--border);
    border-radius:12px;
    background:#fff;
    padding:17px;
    box-shadow:0 2px 8px rgba(15,15,25,.025);
    min-height:150px;
    display:flex;flex-direction:column
  }
  .dir-card:hover{box-shadow:var(--shadow)}
  .dir-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .dir-logo{
    width:33px;height:33px;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    background:#f4f4f5;font-size:20px;font-weight:800
  }
  .dir-title{font-size:14px;font-weight:650}
  .dir-type{font-size:11px;color:var(--muted);margin-top:3px}
  .dir-desc{font-size:12px;color:#65656b;line-height:18px;margin:13px 0}
  .dir-bottom{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .dir-category{font-size:10px;color:#7a7a80;background:#f7f7f8;border:1px solid var(--border);border-radius:10px;padding:4px 8px}
  .connect-btn{
    height:29px;padding:0 10px;border:1px solid #cfd4e8;background:#f8f9ff;color:#3152b2;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer
  }

  /* Mobile */
  .mobile-header{display:none}
  .scrim{display:none}

  @media (max-width:1200px){
    .sidebar{width:220px;min-width:220px}
    .content{padding-left:22px;padding-right:22px}
    .thead,.row{grid-template-columns:minmax(330px,1fr) 165px 110px 210px}
    .dir-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  }

  @media (max-width:900px){
    body{overflow:auto}
    .app{min-height:100vh;height:auto}
    .sidebar{
      position:fixed;left:-255px;top:0;bottom:0;width:250px;min-width:250px;
      box-shadow:14px 0 30px rgba(0,0,0,.08)
    }
    .sidebar.open{left:0}
    .scrim{
      position:fixed;inset:0;background:rgba(15,15,18,.18);z-index:15
    }
    .scrim.show{display:block}
    .mobile-header{
      display:flex;height:56px;align-items:center;gap:12px;padding:0 16px;
      border-bottom:1px solid var(--border);background:#fff;position:sticky;top:0;z-index:10
    }
    .hamburger{
      width:35px;height:35px;border:1px solid var(--border-2);background:#fff;border-radius:8px;font-size:18px;cursor:pointer
    }
    .mobile-brand{font-size:15px;font-weight:650}
    .content{height:auto;min-height:calc(100vh - 56px);padding:22px 16px 25px;overflow:visible}
    .toolbar{flex-wrap:wrap;padding:13px 0;min-height:auto}
    .filters{width:100%}
    .select{flex:1}
    .table-wrap{height:auto;overflow:visible}
    .thead{display:none}
    .row{
      display:grid;
      grid-template-columns:1fr auto;
      gap:12px;
      padding:14px 0;
      min-height:0
    }
    .row>div{padding:0 8px}
    .row .status-cell{grid-column:1}
    .row .assets{grid-column:2;grid-row:1;justify-self:end;padding-top:0!important}
    .row .monitor-cell{grid-column:1/-1}
    .group{margin-top:7px;padding:0 8px}
    .monitor-cell{padding-top:3px!important}
    .dir-grid{grid-template-columns:1fr}
    .directory{height:auto;overflow:visible}
  }

  @media (max-width:560px){
    .page-head{align-items:flex-start}
    .title h1{font-size:23px}
    .title p{font-size:12px;line-height:17px;max-width:230px}
    .add-btn{width:38px;padding:0;justify-content:center;font-size:0}
    .add-btn .plus{font-size:21px}
    .tabs{gap:22px;overflow:auto}
    .tab{font-size:13px;white-space:nowrap}
    .toolbar-search{width:100%}
    .filters{gap:7px}
    .select{min-width:0;font-size:9px}
    .select strong{font-size:11px}
    .name{font-size:14px}
    .type{font-size:11px}
  }
</style>
</head>
<body>
<div class="app">
  <div class="scrim" id="scrim"></div>

  <aside class="sidebar" id="sidebar">
    <div class="brand-row">
      <div class="brand">
        <span class="brand-logo"></span><span>Fathom</span><span class="brand-arrow">⌄</span>
      </div>
      <span class="sidebar-device"></span>
    </div>

    <div class="side-search">
      <span class="search-icon"></span><span>Search...</span><span class="shortcut">⌘ K</span>
    </div>

    <nav class="nav">
      <div class="nav-item"><span class="ico">▦</span>Dashboard</div>
      <div class="nav-item"><span class="ico">▰</span>Documents</div>
      <div class="nav-item active"><span class="ico">◈</span>Integrations</div>

      <div class="section-title">COMPLIANCE <span class="arrow">⌄</span></div>
      <div class="subnav">
        <div class="nav-item">Frameworks</div>
        <div class="nav-item">Controls</div>
        <div class="nav-item">Monitors</div>
        <div class="nav-item">Risk assessment</div>
        <div class="nav-item">Trust page</div>
      </div>

      <div class="section-title">MONITORING <span class="arrow">⌄</span></div>
      <div class="subnav">
        <div class="nav-item"><span class="ico">♢</span>Attack surface</div>
        <div class="nav-item">Code security</div>
      </div>

      <div class="section-title">ORGANIZATION <span class="arrow">⌄</span></div>
      <div class="subnav">
        <div class="nav-item">♙ People</div>
        <div class="nav-item">▤ Devices</div>
        <div class="nav-item">◒ Vendors</div>
        <div class="nav-item">▣ Accounts</div>
        <div class="nav-item">◈ Assets</div>
      </div>
    </nav>

    <div class="footer">
      <div>Contact us</div>
      <div>Documentation</div>
      <div>Status</div>
      <div>Changelog</div>
      <div class="oneleet"><span class="oneleet-mark">1L</span>oneleet</div>
    </div>
  </aside>

  <main class="main">
    <header class="mobile-header">
      <button class="hamburger" id="menuBtn">☰</button>
      <div class="mobile-brand">Fathom</div>
    </header>

    <div class="content">
      <div class="page-head">
        <div class="title">
          <h1>Integrations</h1>
          <p>Connect Fathom with the tools you already use</p>
        </div>
        <button class="add-btn" id="addBtn"><span class="plus">＋</span><span>Add integration</span></button>
      </div>

      <div class="tabs">
        <div class="tab active" data-tab="active">Active integrations</div>
        <div class="tab" data-tab="directory">Integration directory</div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-search">
            <span class="search-icon"></span>
            <input id="search" placeholder="Search integrations..." />
          </div>
        </div>
        <div class="filters">
          <div class="select" id="categoryFilter">CATEGORY <strong>All</strong><span class="arrow">⌄</span></div>
          <div class="select" id="statusFilter">STATUS <strong>All</strong><span class="arrow">⌄</span></div>
        </div>
      </div>

      <div class="table-wrap table-view" id="activeView">
        <div class="thead">
          <div>Integration</div><div>Status</div><div>Assets</div><div>Monitor status</div>
        </div>

        <div class="group"><span class="badge red">Connection failed</span><span class="group-count">3</span></div>
        <div class="row integration-row" data-name="Doppler" data-status="Connection failed" data-category="Security">
          <div class="integration"><div class="integration-logo" style="color:#a74abd">✣</div><div><div class="name">Doppler</div><div class="type">Secrets management</div></div></div>
          <div class="status-cell"><span class="badge red">Connection failed</span></div>
          <div class="assets">12</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>24</span><span><b class="fail">×</b>4</span><span>◫ 1</span><span>◌ 1</span></div></div>
        </div>

        <div class="row integration-row" data-name="Mezmo" data-status="Connection failed" data-category="Cloud">
          <div class="integration"><div class="integration-logo square">m</div><div><div class="name">Mezmo</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge red">Connection failed</span></div>
          <div class="assets">23</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>16</span><span><b class="fail">×</b>2</span><span>◫ 2</span><span>◌ 1</span></div></div>
        </div>

        <div class="row integration-row" data-name="Github" data-status="Connection failed" data-category="Developer">
          <div class="integration"><div class="integration-logo">●</div><div><div class="name">Github</div><div class="type">Version control</div></div></div>
          <div class="status-cell"><span class="badge red">Connection failed</span></div>
          <div class="assets">47</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>11</span><span><b class="fail">×</b>0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="group"><span class="badge orange">Needs setup</span><span class="group-count">2</span></div>
        <div class="row integration-row" data-name="Supabase" data-status="Needs setup" data-category="Cloud">
          <div class="integration"><div class="integration-logo" style="color:#2dbd8a">⚡</div><div><div class="name">Supabase</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge orange">Need setup</span></div><div class="assets">0</div>
          <div class="monitor-cell"><div class="monitor"><span>✓ 0</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="row integration-row" data-name="JumpCloud" data-status="Needs setup" data-category="Device">
          <div class="integration"><div class="integration-logo" style="color:#243d70">♣</div><div><div class="name">JumpCloud</div><div class="type">Mobile device management</div></div></div>
          <div class="status-cell"><span class="badge orange">Need setup</span></div><div class="assets">0</div>
          <div class="monitor-cell"><div class="monitor"><span>✓ 0</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="group"><span class="badge green">Connected</span><span class="group-count">16</span></div>
        <div class="row integration-row" data-name="Fly.io" data-status="Connected" data-category="Cloud">
          <div class="integration"><div class="integration-logo" style="color:#6254e7">✦</div><div><div class="name">Fly.io</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge green">Connected</span></div><div class="assets">16</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>23</span><span>× 0</span><span>◫ 5</span><span>◌ 0</span></div></div>
        </div>

        <div class="row integration-row" data-name="Cloudflare" data-status="Connected" data-category="Cloud">
          <div class="integration"><div class="integration-logo" style="color:#ef8a20">☁</div><div><div class="name">Cloudflare</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge green">Connected</span></div><div class="assets">12</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>8</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="row integration-row" data-name="Azure" data-status="Connected" data-category="Cloud">
          <div class="integration"><div class="integration-logo" style="color:#1682d2">A</div><div><div class="name">Azure</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge green">Connected</span></div><div class="assets">6</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>5</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="row integration-row" data-name="Vercel" data-status="Connected" data-category="Developer">
          <div class="integration"><div class="integration-logo">▲</div><div><div class="name">Vercel</div><div class="type">Cloud provider</div></div></div>
          <div class="status-cell"><span class="badge green">Connected</span></div><div class="assets">24</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>11</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>

        <div class="row integration-row" data-name="Tailscale" data-status="Connected" data-category="Network">
          <div class="integration"><div class="integration-logo" style="font-size:15px;letter-spacing:-3px">••<br>••</div><div><div class="name">Tailscale</div><div class="type">VPN</div></div></div>
          <div class="status-cell"><span class="badge green">Connected</span></div><div class="assets">12</div>
          <div class="monitor-cell"><div class="monitor"><span><b class="ok">✓</b>4</span><span>× 0</span><span>◫ 0</span><span>◌ 0</span></div></div>
        </div>
      </div>

      <div class="directory" id="directoryView">
        <div class="dir-grid">
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">◒</div><div><div class="dir-title">Datadog</div><div class="dir-type">Monitoring</div></div></div><span class="badge green">Popular</span></div><div class="dir-desc">Monitor applications, infrastructure, logs and security signals in one place.</div><div class="dir-bottom"><span class="dir-category">Observability</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">✣</div><div><div class="dir-title">Sentry</div><div class="dir-type">Error tracking</div></div></div></div><div class="dir-desc">Capture application errors and performance issues with developer-friendly diagnostics.</div><div class="dir-bottom"><span class="dir-category">Developer</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">◉</div><div><div class="dir-title">Slack</div><div class="dir-type">Communication</div></div></div></div><div class="dir-desc">Receive security alerts, integration events and workflow updates in channels.</div><div class="dir-bottom"><span class="dir-category">Productivity</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">◈</div><div><div class="dir-title">Jira</div><div class="dir-type">Project management</div></div></div></div><div class="dir-desc">Connect projects and issues to keep engineering and security workflows aligned.</div><div class="dir-bottom"><span class="dir-category">Management</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">⌘</div><div><div class="dir-title">1Password</div><div class="dir-type">Secrets management</div></div></div></div><div class="dir-desc">Securely centralize credentials, vaults and access information for teams.</div><div class="dir-bottom"><span class="dir-category">Security</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">◐</div><div><div class="dir-title">Notion</div><div class="dir-type">Knowledge base</div></div></div></div><div class="dir-desc">Bring documentation, policies and knowledge workflows into the security stack.</div><div class="dir-bottom"><span class="dir-category">Productivity</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">☁</div><div><div class="dir-title">AWS</div><div class="dir-type">Cloud provider</div></div></div><span class="badge green">Popular</span></div><div class="dir-desc">Inventory cloud infrastructure and continuously inspect connected resources.</div><div class="dir-bottom"><span class="dir-category">Cloud</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">◍</div><div><div class="dir-title">Google Cloud</div><div class="dir-type">Cloud provider</div></div></div></div><div class="dir-desc">Connect cloud projects and resources for centralized visibility and monitoring.</div><div class="dir-bottom"><span class="dir-category">Cloud</span><button class="connect-btn">Connect</button></div></div>
          <div class="dir-card"><div class="dir-top"><div style="display:flex;gap:11px;align-items:center"><div class="dir-logo">✚</div><div><div class="dir-title">Okta</div><div class="dir-type">Identity</div></div></div></div><div class="dir-desc">Connect identity providers and manage access visibility across your organization.</div><div class="dir-bottom"><span class="dir-category">Identity</span><button class="connect-btn">Connect</button></div></div>
        </div>
      </div>
    </div>
  </main>
</div>

<script>
  const tabs = document.querySelectorAll('.tab');
  const activeView = document.getElementById('activeView');
  const directoryView = document.getElementById('directoryView');
  const searchInput = document.getElementById('search');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isDirectory = tab.dataset.tab === 'directory';
      activeView.classList.toggle('hidden', isDirectory);
      directoryView.classList.toggle('visible', isDirectory);
      document.querySelector('.toolbar').style.display = isDirectory ? 'none' : 'flex';
    });
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.integration-row').forEach(row => {
      row.style.display = row.dataset.name.toLowerCase().includes(q) ? '' : 'grid';
      if (!q) row.style.display = '';
    });
  });

  document.querySelectorAll('.connect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = 'Connected';
      btn.style.color = '#13745e';
      btn.style.borderColor = '#91d3c4';
      btn.style.background = '#f0fbf7';
    });
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    document.querySelector('[data-tab="directory"]').click();
    window.scrollTo({top:0,behavior:'smooth'});
  });

  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menuBtn');

  function closeSidebar(){
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  }
  menuBtn?.addEventListener('click', () => {
    sidebar.classList.add('open');
    scrim.classList.add('show');
  });
  scrim.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (window.innerWidth <= 900) closeSidebar();
    });
  });
</script>
</body>
</html>
