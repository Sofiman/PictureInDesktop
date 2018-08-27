let rp = {
    'Youtube': ['/embed', ''],
    'Twitch': ['http://player.twitch.tv/?channel=', 'https://twitch.tv/'],
    'Gist': [/data:text\/html,<script src="(.*)\.js"><\/script>/, '$1'],
    'File': ['', '']
};
let cw = require('electron').remote.getCurrentWindow();
let esurl = cw.embedStreamURL;
let psv = cw.providerService;
let embedIframe = document.querySelector("iframe#embed");

document.querySelector('.controls').style.top = cw.offsetY + "px";
if(cw.darkMode) document.querySelectorAll('.controls *').forEach(el => el.classList.add('dark'));
document.querySelector('#open').href = rp[psv] ? esurl.replace(rp[psv][0], rp[psv][1]) : esurl;
document.querySelector('#close').addEventListener('click', () => cw.closeAll());

embedIframe.addEventListener('load', () => {
    document.getElementById('loader').style.display = 'none';
    let doc = embedIframe.contentDocument, style = doc.createElement("style");
    style.setAttribute('data-author', 'PictureInDesktop');
    style.type = 'text/css';
    style.appendChild(doc.createTextNode('body{margin:0}.gist-file{margin-bottom:0!important}'));
    doc.head.appendChild(style);
});
embedIframe.src = esurl;